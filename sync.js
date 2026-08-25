/* Detour sync — optional, off until you turn it on.
 *
 * One secret GitHub gist holds a single JSON file. Every device pulls it,
 * merges it into its own copy, and pushes the result back. The app stays
 * local-first: everything works offline and sync catches up later.
 *
 * Merge is per record, not per file. Every task, block tick, routine tick and
 * note carries a timestamp; the newest edit to each individual record wins.
 * So an evening of ticking blocks on the phone and an afternoon of adding
 * tasks on the laptop both survive. Deletes leave a tombstone so they do not
 * come back on the next pull.
 *
 * The payload is encrypted in the browser before it leaves, if you set a
 * passphrase. A "secret" gist is unlisted, not private — anyone holding the
 * URL can read it — so the passphrase is what actually keeps this yours.
 */
(function () {
"use strict";

var D = window.DETOUR;
if (!D) return;

var CFGKEY   = "detour.sync.v1";     /* kept OUT of app state — state gets uploaded */
var FILENAME = "detour-state.json";
var API      = "https://api.github.com";
var PULL_GAP = 30000;                /* don't re-pull more often than this on focus */
var PUSH_WAIT = 3000;                /* debounce after the last edit */
var TOMB_TTL = 90 * 86400000;        /* forget deletions after 90 days */

/* ========================= config ========================= */
function loadCfg() {
  try {
    var c = JSON.parse(localStorage.getItem(CFGKEY) || "{}");
    if (!c.device) c.device = guessDevice();
    return c;
  } catch (e) { return { device: guessDevice() }; }
}
function saveCfg() { try { localStorage.setItem(CFGKEY, JSON.stringify(cfg)); } catch (e) {} }
function guessDevice() {
  var ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android";
  return "Browser";
}
var cfg = loadCfg();
function configured() { return !!(cfg.token && cfg.gistId); }

/* Accepts anything you might paste: a bare ID, the gist URL, a URL with a
   trailing slash, or a /revisions link. The ID is the long hex segment. */
function parseGistId(input) {
  var s = String(input || "").trim().replace(/[#?].*$/, "");
  if (!s) return "";
  var parts = s.split("/").filter(Boolean);
  for (var i = parts.length - 1; i >= 0; i--) {
    if (/^[0-9a-f]{16,}$/i.test(parts[i])) return parts[i];
  }
  return parts.length ? parts[parts.length - 1] : "";
}

/* ========================= status ========================= */
var status = { state: "off", msg: "", at: cfg.lastAt || null };
function setStatus(state, msg) {
  status.state = state;
  status.msg = msg || "";
  if (state === "ok") { status.at = new Date().toISOString(); cfg.lastAt = status.at; saveCfg(); }
  var el = document.getElementById("syncdot");
  if (el) el.dataset.state = state;
  if (typeof refreshPanel === "function") refreshPanel();
}
function statusLine() {
  if (!configured()) return "Off — this device only";
  if (status.state === "syncing") return "Syncing…";
  if (status.state === "error") return "Problem — " + status.msg;
  if (status.at) return "Synced " + relTime(status.at) + " · " + cfg.device;
  return "Connected — not synced yet";
}
function relTime(iso) {
  var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.round(s / 60) + "m ago";
  if (s < 86400) return Math.round(s / 3600) + "h ago";
  return Math.round(s / 86400) + "d ago";
}

/* ========================= flatten =========================
   State becomes a flat map of independently-mergeable records.
   Keys must be stable across devices and reversible. */

var LISTS = [
  ["ms",   "milestones"],
  ["task", "tasks"],
  ["tpl",  "templates"],
  ["rt",   "routines"],
  ["n90",  "ninety"],
  ["note", "notes"]
];
var PREFS = ["theme", "wwwMode"];

function flatten(S) {
  var f = {};
  LISTS.forEach(function (L) {
    (S[L[1]] || []).forEach(function (o, i) {
      if (o && o.id != null) f[L[0] + ":" + o.id] = { v: o, i: i };
    });
  });
  PREFS.forEach(function (k) { f["p:" + k] = { v: S[k], i: 0 }; });

  Object.keys(S.blockState || {}).forEach(function (dk) {
    Object.keys(S.blockState[dk] || {}).forEach(function (bk) {
      f["bs:" + dk + "|" + bk] = { v: S.blockState[dk][bk], i: 0 };
    });
  });
  Object.keys(S.routineLog || {}).forEach(function (k) { f["rl:" + k] = { v: S.routineLog[k], i: 0 }; });
  Object.keys(S.weekPlans || {}).forEach(function (k) { f["wp:" + k] = { v: S.weekPlans[k], i: 0 }; });
  Object.keys(S.blockRoutines || {}).forEach(function (k) { f["br:" + k] = { v: S.blockRoutines[k], i: 0 }; });
  Object.keys(S.removed || {}).forEach(function (dk) {
    (S.removed[dk] || []).forEach(function (tid) { f["rm:" + dk + "|" + tid] = { v: 1, i: 0 }; });
  });
  Object.keys(S.extras || {}).forEach(function (dk) {
    (S.extras[dk] || []).forEach(function (b, i) {
      if (b && b.key != null) f["ex:" + dk + "|" + b.key] = { v: b, i: i };
    });
  });
  return f;
}

/* Rebuild state from the merged map. `base` carries everything we do not
   sync per-record — projects, sliders, releases, Mementos — which change
   only when seed.js changes, i.e. on deploy, not on a device. */
function unflatten(f, base) {
  var S = base;
  LISTS.forEach(function (L) { S[L[1]] = []; });
  S.blockState = {}; S.routineLog = {}; S.weekPlans = {};
  S.blockRoutines = {}; S.removed = {}; S.extras = {};

  var listOrder = {};
  LISTS.forEach(function (L) { listOrder[L[0]] = []; });

  Object.keys(f).forEach(function (key) {
    var c = key.indexOf(":");
    var p = key.slice(0, c), rest = key.slice(c + 1), e = f[key];
    if (!e) return;

    if (listOrder[p]) { listOrder[p].push({ v: e.v, i: e.i == null ? 1e9 : e.i, id: rest }); return; }

    if (p === "p") { S[rest] = e.v; return; }
    if (p === "rl") { S.routineLog[rest] = e.v; return; }
    if (p === "wp") { S.weekPlans[rest] = e.v; return; }
    if (p === "br") { S.blockRoutines[rest] = e.v; return; }

    var bar = rest.indexOf("|");
    if (bar < 0) return;
    var dk = rest.slice(0, bar), sub = rest.slice(bar + 1);
    if (p === "bs") {
      if (!S.blockState[dk]) S.blockState[dk] = {};
      S.blockState[dk][sub] = e.v;
    } else if (p === "rm") {
      if (!S.removed[dk]) S.removed[dk] = [];
      if (S.removed[dk].indexOf(sub) < 0) S.removed[dk].push(sub);
    } else if (p === "ex") {
      if (!S.extras[dk]) S.extras[dk] = [];
      S.extras[dk].push({ v: e.v, i: e.i == null ? 1e9 : e.i });
    }
  });

  /* stable order: original position first, id as the tie-break so two
     devices that both appended end up agreeing */
  LISTS.forEach(function (L) {
    listOrder[L[0]].sort(function (a, b) { return a.i - b.i || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
    S[L[1]] = listOrder[L[0]].map(function (x) { return x.v; });
  });
  Object.keys(S.extras).forEach(function (dk) {
    S.extras[dk].sort(function (a, b) { return a.i - b.i; });
    S.extras[dk] = S.extras[dk].map(function (x) { return x.v; });
  });
  return S;
}

/* ========================= stamping =========================
   Rather than tagging every mutation site by hand (and forgetting one),
   diff the flattened state against the last snapshot on every save. */
var lastSnap = null, lastRef = null;

function snapshot(f) {
  var o = {};
  Object.keys(f).forEach(function (k) { o[k] = JSON.stringify(f[k].v); });
  return o;
}

/* Wall clocks on two devices are never exactly equal, and "newest wins" is
   only as good as the clocks. So the stamp is also a logical counter: any
   edit made after seeing the other device's state is guaranteed to sort
   after it, whatever the phone thinks the time is. */
function nextStamp(S) {
  var t = Math.max(Date.now(), (S.clock || 0) + 1);
  S.clock = t;
  return t;
}

function reconcile() {
  var S = D.state;
  if (!S.stamps) S.stamps = {};
  if (!S.tombs) S.tombs = {};
  var f = flatten(S), cur = snapshot(f), now = nextStamp(S);

  if (!lastSnap || lastRef !== S) {          /* first run, or state was replaced wholesale */
    Object.keys(cur).forEach(function (k) { if (!S.stamps[k]) S.stamps[k] = now; });
    lastSnap = cur; lastRef = S;
    return;
  }
  Object.keys(cur).forEach(function (k) {
    if (lastSnap[k] !== cur[k]) S.stamps[k] = now;
  });
  Object.keys(lastSnap).forEach(function (k) {
    if (!(k in cur)) { S.tombs[k] = now; delete S.stamps[k]; }
  });
  lastSnap = cur; lastRef = S;
}

/* ========================= merge ========================= */
function mergeStates(local, remote) {
  var lf = flatten(local), rf = flatten(remote);
  var ls = local.stamps || {}, rs = remote.stamps || {};
  var lt = local.tombs || {}, rt = remote.tombs || {};

  var keys = {}, out = {}, stamps = {}, tombs = {};
  [lf, rf, lt, rt].forEach(function (m) { Object.keys(m).forEach(function (k) { keys[k] = 1; }); });

  Object.keys(keys).forEach(function (k) {
    var alive = Math.max(ls[k] || 0, rs[k] || 0);
    var dead  = Math.max(lt[k] || 0, rt[k] || 0);
    if (dead && dead >= alive) { tombs[k] = dead; return; }     /* deleted, and the delete is the newer fact */
    var pick = (ls[k] || 0) >= (rs[k] || 0) ? lf[k] : rf[k];
    if (!pick) pick = lf[k] || rf[k];
    if (!pick) return;
    out[k] = pick; stamps[k] = alive || Date.now();
  });

  var cutoff = Date.now() - TOMB_TTL;
  Object.keys(tombs).forEach(function (k) { if (tombs[k] < cutoff) delete tombs[k]; });

  var base = JSON.parse(JSON.stringify(local));
  var merged = unflatten(out, base);
  merged.stamps = stamps;
  merged.tombs = tombs;

  /* adopt the highest clock either side has seen, so the next edit here
     sorts after everything already known to either device */
  var hi = Math.max(local.clock || 0, remote.clock || 0);
  Object.keys(stamps).forEach(function (k) { if (stamps[k] > hi) hi = stamps[k]; });
  Object.keys(tombs).forEach(function (k) { if (tombs[k] > hi) hi = tombs[k]; });
  merged.clock = hi;
  return merged;
}

/* ========================= encryption =========================
   AES-GCM with a PBKDF2-derived key. Needs a secure context: https, or
   localhost. Opening the app over a bare LAN IP has no crypto.subtle. */
function canEncrypt() { return !!(window.crypto && window.crypto.subtle); }
function b64(buf) {
  var b = new Uint8Array(buf), s = "";
  for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}
function unb64(str) {
  var s = atob(str), b = new Uint8Array(s.length);
  for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
}
function deriveKey(pass, salt) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"])
    .then(function (base) {
      return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt, iterations: 200000, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
}
function encryptPayload(obj, pass) {
  var salt = crypto.getRandomValues(new Uint8Array(16));
  var iv = crypto.getRandomValues(new Uint8Array(12));
  return deriveKey(pass, salt).then(function (key) {
    return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv },
      key, new TextEncoder().encode(JSON.stringify(obj)));
  }).then(function (ct) {
    return { enc: "aes-gcm-pbkdf2", salt: b64(salt), iv: b64(iv), ct: b64(ct) };
  });
}
function decryptPayload(p, pass) {
  if (!pass) return Promise.reject(new Error("this gist is encrypted — set the passphrase"));
  return deriveKey(pass, unb64(p.salt)).then(function (key) {
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(p.iv) }, key, unb64(p.ct));
  }).then(function (buf) {
    return JSON.parse(new TextDecoder().decode(buf));
  }).catch(function () {
    throw new Error("wrong passphrase");
  });
}

/* ========================= GitHub ========================= */
function api(path, opts) {
  opts = opts || {};
  return fetch(API + path, {
    method: opts.method || "GET",
    headers: {
      "Authorization": "Bearer " + cfg.token,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: opts.body
  }).then(function (r) {
    if (r.status === 401) throw new Error("token rejected");
    if (r.status === 403) throw new Error("token lacks Gists write access");
    if (r.status === 404) throw new Error("gist not found on this account");
    if (!r.ok) throw new Error("GitHub " + r.status);
    return r.json();
  });
}

var remotePublic = false;

function pullRemote() {
  return api("/gists/" + cfg.gistId).then(function (g) {
    remotePublic = !!g.public;
    var file = g.files && g.files[FILENAME];
    if (!file) return null;          /* fine — first push adds it, other files are left alone */
    var text = file.truncated
      ? fetch(file.raw_url).then(function (r) { return r.text(); })
      : Promise.resolve(file.content);
    return Promise.resolve(text).then(function (t) {
      var payload = JSON.parse(t);
      if (payload && payload.enc) return decryptPayload(payload, cfg.pass);
      return payload;
    });
  });
}

function pushRemote(state) {
  var body = { app: "detour", v: 1, at: new Date().toISOString(), device: cfg.device, state: state };
  return Promise.resolve(cfg.pass ? encryptPayload(body, cfg.pass) : body).then(function (payload) {
    var files = {};
    files[FILENAME] = { content: JSON.stringify(payload) };
    return api("/gists/" + cfg.gistId, { method: "PATCH", body: JSON.stringify({ files: files }) });
  });
}

/* ========================= the loop ========================= */
var busy = false, lastPull = 0, pushTimer = null;

function syncNow(opts) {
  opts = opts || {};
  if (!configured()) return Promise.resolve();
  if (busy) return Promise.resolve();
  busy = true;
  setStatus("syncing");
  reconcile();

  return pullRemote().then(function (remote) {
    if (remote && remote.state) {
      var merged = mergeStates(D.state, remote.state);
      D.setState(merged);
      lastSnap = null; lastRef = null;
      reconcile();
      D.render();
    }
    return pushRemote(D.state);
  }).then(function () {
    lastPull = Date.now();
    setStatus("ok");
    if (opts.loud) D.toast("Synced");
  }).catch(function (e) {
    setStatus("error", e.message || "failed");
    if (opts.loud) D.toast("Sync failed — " + (e.message || ""));
  }).then(function () { busy = false; });
}

function schedulePush() {
  if (!configured() || !cfg.auto) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(function () { syncNow(); }, PUSH_WAIT);
}

/* every save nudges a push; every return to the app pulls */
D.onSave = function () { reconcile(); schedulePush(); };
document.addEventListener("visibilitychange", function () {
  if (document.hidden || !configured()) return;
  if (Date.now() - lastPull > PULL_GAP) syncNow();
});
window.addEventListener("online", function () { if (configured()) syncNow(); });
if (configured()) setTimeout(function () { syncNow(); }, 600);

/* ========================= panel ========================= */
var refreshPanel = null;

function openSyncPanel() {
  D.openSheet("Sync", function (body) {
    var h = D.h, on = D.on, esc = D.esc;

    function rebuild() {
      body.innerHTML = "";

      var card = h("div", "card");
      var row = h("div", "row");
      var dot = h("span", "syncdot"); dot.id = "syncdot"; dot.dataset.state = status.state;
      row.appendChild(dot);
      row.appendChild(h("div", "h-md", statusLine()));
      card.appendChild(row);
      card.appendChild(h("div", "dim",
        "Your plan lives on this device. Turn this on and a single secret gist becomes the shared copy every device merges into."));
      body.appendChild(card);

      if (!configured()) {
        body.appendChild(h("div", "eyebrow", "1 · A token"));
        body.appendChild(h("div", "muted",
          "On GitHub: <b>Settings → Developer settings → Personal access tokens → Fine-grained tokens</b>. " +
          "Give it an expiry, and under <b>Account permissions</b> set <b>Gists: Read and write</b>. Nothing else. " +
          "It only ever touches gists, and you can revoke it at any time."));
        var tok = h("input"); tok.type = "password"; tok.placeholder = "github_pat_…";
        tok.value = cfg.token || "";
        body.appendChild(field("Token", tok));

        body.appendChild(h("div", "eyebrow", "2 · A passphrase"));
        body.appendChild(h("div", "muted",
          "A secret gist is unlisted, not private — anyone with the URL can read it. With a passphrase the file is " +
          "encrypted in the browser before it leaves, so the URL alone is worthless. " +
          "<b>Use the same passphrase on every device.</b> Lose it and the remote copy is unreadable — " +
          "your local copy is untouched, but you would have to start the gist over."));
        var pass = h("input"); pass.type = "password"; pass.placeholder = "something you will not forget";
        pass.value = cfg.pass || "";
        body.appendChild(field("Passphrase", pass));
        if (!canEncrypt()) {
          body.appendChild(h("div", "dim",
            "This page is not on a secure origin, so encryption is unavailable here. Use the GitHub Pages URL or localhost — not the bare 192.168 address."));
        }

        body.appendChild(h("div", "eyebrow", "3 · The gist"));
        body.appendChild(h("div", "muted",
          "First device: create one and name it whatever you like — the name is only for you, " +
          "Detour finds it by ID. Every device after that: paste that same ID (or the gist's URL)."));
        var gname = h("input"); gname.type = "text";
        gname.placeholder = "Detour — synced plan";
        gname.value = cfg.gistName || "";
        body.appendChild(field("Name it", gname));
        var gid = h("input"); gid.type = "text"; gid.placeholder = "paste an existing gist ID or URL";
        body.appendChild(field("…or connect to an existing gist", gid));

        var mk = h("button", "btn wide"); mk.textContent = "Create a new secret gist";
        on(mk, "click", function () {
          if (!tok.value.trim()) { D.toast("Token first"); return; }
          cfg.token = tok.value.trim();
          cfg.pass = pass.value || "";
          cfg.gistName = gname.value.trim();
          saveCfg();
          mk.disabled = true; mk.textContent = "Creating…";
          var files = {};
          files[FILENAME] = { content: JSON.stringify({ app: "detour", v: 1, state: null }) };
          api("/gists", { method: "POST", body: JSON.stringify({
            description: cfg.gistName || "Detour — synced plan (do not edit by hand)",
            public: false, files: files }) })
            .then(function (g) {
              cfg.gistId = g.id; cfg.auto = true; saveCfg();
              return syncNow({ loud: true });
            })
            .then(rebuild)
            .catch(function (e) {
              mk.disabled = false; mk.textContent = "Create a new secret gist";
              D.toast(e.message || "Could not create the gist");
            });
        });
        body.appendChild(mk);

        var join = h("button", "btn ghost wide"); join.textContent = "Connect to an existing gist";
        on(join, "click", function () {
          var id = parseGistId(gid.value);
          if (!tok.value.trim() || !id) { D.toast("Token and gist ID"); return; }
          cfg.token = tok.value.trim(); cfg.pass = pass.value || ""; cfg.gistId = id; cfg.auto = true;
          saveCfg();
          syncNow({ loud: true }).then(rebuild);
        });
        body.appendChild(join);
        return;
      }

      /* ---- connected ---- */
      var idc = h("div", "card");
      idc.appendChild(h("div", "eyebrow", "Gist ID — paste this on your other device"));
      var idv = h("div", "mono"); idv.style.wordBreak = "break-all"; idv.style.fontSize = "13px";
      idv.textContent = cfg.gistId;
      idc.appendChild(idv);
      var copy = h("button", "btn ghost sm"); copy.textContent = "Copy";
      on(copy, "click", function () {
        navigator.clipboard.writeText(cfg.gistId).then(function () { D.toast("Copied"); },
          function () { D.toast("Select it and copy manually"); });
      });
      idc.appendChild(copy);
      idc.appendChild(h("div", "dim", cfg.pass
        ? "Encrypted before upload. The other device needs the same passphrase."
        : "Not encrypted — anyone with the gist URL can read this. Add a passphrase below."));
      body.appendChild(idc);

      if (remotePublic) {
        var warn = h("div", "card");
        warn.style.borderColor = "var(--bad)";
        warn.appendChild(h("div", "eyebrow", "This gist is public"));
        warn.appendChild(h("div", "muted", cfg.pass
          ? "It is listed on your GitHub profile and anyone can find it. The contents are encrypted, but the fact of it is visible. Make a secret gist instead when you get a moment."
          : "<b>Your whole plan is world-readable and searchable.</b> Delete this gist, create a secret one, and set a passphrase."));
        body.appendChild(warn);
      }

      var now = h("button", "btn wide"); now.textContent = "Sync now";
      on(now, "click", function () { syncNow({ loud: true }).then(rebuild); });
      body.appendChild(now);

      var auto = h("button", "btn ghost wide");
      auto.textContent = cfg.auto ? "Auto-sync is on" : "Auto-sync is off";
      on(auto, "click", function () { cfg.auto = !cfg.auto; saveCfg(); rebuild(); });
      body.appendChild(auto);
      body.appendChild(h("div", "dim",
        "Auto-sync pushes a few seconds after you change something and pulls whenever you come back to the app."));

      var pass2 = h("input"); pass2.type = "password"; pass2.value = cfg.pass || "";
      pass2.placeholder = cfg.pass ? "" : "add one — same on every device";
      body.appendChild(field("Passphrase", pass2));
      var setp = h("button", "btn ghost wide"); setp.textContent = "Save passphrase & re-upload";
      on(setp, "click", function () {
        cfg.pass = pass2.value || ""; saveCfg();
        syncNow({ loud: true }).then(rebuild);
      });
      body.appendChild(setp);

      var off = h("button", "btn ghost wide"); off.textContent = "Disconnect this device";
      on(off, "click", function () {
        if (!confirm("Stop syncing on this device? Your plan stays here; the gist is untouched.")) return;
        cfg = { device: cfg.device }; saveCfg(); setStatus("off"); rebuild();
      });
      body.appendChild(off);
    }

    function field(label, node) {
      var l = h("label", "fld");
      l.appendChild(h("span", null, label));
      l.appendChild(node);
      return l;
    }

    refreshPanel = null;
    rebuild();
  });
}

D.syncPanel = openSyncPanel;
D.syncStatusLine = statusLine;
D.syncNow = syncNow;
})();
