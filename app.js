/* Detour — LA Era scheduler. Vanilla JS, local-first, no build step. */
(function () {
"use strict";

/* ============================ storage ============================ */
var KEY = "detour.app.v1";
var S = null;

function freshState() {
  var seed = window.DETOUR_SEED;
  return {
    version: 1,
    schema: 2,
    createdAt: new Date().toISOString(),
    theme: "auto",
    wwwMode: "day",
    stamps: {},        /* record key -> last edit time, for sync merging */
    tombs: {},         /* record key -> deletion time */
    clock: 0,          /* logical clock, so device skew can't reorder edits */
    projects: clone(seed.projects),
    sliders: clone(seed.sliders),
    milestones: clone(seed.milestones),
    tasks: clone(seed.tasks || []),
    blockRoutines: clone(seed.blockRoutines || {}),
    ninety: clone(seed.ninety),
    later: clone(seed.later),
    stopDoing: seed.stop,
    templates: clone(seed.blockTemplates),
    routines: clone(seed.routines),
    mementos: clone(seed.mementos),
    releases: clone(seed.releases),
    removed: {},      // dateKey -> [templateId]
    extras: {},       // dateKey -> [block]
    blockState: {},   // dateKey -> { blockKey: {done, note} }
    routineLog: {},   // "routineId|periodKey" -> iso
    weekPlans: {},    // weekKey -> {planned, at, meals, workouts, focus}
    notes: []         // {id, ts, text, projectId}
  };
}
function clone(x) { return JSON.parse(JSON.stringify(x)); }

function load() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) { S = JSON.parse(raw); }
  } catch (e) { S = null; }
  if (!S || !S.version) S = freshState();
  // forward-compat: make sure new seed fields exist
  ["removed","extras","blockState","routineLog","weekPlans"].forEach(function(k){ if(!S[k]) S[k]={}; });
  if (!S.notes) S.notes = [];
  migrate();
  return S;
}

/* Schema migrations.
   The device's localStorage copy is authoritative once it exists — editing
   seed.js only changes fresh installs. Every structural change therefore has
   to arrive here as well, or it never reaches the phone. */
var TEMPLATE_SLIDERS = {
  t01:"4620f197bc", t02:"4620f197bc", t03:"4620f197bc", t04:"4620f197bc", t05:"4620f197bc",
  t06:"310350efa2", t07:"310350efa2", t08:"310350efa2",
  t09:"ebdcefcb48",
  t10:"d179a7ccd2", t12:"d179a7ccd2",
  t11:"98fe52e687", t13:"98fe52e687",
  t14:null,          t15:"408540ebe2"
};
function migrate() {
  var seed = window.DETOUR_SEED;
  if (!S.schema) S.schema = 1;

  /* 1 → 2 : WWW. Tasks under sliders, per-block step routines, slider on blocks. */
  if (S.schema < 2) {
    if (!S.tasks) S.tasks = clone(seed.tasks || []);
    if (!S.blockRoutines) S.blockRoutines = clone(seed.blockRoutines || {});
    (S.templates || []).forEach(function (t) {
      if (t.sliderId === undefined) {
        t.sliderId = TEMPLATE_SLIDERS.hasOwnProperty(t.id) ? TEMPLATE_SLIDERS[t.id] : null;
      }
    });
    if (!S.wwwMode) S.wwwMode = "day";
    S.schema = 2;
    save();
  }

  if (!S.tasks) S.tasks = [];
  if (!S.blockRoutines) S.blockRoutines = {};
  if (!S.wwwMode) S.wwwMode = "day";
  if (!S.stamps) S.stamps = {};
  if (!S.tombs) S.tombs = {};
  if (!S.clock) S.clock = 0;
}
var saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    /* sync.js, if loaded, stamps what changed before we write */
    if (window.DETOUR && window.DETOUR.onSave) { try { window.DETOUR.onSave(); } catch (e) {} }
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast("Could not save — storage full or blocked"); }
  }, 120);
}

/* ============================ dates ============================ */
var DAYNAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function dkey(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function parseKey(k) { var p = k.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
function today() { var d = new Date(); d.setHours(0,0,0,0); return d; }
function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
function weekStartOf(d) { return addDays(d, -d.getDay()); }   // Sunday
function sameDay(a, b) { return dkey(a) === dkey(b); }
function daysBetween(a, b) { return Math.round((parseKey(b) - parseKey(a)) / 86400000); }
function fmtDate(d) { return DAYNAMES[d.getDay()].slice(0,3) + " " + MONTHS[d.getMonth()].slice(0,3) + " " + d.getDate(); }
function fmtLong(d) { return DAYNAMES[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate(); }
function minsToLabel(m) {
  var h = Math.floor(m / 60), mm = m % 60;
  var ampm = h >= 12 ? "pm" : "am"; var hh = h % 12; if (hh === 0) hh = 12;
  return hh + (mm ? ":" + pad(mm) : "") + ampm;
}
function hmToMins(s) { var p = s.split(":"); return (+p[0]) * 60 + (+p[1]); }
function minsToHM(m) { return pad(Math.floor(m/60)) + ":" + pad(m%60); }
function nowMins() { var d = new Date(); return d.getHours()*60 + d.getMinutes(); }

/* ============================ schedule ============================ */
function blocksFor(date) {
  var k = dkey(date), dow = date.getDay();
  var removed = S.removed[k] || [];
  var list = S.templates
    .filter(function (t) { return t.day === dow && removed.indexOf(t.id) < 0 && !isPaused(t, date); })
    .map(function (t) {
      return { key: t.id, templateId: t.id, projectId: t.projectId, sliderId: t.sliderId || null,
               label: t.label, start: t.start, mins: t.mins, kind: t.kind, fromTemplate: true };
    });
  (S.extras[k] || []).forEach(function (b) { list.push(Object.assign({ fromTemplate: false }, b)); });
  list.sort(function (a, b) { return hmToMins(a.start) - hmToMins(b.start); });
  return list;
}
function isPaused(t, date) {
  if (!t.startsOn) return false;
  return dkey(date) < t.startsOn;
}
function blockState(dateKey, blockKey) {
  var d = S.blockState[dateKey];
  return (d && d[blockKey]) || {};
}
function setBlockState(dateKey, blockKey, patch) {
  if (!S.blockState[dateKey]) S.blockState[dateKey] = {};
  S.blockState[dateKey][blockKey] = Object.assign({}, S.blockState[dateKey][blockKey], patch);
  save();
}
function project(id) { for (var i=0;i<S.projects.length;i++) if (S.projects[i].id===id) return S.projects[i]; return null; }
function projColor(id) { var p = project(id); return p ? p.color : "var(--line-strong)"; }

/* ============================ sliders ============================ */
function slider(id) { for (var i=0;i<S.sliders.length;i++) if (S.sliders[i].id===id) return S.sliders[i]; return null; }
function slidersFor(pid) { return S.sliders.filter(function (s) { return s.projectId === pid; }); }
function sliderName(id) { var s = slider(id); return s ? s.name : ""; }
/* "Creative Identity (IO)" → "Creative Identity" — the tag is shown as its own pill */
function sliderShort(id) { return sliderName(id).replace(/\s*\((IO|PD|WWO|SC)\)\s*$/, "").trim(); }
function sliderTag(id) { var m = /\((IO|PD|WWO|SC)\)\s*$/.exec(sliderName(id)); return m ? m[1] : ""; }

/* ============================ tasks ============================ */
/* Tasks are the small, checkable things under a slider. Milestones are the
   big ones. A block on the WWW calendar surfaces its slider's open tasks. */
function tasksFor(sliderId, includeDone) {
  var list = S.tasks.filter(function (t) {
    return t.sliderId === sliderId && (includeDone || !t.done);
  });
  list.sort(function (a, b) {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1; if (!b.due) return -1;
    return a.due < b.due ? -1 : 1;
  });
  return list;
}
function openTaskCount(sliderId) {
  return S.tasks.filter(function (t) { return t.sliderId === sliderId && !t.done; }).length;
}
function tasksDueOn(dateKey) {
  return S.tasks.filter(function (t) { return !t.done && t.due === dateKey; });
}
function overdueTasks() {
  var k = dkey(today());
  return S.tasks.filter(function (t) { return !t.done && t.due && t.due < k; })
                .sort(function (a, b) { return a.due < b.due ? -1 : 1; });
}
function addTask(o) {
  var t = { id: uid(), sliderId: o.sliderId || null, projectId: o.projectId || null,
            title: o.title, due: o.due || null, note: o.note || "", done: false, doneAt: null,
            createdAt: new Date().toISOString() };
  if (t.sliderId && !t.projectId) { var s = slider(t.sliderId); if (s) t.projectId = s.projectId; }
  S.tasks.push(t); save();
  return t;
}
function toggleTask(t) {
  t.done = !t.done;
  t.doneAt = t.done ? new Date().toISOString() : null;
  save();
}
/* what to work on inside this block: next open task, else next open milestone */
function blockFocus(b) {
  if (b.sliderId) {
    var t = tasksFor(b.sliderId)[0];
    if (t) return { kind: "task", title: t.title, due: t.due, obj: t };
  }
  if (b.projectId) {
    var m = nextMilestone(b.projectId);
    if (m) return { kind: "milestone", title: m.title, due: m.due, obj: m };
  }
  return null;
}

/* ============================ block step routines ============================ */
/* The repeating checklist inside a block — "the whole routine" — keyed by
   slider so every Anderson Block gets the same steps, ticked per date. */
function routineKeyFor(b) { return b.sliderId || ("kind:" + (b.kind || "project")); }
function stepsFor(b) { return S.blockRoutines[routineKeyFor(b)] || []; }
function stepDone(dateKey, blockKey, stepId) {
  var st = blockState(dateKey, blockKey).steps || {};
  return !!st[stepId];
}
function toggleStep(dateKey, blockKey, stepId) {
  var steps = Object.assign({}, blockState(dateKey, blockKey).steps || {});
  if (steps[stepId]) delete steps[stepId]; else steps[stepId] = true;
  setBlockState(dateKey, blockKey, { steps: steps });
}
function setSteps(b, list) { S.blockRoutines[routineKeyFor(b)] = list; save(); }

/* next open milestone for a project — "what do I work on in this block" */
function nextMilestone(projectId) {
  var open = S.milestones.filter(function (m) { return m.projectId === projectId && !m.done; });
  open.sort(function (a, b) {
    if (!a.due) return 1; if (!b.due) return -1;
    return a.due < b.due ? -1 : 1;
  });
  return open[0] || null;
}

/* ============================ routines ============================ */
function periodKey(period, date) {
  var d = date || today();
  if (period === "daily") return dkey(d);
  if (period === "weekly") return dkey(weekStartOf(d));
  if (period === "monthly") return d.getFullYear() + "-" + pad(d.getMonth() + 1);
  return d.getFullYear() + "-H" + (d.getMonth() < 6 ? 1 : 2);
}
function routineDone(r, date) {
  return !!S.routineLog[r.id + "|" + periodKey(r.period, date)];
}
function toggleRoutine(r, date) {
  var k = r.id + "|" + periodKey(r.period, date);
  if (S.routineLog[k]) delete S.routineLog[k];
  else S.routineLog[k] = new Date().toISOString();
  save();
}
function dailyStreak(r) {
  if (r.period !== "daily") return 0;
  var n = 0, d = today();
  if (!S.routineLog[r.id + "|" + dkey(d)]) d = addDays(d, -1);
  while (S.routineLog[r.id + "|" + dkey(d)]) { n++; d = addDays(d, -1); }
  return n;
}
function routinesDueToday() {
  var d = today(), out = [];
  S.routines.forEach(function (r) {
    if (r.period === "daily") out.push(r);
    else if (r.period === "weekly" && d.getDay() === 0) out.push(r);
    else if (r.period === "monthly" && d.getDate() <= 3) out.push(r);
    else if (r.period === "biannual" && (d.getMonth() === 5 || d.getMonth() === 11) && d.getDate() <= 7) out.push(r);
  });
  return out;
}

/* ============================ milestones ============================ */
function milestoneStatus(m) {
  if (m.done) return { cls: "good", label: "done" };
  if (!m.due) return { cls: "", label: "ongoing" };
  var n = daysBetween(dkey(today()), m.due);
  if (n < 0) return { cls: "bad", label: Math.abs(n) + "d overdue" };
  if (n === 0) return { cls: "bad", label: "due today" };
  if (n <= 30) return { cls: "warn", label: n + "d left" };
  if (n <= 120) return { cls: "", label: Math.round(n / 7) + "w left" };
  return { cls: "", label: Math.round(n / 30) + "mo" };
}

/* ============================ ui helpers ============================ */
function h(tag, cls, html) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function esc(s) { return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function on(el, ev, fn) { el.addEventListener(ev, fn); return el; }
var toastTimer = null;
function toast(msg) {
  var t = document.getElementById("toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
}
function sechead(title, right) {
  var e = h("div", "sechead");
  e.appendChild(h("span", "eyebrow", esc(title)));
  e.appendChild(h("span", "line"));
  if (right) e.appendChild(h("span", "dim", esc(right)));
  return e;
}
function uid() { return Math.random().toString(36).slice(2, 10); }

/* ---- bottom sheet ---- */
var sheetEl = document.getElementById("sheet");
function openSheet(title, buildBody) {
  document.getElementById("sheet-title").textContent = title;
  var body = document.getElementById("sheet-body");
  body.innerHTML = "";
  buildBody(body);
  sheetEl.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeSheet() { sheetEl.hidden = true; document.body.style.overflow = ""; }
Array.prototype.forEach.call(sheetEl.querySelectorAll("[data-close]"), function (b) { on(b, "click", closeSheet); });

/* ============================ views ============================ */
var view = "today";
var weekCursor = weekStartOf(today());
var wwwCursor = today();
var goalFilter = "all";

function render() {
  var el = document.getElementById("view");
  el.innerHTML = "";
  Array.prototype.forEach.call(document.querySelectorAll("#tabs .tab"), function (t) {
    t.setAttribute("aria-selected", t.dataset.view === view ? "true" : "false");
  });
  ({ today: viewToday, www: viewWWW, sunday: viewSunday, goals: viewGoals, routines: viewRoutines }[view])(el);
  syncTopbarH();
  el.scrollTop = 0;
  window.scrollTo(0, 0);
}

/* the calendar's day header sticks under the topbar, whose height moves with
   the safe-area inset — measure it rather than guessing */
function syncTopbarH() {
  var tb = document.getElementById("topbar");
  if (tb) document.documentElement.style.setProperty("--topbarh", tb.offsetHeight + "px");
}

/* ---------------- TODAY ---------------- */
function viewToday(root) {
  var d = today(), k = dkey(d);
  var blocks = blocksFor(d);
  var doneCount = blocks.filter(function (b) { return blockState(k, b.key).done; }).length;
  var nm = nowMins();

  var wrap = h("div", "stack g20");
  document.getElementById("tbsub").textContent = fmtLong(d);

  /* hero: current or next block, else done-state */
  var live = null, next = null;
  blocks.forEach(function (b) {
    var s = hmToMins(b.start), e = s + b.mins;
    if (nm >= s && nm < e && !blockState(k, b.key).done) live = live || b;
    if (nm < s && !blockState(k, b.key).done) next = next || b;
  });

  var hero = h("div", "now-hero");
  if (live || next) {
    var b = live || next;
    hero.appendChild(h("div", "lab", live ? "Right now" : "Up next · " + minsToLabel(hmToMins(b.start))));
    hero.appendChild(h("div", "big", esc(b.label)));
    if (b.sliderId) hero.appendChild(h("div", "sub", esc(sliderShort(b.sliderId))));
    var fo = blockFocus(b);
    if (fo) hero.appendChild(h("div", "sub", "→ " + esc(fo.title)));
    else if (b.kind === "ritual") hero.appendChild(h("div", "sub", "The whole week gets decided here."));
    var act = h("div", "row"); act.style.marginTop = "4px";
    var go = h("button", "btn"); go.textContent = "Mark done";
    on(go, "click", function () { setBlockState(k, b.key, { done: true }); render(); });
    act.appendChild(go);
    var open = h("button", "btn ghost"); open.textContent = "Open block";
    on(open, "click", function () { showBlock(b, d); });
    act.appendChild(open);
    hero.appendChild(act);
  } else if (blocks.length && doneCount === blocks.length) {
    hero.appendChild(h("div", "lab", "Day complete"));
    hero.appendChild(h("div", "big", "You're done. Close the laptop."));
    hero.appendChild(h("div", "sub", "Everything you blocked for today is finished. Unscheduled work is what never ends — this is the edge."));
  } else if (!blocks.length) {
    hero.appendChild(h("div", "lab", "Nothing blocked"));
    hero.appendChild(h("div", "big", "No blocks today."));
    hero.appendChild(h("div", "sub", "Either that's deliberate, or the week never got planned."));
    var pl = h("button", "btn"); pl.textContent = "Plan the week";
    on(pl, "click", function () { view = "sunday"; render(); });
    hero.appendChild(pl);
  } else {
    hero.appendChild(h("div", "lab", "Later today"));
    hero.appendChild(h("div", "big", "Nothing running right now."));
    hero.appendChild(h("div", "sub", doneCount + " of " + blocks.length + " blocks done."));
  }
  wrap.appendChild(hero);

  if (blocks.length) {
    var pb = h("div", "progressbar", '<i style="width:' + (doneCount / blocks.length * 100) + '%"></i>');
    wrap.appendChild(pb);
  }

  /* blocks */
  var bs = h("div", "sec");
  bs.appendChild(sechead("Today's blocks", doneCount + "/" + blocks.length));
  if (!blocks.length) bs.appendChild(h("div", "empty", "No blocks scheduled.<br>Add one, or plan the week from the Plan tab."));
  blocks.forEach(function (b) { bs.appendChild(blockRow(b, d)); });
  var add = h("button", "btn ghost wide"); add.textContent = "+ Add block today";
  on(add, "click", function () { editBlock(null, d); });
  bs.appendChild(add);
  wrap.appendChild(bs);

  /* routines */
  var rl = routinesDueToday();
  if (rl.length) {
    var rs = h("div", "sec");
    var rdone = rl.filter(function (r) { return routineDone(r); }).length;
    rs.appendChild(sechead("Routines", rdone + "/" + rl.length));
    rl.forEach(function (r) { rs.appendChild(routineRow(r)); });
    wrap.appendChild(rs);
  }

  /* horizon */
  var soon = S.milestones.filter(function (m) {
    if (m.done || !m.due) return false;
    var n = daysBetween(k, m.due);
    return n <= 30;
  }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
  var hs = h("div", "sec");
  hs.appendChild(sechead("Next 30 days", soon.length + " milestone" + (soon.length === 1 ? "" : "s")));
  if (!soon.length) hs.appendChild(h("div", "empty", "Nothing due in the next month. That is allowed."));
  soon.slice(0, 8).forEach(function (m) { hs.appendChild(milestoneRow(m)); });
  wrap.appendChild(hs);

  root.appendChild(wrap);
}

function blockRow(b, date) {
  var k = dkey(date), st = blockState(k, b.key);
  var row = h("div", "blk" + (st.done ? " done" : ""));
  var nm = nowMins(), s = hmToMins(b.start);
  if (sameDay(date, today()) && nm >= s && nm < s + b.mins && !st.done) row.classList.add("live");

  row.appendChild(h("div", "t", "<b>" + minsToLabel(s) + "</b>" + (b.mins >= 60 ? (b.mins / 60) + "h" : b.mins + "m")));
  var bar = h("div", "bar"); bar.style.background = b.projectId ? projColor(b.projectId) : "var(--line-strong)";
  row.appendChild(bar);

  var body = h("div", "b");
  body.appendChild(h("div", "n", esc(b.label)));
  var meta = [];
  if (b.sliderId) meta.push(sliderShort(b.sliderId));
  else if (b.projectId) { var p = project(b.projectId); if (p) meta.push(p.name); }
  if (b.sliderId) {
    var n = openTaskCount(b.sliderId);
    if (n) meta.push(n + " task" + (n === 1 ? "" : "s"));
  }
  if (st.note) meta.push(st.note);
  if (meta.length) body.appendChild(h("div", "m", esc(meta.join(" · "))));
  on(body, "click", function () { showBlock(b, date); });
  row.appendChild(body);

  var act = h("div", "act");
  var chk = h("button", "chk"); chk.type = "button";
  chk.setAttribute("aria-pressed", st.done ? "true" : "false");
  chk.setAttribute("aria-label", "Mark block done");
  chk.innerHTML = st.done ? "&#10003;" : "";
  on(chk, "click", function (e) { e.stopPropagation(); setBlockState(k, b.key, { done: !st.done }); render(); });
  act.appendChild(chk);
  row.appendChild(act);
  return row;
}

function routineRow(r) {
  var done = routineDone(r);
  var row = h("div", "rt" + (done ? " done" : ""));
  var chk = h("button", "chk"); chk.type = "button";
  chk.setAttribute("aria-pressed", done ? "true" : "false");
  chk.setAttribute("aria-label", "Mark routine done");
  chk.innerHTML = done ? "&#10003;" : "";
  on(chk, "click", function () { toggleRoutine(r); render(); });
  row.appendChild(chk);
  row.appendChild(h("div", "n", esc(r.name)));
  if (r.period === "daily") {
    var st = dailyStreak(r);
    if (st > 1) row.appendChild(h("div", "streak", st + "d"));
  } else {
    row.appendChild(h("span", "pill", r.period));
  }
  return row;
}

function milestoneRow(m) {
  var st = milestoneStatus(m);
  var row = h("div", "ms" + (m.done ? " done" : ""));
  var chk = h("button", "chk"); chk.type = "button";
  chk.setAttribute("aria-pressed", m.done ? "true" : "false");
  chk.setAttribute("aria-label", "Mark milestone done");
  chk.innerHTML = m.done ? "&#10003;" : "";
  on(chk, "click", function () {
    m.done = !m.done; m.doneAt = m.done ? new Date().toISOString() : null; save();
    if (m.done) toast("Done — " + m.title.slice(0, 40));
    render();
  });
  row.appendChild(chk);
  var body = h("div", "body");
  body.appendChild(h("div", "ttl", esc(m.title)));
  var meta = h("div", "meta");
  var dot = h("span", "pdot"); dot.style.background = projColor(m.projectId); meta.appendChild(dot);
  var p = project(m.projectId);
  meta.appendChild(h("span", "dim", esc(p ? p.name : "")));
  if (m.build) meta.appendChild(h("span", "pill acc", "build"));
  meta.appendChild(h("span", "pill " + st.cls, st.label));
  body.appendChild(meta);
  on(body, "click", function () { showMilestone(m); });
  row.appendChild(body);
  return row;
}

function showMilestone(m) {
  openSheet(m.title, function (body) {
    var p = project(m.projectId);
    body.appendChild(h("div", "eyebrow", "Why it matters"));
    body.appendChild(h("div", "muted", esc(m.why)));
    var g = h("div", "stack g6");
    g.appendChild(h("div", "eyebrow", "Details"));
    g.appendChild(h("div", "muted",
      "<b>Project</b> " + esc(p ? p.name : "—") + "<br>" +
      "<b>Slider</b> " + esc(m.slider || "—") + "<br>" +
      "<b>Window</b> " + esc(m.term) + "<br>" +
      "<b>Target</b> " + (m.due ? esc(m.due) : "ongoing")));
    body.appendChild(g);
    var lab = h("label", "fld");
    lab.appendChild(h("span", null, "Target date"));
    var inp = h("input"); inp.type = "date"; inp.value = m.due || "";
    on(inp, "change", function () { m.due = inp.value || null; save(); toast("Date updated"); });
    lab.appendChild(inp);
    body.appendChild(lab);
    var b = h("button", "btn wide");
    b.textContent = m.done ? "Mark not done" : "Mark done";
    on(b, "click", function () {
      m.done = !m.done; m.doneAt = m.done ? new Date().toISOString() : null;
      save(); closeSheet(); render();
    });
    body.appendChild(b);
  });
}

/* ---------------- WWW · Working While Working ---------------- */
/* The calendar. Every block carries a project and a slider; tapping the
   slider opens that slider's task list. Outlook's shape, Detour's contents. */

function wwwDays() {
  if (S.wwwMode === "week") {
    var ws = weekStartOf(wwwCursor), out = [];
    for (var i = 0; i < 7; i++) out.push(addDays(ws, i));
    return out;
  }
  return [wwwCursor];
}

function viewWWW(root) {
  var days = wwwDays();
  var isWeek = S.wwwMode === "week";
  document.getElementById("tbsub").textContent = isWeek
    ? "WWW · week of " + fmtDate(days[0])
    : "WWW · " + fmtLong(wwwCursor);

  var wrap = h("div", "stack g14");

  /* --- controls --- */
  var bar = h("div", "wwwbar");
  var seg = h("div", "seg");
  [["day", "Day"], ["week", "Week"]].forEach(function (o) {
    var b = h("button", null, o[1]);
    b.setAttribute("aria-pressed", S.wwwMode === o[0] ? "true" : "false");
    on(b, "click", function () { S.wwwMode = o[0]; save(); render(); });
    seg.appendChild(b);
  });
  bar.appendChild(seg);
  var sp = h("span"); sp.style.flex = "1"; bar.appendChild(sp);
  var prev = h("button", "iconbtn sm"); prev.textContent = "‹";
  prev.setAttribute("aria-label", isWeek ? "Previous week" : "Previous day");
  on(prev, "click", function () { wwwCursor = addDays(wwwCursor, isWeek ? -7 : -1); render(); });
  var nowb = h("button", "btn ghost sm"); nowb.textContent = "Today";
  on(nowb, "click", function () { wwwCursor = today(); render(); });
  var next = h("button", "iconbtn sm"); next.textContent = "›";
  next.setAttribute("aria-label", isWeek ? "Next week" : "Next day");
  on(next, "click", function () { wwwCursor = addDays(wwwCursor, isWeek ? 7 : 1); render(); });
  bar.appendChild(prev); bar.appendChild(nowb); bar.appendChild(next);
  wrap.appendChild(bar);

  /* --- overdue banner: tasks with a date that has passed --- */
  var od = overdueTasks();
  if (od.length) {
    var ob = h("div", "odbar");
    ob.appendChild(h("span", "pill bad", od.length + " overdue"));
    ob.appendChild(h("span", "dim", esc(od[0].title)));
    on(ob, "click", function () { showTaskList("Overdue", od); });
    wrap.appendChild(ob);
  }

  wrap.appendChild(buildCalendar(days));

  /* --- load summary, week mode only --- */
  if (isWeek) {
    var mins = 0, done = 0, count = 0;
    days.forEach(function (d) {
      var k = dkey(d);
      blocksFor(d).forEach(function (b) {
        mins += b.mins; count++;
        if (blockState(k, b.key).done) done++;
      });
    });
    var sum = h("div", "card");
    sum.appendChild(h("div", "eyebrow", "Week load"));
    sum.appendChild(h("div", "h-md", (mins / 60).toFixed(1) + " hours blocked across " + count + " blocks"));
    sum.appendChild(h("div", "dim", done + " completed. Anything over about 25 hours of Detour blocks in a heavy academic week is a plan you will not keep."));
    wrap.appendChild(sum);
  }

  var add = h("button", "btn ghost wide");
  add.textContent = "+ Add block" + (S.wwwMode === "day" ? " · " + fmtDate(wwwCursor) : "");
  on(add, "click", function () { editBlock(null, S.wwwMode === "day" ? wwwCursor : today()); });
  wrap.appendChild(add);

  var ai = h("button", "btn wide");
  ai.textContent = "Type it in plain English";
  on(ai, "click", openAssistant);
  wrap.appendChild(ai);

  root.appendChild(wrap);
}

/* lane packing so overlapping blocks sit side by side, like Outlook */
function packLanes(blocks) {
  var evs = blocks.map(function (b) {
    var s = hmToMins(b.start);
    return { b: b, s: s, e: s + Math.max(b.mins, 25) };
  });
  evs.sort(function (a, b) { return a.s - b.s || a.e - b.e; });
  var cluster = [], clusterEnd = -1, clusters = [];
  evs.forEach(function (ev) {
    if (cluster.length && ev.s >= clusterEnd) { clusters.push(cluster); cluster = []; clusterEnd = -1; }
    cluster.push(ev); clusterEnd = Math.max(clusterEnd, ev.e);
  });
  if (cluster.length) clusters.push(cluster);
  clusters.forEach(function (cl) {
    var laneEnds = [];
    cl.forEach(function (ev) {
      var i = 0;
      for (; i < laneEnds.length; i++) if (laneEnds[i] <= ev.s) break;
      laneEnds[i] = ev.e; ev.lane = i;
    });
    cl.forEach(function (ev) { ev.lanes = laneEnds.length; });
  });
  return evs;
}

function buildCalendar(days) {
  var isWeek = days.length > 1;
  var cal = h("div", "cal");
  cal.dataset.mode = isWeek ? "week" : "day";

  /* vertical extent — 7am to 11pm by default, stretched to fit real blocks */
  var lo = 7 * 60, hi = 23 * 60;
  var all = days.map(function (d) { return blocksFor(d); });
  all.forEach(function (list) {
    list.forEach(function (b) {
      var s = hmToMins(b.start);
      lo = Math.min(lo, Math.floor(s / 60) * 60);
      hi = Math.max(hi, Math.ceil((s + b.mins) / 60) * 60);
    });
  });
  var ppm = isWeek ? 0.62 : 1.05;
  var height = (hi - lo) * ppm;
  var cols = "var(--gut) repeat(" + days.length + ", minmax(0,1fr))";

  /* --- day headers --- */
  var head = h("div", "calhead");
  head.style.gridTemplateColumns = cols;
  head.appendChild(h("div", "sp"));
  days.forEach(function (d, i) {
    var dh = h("button", "dh" + (sameDay(d, today()) ? " is-today" : ""));
    dh.appendChild(h("span", "w", DAYNAMES[d.getDay()].slice(0, isWeek ? 1 : 3)));
    dh.appendChild(h("span", "d", "" + d.getDate()));
    var mins = all[i].reduce(function (s, b) { return s + b.mins; }, 0);
    dh.appendChild(h("span", "n", mins ? (mins / 60).toFixed(mins % 60 ? 1 : 0) + "h" : "—"));
    on(dh, "click", function () { wwwCursor = d; S.wwwMode = "day"; save(); render(); });
    head.appendChild(dh);
  });
  cal.appendChild(head);

  /* --- due strip: tasks and milestones landing on that date --- */
  var due = h("div", "caldue");
  due.style.gridTemplateColumns = cols;
  var lbl = h("div", "sp"); lbl.appendChild(h("span", "eyebrow", "Due"));
  due.appendChild(lbl);
  days.forEach(function (d) {
    var k = dkey(d), cell = h("div", "duecell");
    var items = tasksDueOn(k).map(function (t) { return { t: t, ms: false }; })
      .concat(S.milestones.filter(function (m) { return !m.done && m.due === k; })
        .map(function (m) { return { t: m, ms: true }; }));
    if (!items.length) {
      cell.appendChild(h("span", "duenone", "·"));
    } else if (isWeek) {
      /* seven columns on a phone cannot hold a title — show the count */
      var c = h("button", "duechip count");
      c.textContent = "" + items.length;
      c.title = items.length + " due " + fmtDate(d);
      on(c, "click", function () {
        showTaskList(fmtLong(d) + " · due", items.map(function (x) { return x.t; }));
      });
      cell.appendChild(c);
    } else {
      items.slice(0, 8).forEach(function (it) {
        var c2 = h("button", "duechip" + (it.ms ? " ms" : ""));
        c2.textContent = (it.ms ? "◆ " : "") + it.t.title;
        c2.title = it.t.title;
        on(c2, "click", function () { if (it.ms) showMilestone(it.t); else showTask(it.t); });
        cell.appendChild(c2);
      });
      if (items.length > 8) cell.appendChild(h("span", "duenone", "+" + (items.length - 8)));
    }
    due.appendChild(cell);
  });
  cal.appendChild(due);

  /* --- the grid --- */
  var body = h("div", "calbody");
  body.style.gridTemplateColumns = cols;
  body.style.height = height + "px";

  var gutter = h("div", "gutter");
  for (var m = lo; m <= hi; m += 60) {
    /* the first label would sit half outside the box — pin it flush instead */
    var lab = h("div", "hr" + (m === lo ? " first" : ""), minsToLabel(m).replace(":00", ""));
    lab.style.top = ((m - lo) * ppm) + "px";
    gutter.appendChild(lab);
  }
  body.appendChild(gutter);

  days.forEach(function (d, di) {
    var k = dkey(d);
    var col = h("div", "calcol" + (sameDay(d, today()) ? " is-today" : ""));
    for (var mm = lo; mm <= hi; mm += 30) {
      var line = h("div", "hl" + (mm % 60 ? " half" : ""));
      line.style.top = ((mm - lo) * ppm) + "px";
      col.appendChild(line);
    }
    /* the red now-line, on today's column only */
    if (sameDay(d, today())) {
      var nm = nowMins();
      if (nm >= lo && nm <= hi) {
        var nl = h("div", "nowline");
        nl.style.top = ((nm - lo) * ppm) + "px";
        col.appendChild(nl);
      }
    }
    packLanes(all[di]).forEach(function (ev) {
      col.appendChild(calEvent(ev, d, k, lo, ppm, isWeek));
    });
    if (!all[di].length && !isWeek) {
      var open = h("div", "calempty", "Nothing blocked.<br>An unscheduled day is not a free day —<br>it is the one that never ends.");
      col.appendChild(open);
    }
    body.appendChild(col);
  });

  cal.appendChild(body);
  return cal;
}

function calEvent(ev, date, k, lo, ppm, isWeek) {
  var b = ev.b, st = blockState(k, b.key);
  var s = hmToMins(b.start);
  var el = h("div", "cev");
  if (st.done) el.classList.add("done");
  var isNow = sameDay(date, today()) && nowMins() >= s && nowMins() < s + b.mins;
  if (isNow && !st.done) el.classList.add("live");

  el.style.top = ((s - lo) * ppm) + "px";
  var px = Math.max(24, b.mins * ppm);
  el.style.height = px + "px";
  if (px < 40) el.classList.add("tiny");   /* one clamped line, no slider link */
  var w = 100 / ev.lanes;
  el.style.left = "calc(" + (ev.lane * w) + "% + 2px)";
  el.style.width = "calc(" + w + "% - 4px)";
  el.style.borderLeftColor = b.projectId ? projColor(b.projectId) : "var(--line-strong)";

  el.appendChild(h("div", "cl", esc(b.label)));
  if (!isWeek) el.appendChild(h("div", "ct", minsToLabel(s) + " · " + (b.mins >= 60 ? (b.mins / 60) + "h" : b.mins + "m")));

  if (b.sliderId) {
    var n = openTaskCount(b.sliderId);
    var sl = h("button", "cs");
    sl.textContent = sliderShort(b.sliderId) + (n ? " (" + n + ")" : "");
    on(sl, "click", function (e) { e.stopPropagation(); showSliderTasks(b.sliderId, b, date); });
    el.appendChild(sl);
  }

  on(el, "click", function () { showBlock(b, date); });
  return el;
}

/* ---------------- block detail: steps + tasks ---------------- */
function showBlock(b, date) {
  var k = dkey(date);
  openSheet(b.label, function (body) {
    var st = blockState(k, b.key);
    var p = b.projectId ? project(b.projectId) : null;

    var head = h("div", "card");
    var row = h("div", "row");
    var dot = h("span", "pdot"); dot.style.background = b.projectId ? projColor(b.projectId) : "var(--line-strong)";
    row.appendChild(dot);
    row.appendChild(h("div", "h-md", esc(p ? p.name : "No project")));
    head.appendChild(row);
    head.appendChild(h("div", "dim", fmtLong(date) + " · " + minsToLabel(hmToMins(b.start)) +
      " · " + (b.mins >= 60 ? (b.mins / 60) + "h" : b.mins + "m")));
    if (b.sliderId) {
      var sb = h("button", "sliderbtn");
      sb.innerHTML = "<span>" + esc(sliderShort(b.sliderId)) + "</span>" +
        (sliderTag(b.sliderId) ? "<span class='pill acc'>" + sliderTag(b.sliderId) + "</span>" : "") +
        "<span class='dim'>›</span>";
      on(sb, "click", function () { showSliderTasks(b.sliderId, b, date); });
      head.appendChild(sb);
    } else {
      head.appendChild(h("div", "dim", "No slider on this block — set one so its tasks show up here."));
    }
    body.appendChild(head);

    /* steps — the repeating routine inside the block */
    var steps = stepsFor(b);
    var ss = h("div", "sec");
    var sdone = steps.filter(function (x) { return stepDone(k, b.key, x.id); }).length;
    ss.appendChild(sechead("The routine", steps.length ? sdone + "/" + steps.length : "none yet"));
    steps.forEach(function (x) {
      var done = stepDone(k, b.key, x.id);
      var r = h("div", "tk" + (done ? " done" : ""));
      var c = h("button", "chk"); c.type = "button";
      c.setAttribute("aria-pressed", done ? "true" : "false");
      c.innerHTML = done ? "&#10003;" : "";
      on(c, "click", function () { toggleStep(k, b.key, x.id); closeSheet(); showBlock(b, date); });
      r.appendChild(c);
      r.appendChild(h("div", "t", esc(x.text)));
      var del = h("button", "btn ghost sm"); del.textContent = "✕";
      on(del, "click", function () {
        setSteps(b, steps.filter(function (q) { return q.id !== x.id; }));
        closeSheet(); showBlock(b, date);
      });
      r.appendChild(del);
      ss.appendChild(r);
    });
    var si = h("input"); si.type = "text";
    si.placeholder = steps.length ? "Add a step…" : "e.g. Clear email to zero";
    on(si, "keydown", function (e) {
      if (e.key !== "Enter" || !si.value.trim()) return;
      setSteps(b, steps.concat([{ id: uid(), text: si.value.trim() }]));
      closeSheet(); showBlock(b, date);
    });
    ss.appendChild(si);
    ss.appendChild(h("div", "dim", "Same every time this block runs. Ticks reset with each new instance."));
    body.appendChild(ss);

    /* tasks from the slider */
    if (b.sliderId) {
      var open = tasksFor(b.sliderId);
      var ts = h("div", "sec");
      ts.appendChild(sechead("Tasks · " + sliderShort(b.sliderId), open.length + " open"));
      if (!open.length) ts.appendChild(h("div", "empty", "Nothing waiting on this slider."));
      open.slice(0, 6).forEach(function (t) { ts.appendChild(taskRow(t, function () { closeSheet(); showBlock(b, date); })); });
      var more = h("button", "btn ghost wide"); more.textContent = "All tasks & add new";
      on(more, "click", function () { showSliderTasks(b.sliderId, b, date); });
      ts.appendChild(more);
      body.appendChild(ts);
    }

    var acts = h("div", "stack g10");
    var mk = h("button", "btn wide");
    mk.textContent = st.done ? "Mark block not done" : "Mark block done";
    on(mk, "click", function () { setBlockState(k, b.key, { done: !st.done }); closeSheet(); render(); });
    acts.appendChild(mk);
    var ed = h("button", "btn ghost wide"); ed.textContent = "Edit block";
    on(ed, "click", function () { closeSheet(); editBlock(b, date); });
    acts.appendChild(ed);
    body.appendChild(acts);
  });
}

/* ---------------- slider task list ---------------- */
function showSliderTasks(sliderId, b, date) {
  var sl = slider(sliderId);
  openSheet(sl ? sl.name : "Tasks", function (body) {
    if (sl) {
      var p = project(sl.projectId);
      body.appendChild(h("div", "dim", esc(p ? p.name : "")));
    }

    var open = tasksFor(sliderId);
    var done = S.tasks.filter(function (t) { return t.sliderId === sliderId && t.done; });

    var sec = h("div", "sec");
    sec.appendChild(sechead("Waiting", open.length + " open"));
    if (!open.length) sec.appendChild(h("div", "empty", "Nothing waiting here.<br>That is allowed."));
    open.forEach(function (t) {
      sec.appendChild(taskRow(t, function () { closeSheet(); showSliderTasks(sliderId, b, date); }));
    });
    body.appendChild(sec);

    /* quick add */
    var addWrap = h("div", "addtask");
    var ti = h("input"); ti.type = "text"; ti.placeholder = "New task…";
    var di = h("input"); di.type = "date"; di.value = "";
    var go = h("button", "btn"); go.textContent = "Add";
    function commit() {
      if (!ti.value.trim()) return;
      addTask({ sliderId: sliderId, title: ti.value.trim(), due: di.value || null });
      closeSheet(); showSliderTasks(sliderId, b, date); render();
    }
    on(go, "click", commit);
    on(ti, "keydown", function (e) { if (e.key === "Enter") commit(); });
    addWrap.appendChild(ti); addWrap.appendChild(di); addWrap.appendChild(go);
    body.appendChild(addWrap);

    /* the milestones this slider rolls up to */
    var ms = S.milestones.filter(function (m) { return sl && m.slider === sl.name && !m.done; });
    if (ms.length) {
      var msec = h("div", "sec");
      msec.appendChild(sechead("Milestones on this slider", ms.length + ""));
      ms.forEach(function (m) { msec.appendChild(milestoneRow(m)); });
      body.appendChild(msec);
    }

    if (done.length) {
      var dsec = h("div", "sec");
      dsec.appendChild(sechead("Done", done.length + ""));
      done.slice(-8).reverse().forEach(function (t) {
        dsec.appendChild(taskRow(t, function () { closeSheet(); showSliderTasks(sliderId, b, date); }));
      });
      body.appendChild(dsec);
    }

    if (sl) {
      var g = h("div", "card");
      g.appendChild(h("div", "eyebrow", "Graduation outcome"));
      g.appendChild(h("div", "muted", esc(sl.outcome)));
      body.appendChild(g);
    }
  });
}

/* accepts a mixed list — tasks have sliderId, milestones have term */
function showTaskList(title, list) {
  openSheet(title, function (body) {
    if (!list.length) body.appendChild(h("div", "empty", "Nothing here."));
    list.forEach(function (x) {
      if (x.sliderId !== undefined) body.appendChild(taskRow(x, function () { closeSheet(); render(); }));
      else body.appendChild(milestoneRow(x));
    });
  });
}

function taskRow(t, after) {
  var row = h("div", "tk" + (t.done ? " done" : ""));
  var c = h("button", "chk"); c.type = "button";
  c.setAttribute("aria-pressed", t.done ? "true" : "false");
  c.setAttribute("aria-label", "Mark task done");
  c.innerHTML = t.done ? "&#10003;" : "";
  on(c, "click", function (e) {
    e.stopPropagation();
    toggleTask(t);
    if (t.done) toast("Done — " + t.title.slice(0, 40));
    if (after) after(); else render();
  });
  row.appendChild(c);
  var bd = h("div", "b");
  bd.appendChild(h("div", "t", esc(t.title)));
  var meta = h("div", "meta");
  if (t.sliderId) meta.appendChild(h("span", "dim", esc(sliderShort(t.sliderId))));
  if (t.due) {
    var st = milestoneStatus({ done: t.done, due: t.due });
    meta.appendChild(h("span", "pill " + st.cls, st.label));
  }
  bd.appendChild(meta);
  on(bd, "click", function () { showTask(t); });
  row.appendChild(bd);
  return row;
}

function showTask(t) {
  openSheet(t.title, function (body) {
    var sl = t.sliderId ? slider(t.sliderId) : null;
    var p = sl ? project(sl.projectId) : (t.projectId ? project(t.projectId) : null);
    body.appendChild(h("div", "dim", (p ? p.name : "No project") + (sl ? " · " + sl.name : "")));

    var ti = h("input"); ti.type = "text"; ti.value = t.title;
    var l1 = h("label", "fld"); l1.appendChild(h("span", null, "Task")); l1.appendChild(ti);
    body.appendChild(l1);

    var di = h("input"); di.type = "date"; di.value = t.due || "";
    var l2 = h("label", "fld"); l2.appendChild(h("span", null, "Due")); l2.appendChild(di);
    body.appendChild(l2);

    var sel = sliderSelect(t.sliderId);
    var l3 = h("label", "fld"); l3.appendChild(h("span", null, "Slider")); l3.appendChild(sel);
    body.appendChild(l3);

    var nt = h("textarea"); nt.value = t.note || ""; nt.placeholder = "Notes — who, where, what specifically";
    var l4 = h("label", "fld"); l4.appendChild(h("span", null, "Notes")); l4.appendChild(nt);
    body.appendChild(l4);

    var sv = h("button", "btn wide"); sv.textContent = "Save";
    on(sv, "click", function () {
      t.title = ti.value.trim() || t.title;
      t.due = di.value || null;
      t.note = nt.value;
      t.sliderId = sel.value || null;
      var s2 = t.sliderId ? slider(t.sliderId) : null;
      t.projectId = s2 ? s2.projectId : null;
      save(); closeSheet(); render();
    });
    body.appendChild(sv);

    var tg = h("button", "btn ghost wide");
    tg.textContent = t.done ? "Mark not done" : "Mark done";
    on(tg, "click", function () { toggleTask(t); closeSheet(); render(); });
    body.appendChild(tg);

    var del = h("button", "btn ghost wide"); del.textContent = "Delete task";
    on(del, "click", function () {
      S.tasks = S.tasks.filter(function (q) { return q.id !== t.id; });
      save(); closeSheet(); render();
    });
    body.appendChild(del);
  });
}

/* a <select> of every slider, grouped by project */
function sliderSelect(selectedId) {
  var sel = h("select");
  sel.appendChild(new Option("— none —", ""));
  S.projects.forEach(function (p) {
    var g = document.createElement("optgroup");
    g.label = p.name;
    slidersFor(p.id).forEach(function (s) {
      var o = new Option(s.name, s.id);
      if (s.id === selectedId) o.selected = true;
      g.appendChild(o);
    });
    sel.appendChild(g);
  });
  return sel;
}

function editBlock(b, date) {
  var isNew = !b;
  var k = dkey(date);
  openSheet(isNew ? "New block · " + fmtDate(date) : "Edit block", function (body) {
    var f = {};
    function field(labelText, node, key) {
      var l = h("label", "fld");
      l.appendChild(h("span", null, labelText));
      l.appendChild(node);
      body.appendChild(l);
      f[key] = node;
    }
    var name = h("input"); name.type = "text"; name.value = b ? b.label : "";
    name.placeholder = "StudioVault, Anderson Block, Workout…";
    field("Label", name, "label");

    var slSel = sliderSelect(b ? b.sliderId : null);
    field("Slider", slSel, "slider");
    body.appendChild(h("div", "dim", "The slider decides which task list this block opens."));

    var sel = h("select");
    sel.appendChild(new Option("— none —", ""));
    S.projects.forEach(function (p) {
      var o = new Option(p.name, p.id);
      if (b && b.projectId === p.id) o.selected = true;
      sel.appendChild(o);
    });
    field("Project", sel, "project");
    /* picking a slider settles the project — keep them in step */
    on(slSel, "change", function () {
      var s = slSel.value ? slider(slSel.value) : null;
      if (s) sel.value = s.projectId;
    });

    var st = h("input"); st.type = "time"; st.value = b ? b.start : "19:00";
    field("Start", st, "start");

    var len = h("input"); len.type = "number"; len.min = "15"; len.step = "15";
    len.value = b ? b.mins : 90;
    field("Minutes", len, "mins");

    var note = h("input"); note.type = "text";
    note.value = b ? (blockState(k, b.key).note || "") : "";
    note.placeholder = "Optional — what specifically?";
    field("Note", note, "note");

    var rowBtns = h("div", "stack g10");
    var saveBtn = h("button", "btn wide");
    saveBtn.textContent = isNew ? "Add block" : "Save";
    on(saveBtn, "click", function () {
      var slId = slSel.value || null;
      var label = name.value.trim() || (slId ? sliderShort(slId) : (sel.value ? project(sel.value).name : "Block"));
      var patch = { projectId: sel.value || null, sliderId: slId, label: label,
                    start: st.value, mins: Math.max(15, +len.value || 60) };
      if (isNew || !b.fromTemplate) {
        if (!S.extras[k]) S.extras[k] = [];
        if (isNew) {
          var nb = Object.assign({ key: uid(), kind: "project" }, patch);
          S.extras[k].push(nb);
          if (note.value.trim()) setBlockState(k, nb.key, { note: note.value.trim() });
        } else {
          S.extras[k] = S.extras[k].map(function (x) {
            return x.key === b.key ? Object.assign(x, patch) : x;
          });
          setBlockState(k, b.key, { note: note.value.trim() });
        }
      } else {
        /* editing a recurring template instance → detach it for this date only */
        if (!S.removed[k]) S.removed[k] = [];
        if (S.removed[k].indexOf(b.templateId) < 0) S.removed[k].push(b.templateId);
        if (!S.extras[k]) S.extras[k] = [];
        var det = Object.assign({ key: uid(), kind: b.kind }, patch);
        S.extras[k].push(det);
        setBlockState(k, det.key, { note: note.value.trim(), done: blockState(k, b.key).done,
                                    steps: blockState(k, b.key).steps });
      }
      save(); closeSheet(); render();
    });
    rowBtns.appendChild(saveBtn);

    if (!isNew) {
      var del = h("button", "btn ghost wide");
      del.textContent = b.fromTemplate ? "Skip just this week" : "Delete block";
      on(del, "click", function () {
        if (b.fromTemplate) {
          if (!S.removed[k]) S.removed[k] = [];
          S.removed[k].push(b.templateId);
        } else {
          S.extras[k] = (S.extras[k] || []).filter(function (x) { return x.key !== b.key; });
        }
        save(); closeSheet(); render();
      });
      rowBtns.appendChild(del);
      if (b.fromTemplate) rowBtns.appendChild(h("div", "dim", "This is a recurring block from your weekly template. Editing it changes only this date; change the template in Menu → Weekly template."));
    }
    body.appendChild(rowBtns);
  });
}

/* ---------------- SUNDAY PLAN ---------------- */
function viewSunday(root) {
  document.getElementById("tbsub").textContent = "Sunday plan";
  var wk = weekStartOf(today());
  var upcoming = sameDay(today(), wk) || today().getDay() >= 5 ? addDays(wk, today().getDay() >= 5 ? 7 : 0) : wk;
  var wkKey = dkey(upcoming);
  if (!S.weekPlans[wkKey]) S.weekPlans[wkKey] = { planned: false, meals: [], workouts: [], focus: "" };
  var plan = S.weekPlans[wkKey];

  var wrap = h("div", "stack g20");
  var head = h("div", "stack g6");
  head.appendChild(h("div", "eyebrow", "Ten minutes, once a week"));
  head.appendChild(h("div", "h-lg", "Plan the week of<br>" + fmtDate(upcoming)));
  head.appendChild(h("div", "muted", "Workouts, meals and blocks in one sitting. This is the ritual the whole plan rests on — every project you audited named the same bottleneck, and it was this."));
  wrap.appendChild(head);

  /* 1 — last week */
  wrap.appendChild(step(1, "Look back one week", function (sb) {
    var last = addDays(upcoming, -7);
    var tot = 0, done = 0;
    for (var i = 0; i < 7; i++) {
      var d = addDays(last, i), k = dkey(d);
      blocksFor(d).forEach(function (b) { tot++; if (blockState(k, b.key).done) done++; });
    }
    sb.appendChild(h("div", "h-md", tot ? done + " of " + tot + " blocks completed" : "No blocks were scheduled last week"));
    var pct = tot ? Math.round(done / tot * 100) : 0;
    sb.appendChild(h("div", "muted", tot
      ? (pct >= 70 ? "That held. Keep the same shape." :
         pct >= 40 ? "About half. Cut one block rather than trying harder." :
                     "Most of it did not happen. Schedule less this week — a plan you keep beats a plan you admire.")
      : "Start with three blocks. Not ten."));
    var doneMs = S.milestones.filter(function (m) { return m.done && m.doneAt && m.doneAt >= last.toISOString(); });
    if (doneMs.length) {
      sb.appendChild(h("div", "eyebrow", "Milestones closed"));
      doneMs.forEach(function (m) { sb.appendChild(h("div", "muted", "✓ " + esc(m.title))); });
    }
  }));

  /* 2 — workouts */
  wrap.appendChild(step(2, "Workouts", function (sb) {
    sb.appendChild(h("div", "dim", "Pick the sessions you will actually attend. One community that expects you beats a routine you track."));
    ["Santa Monica Run Club", "UCLA Rec — BruinStrong", "Anderson fitness group", "Solo lift", "Hike / outdoor"].forEach(function (w) {
      sb.appendChild(toggleOpt(w, plan.workouts, function () { save(); }));
    });
  }));

  /* 3 — meals */
  wrap.appendChild(step(3, "Meals with Lilly", function (sb) {
    sb.appendChild(h("div", "dim", "Choose from the core rotation, then one shop. Target ten to twelve recipes under 20 minutes."));
    var mealInput = h("input"); mealInput.type = "text"; mealInput.placeholder = "Add a meal for this week…";
    on(mealInput, "keydown", function (e) {
      if (e.key === "Enter" && mealInput.value.trim()) {
        plan.meals.push(mealInput.value.trim()); mealInput.value = ""; save(); render();
      }
    });
    sb.appendChild(mealInput);
    plan.meals.forEach(function (m, i) {
      var r = h("div", "opt"); r.dataset.on = "1";
      r.appendChild(h("div", null, esc(m)));
      var x = h("button", "btn ghost sm"); x.textContent = "✕"; x.style.marginLeft = "auto";
      on(x, "click", function () { plan.meals.splice(i, 1); save(); render(); });
      r.appendChild(x);
      sb.appendChild(r);
    });
    if (!plan.meals.length) sb.appendChild(h("div", "dim", "Nothing added yet."));
  }));

  /* 4 — blocks */
  wrap.appendChild(step(4, "Project blocks", function (sb) {
    var tot = 0;
    for (var i = 0; i < 7; i++) tot += blocksFor(addDays(upcoming, i)).reduce(function (s, b) { return s + b.mins; }, 0);
    sb.appendChild(h("div", "h-md", (tot / 60).toFixed(1) + " hours currently blocked"));
    sb.appendChild(h("div", "dim", "Your weekly template already places the recurring ones. Open WWW to add, move or skip anything for this specific week."));
    var go = h("button", "btn wide"); go.textContent = "Open the week in WWW";
    on(go, "click", function () { wwwCursor = upcoming; S.wwwMode = "week"; save(); view = "www"; render(); });
    sb.appendChild(go);
  }));

  /* 5 — what matters */
  wrap.appendChild(step(5, "One thing that matters", function (sb) {
    sb.appendChild(h("div", "dim", "If only one thing happens this week, what is it?"));
    var t = h("textarea"); t.value = plan.focus || ""; t.placeholder = "The week is a success if…";
    on(t, "input", function () { plan.focus = t.value; save(); });
    sb.appendChild(t);
    var soon = S.milestones.filter(function (m) {
      return !m.done && m.due && daysBetween(dkey(upcoming), m.due) <= 21 && daysBetween(dkey(upcoming), m.due) >= -60;
    }).sort(function (a, b) { return a.due < b.due ? -1 : 1; }).slice(0, 5);
    if (soon.length) {
      sb.appendChild(h("div", "eyebrow", "Pressing on the calendar"));
      soon.forEach(function (m) { sb.appendChild(milestoneRow(m)); });
    }
  }));

  var done = h("button", "btn wide");
  done.textContent = plan.planned ? "Week planned ✓ — update" : "Mark the week planned";
  on(done, "click", function () {
    plan.planned = true; plan.at = new Date().toISOString(); save();
    toast("Week planned. Now close the laptop.");
    view = "today"; render();
  });
  wrap.appendChild(done);

  root.appendChild(wrap);
}

function step(n, title, build) {
  var d = h("details", "step");
  if (n === 1) d.open = true;
  var s = h("summary");
  s.appendChild(h("span", "snum", "0" + n));
  s.appendChild(h("span", null, esc(title)));
  s.appendChild(h("span", "chev", "›"));
  d.appendChild(s);
  var body = h("div", "sbody");
  build(body);
  d.appendChild(body);
  return d;
}
function toggleOpt(label, arr, onchange) {
  var idx = arr.indexOf(label);
  var r = h("div", "opt");
  r.dataset.on = idx >= 0 ? "1" : "0";
  var chk = h("button", "chk"); chk.type = "button";
  chk.setAttribute("aria-pressed", idx >= 0 ? "true" : "false");
  chk.innerHTML = idx >= 0 ? "&#10003;" : "";
  r.appendChild(chk);
  r.appendChild(h("div", null, esc(label)));
  on(r, "click", function () {
    var i = arr.indexOf(label);
    if (i >= 0) arr.splice(i, 1); else arr.push(label);
    onchange(); render();
  });
  return r;
}

/* ---------------- GOALS ---------------- */
function viewGoals(root) {
  document.getElementById("tbsub").textContent = "Goals to Spring 2028";
  var wrap = h("div", "stack g20");

  /* 90-day */
  var n90 = h("div", "sec");
  var nd = S.ninety.filter(function (x) { return x.done; }).length;
  n90.appendChild(sechead("The next 90 days", nd + "/" + S.ninety.length));
  S.ninety.forEach(function (x) {
    var c = h("div", "ms" + (x.done ? " done" : ""));
    var chk = h("button", "chk"); chk.type = "button";
    chk.setAttribute("aria-pressed", x.done ? "true" : "false");
    chk.innerHTML = x.done ? "&#10003;" : "";
    on(chk, "click", function () { x.done = !x.done; save(); render(); });
    c.appendChild(chk);
    var b = h("div", "body");
    b.appendChild(h("div", "ttl", esc(x.title)));
    b.appendChild(h("div", "why", esc(x.detail)));
    var mt = h("div", "meta"); mt.appendChild(h("span", "pill acc", esc(x.when)));
    b.appendChild(mt);
    c.appendChild(b);
    n90.appendChild(c);
  });
  wrap.appendChild(n90);

  /* filters */
  var f = h("div", "filters");
  var opts = [["all", "All"], ["open", "Open"], ["overdue", "Overdue"], ["build", "Builds"]];
  S.projects.forEach(function (p) { opts.push([p.id, p.name.replace(" Project", "")]); });
  opts.forEach(function (o) {
    var c = h("button", "fchip"); c.textContent = o[1];
    c.setAttribute("aria-pressed", goalFilter === o[0] ? "true" : "false");
    on(c, "click", function () { goalFilter = o[0]; render(); });
    f.appendChild(c);
  });
  wrap.appendChild(f);

  var list = S.milestones.filter(function (m) {
    if (goalFilter === "all") return true;
    if (goalFilter === "open") return !m.done;
    if (goalFilter === "overdue") return !m.done && m.due && daysBetween(dkey(today()), m.due) < 0;
    if (goalFilter === "build") return m.build;
    return m.projectId === goalFilter;
  });

  var byTerm = {};
  var order = [];
  list.forEach(function (m) {
    if (!byTerm[m.term]) { byTerm[m.term] = []; order.push(m.term); }
    byTerm[m.term].push(m);
  });
  order.forEach(function (t) {
    var sec = h("div", "sec");
    var dn = byTerm[t].filter(function (m) { return m.done; }).length;
    sec.appendChild(sechead(t, dn + "/" + byTerm[t].length));
    byTerm[t].forEach(function (m) { sec.appendChild(milestoneRow(m)); });
    wrap.appendChild(sec);
  });
  if (!list.length) wrap.appendChild(h("div", "empty", "Nothing matches that filter."));

  /* projects reference */
  var ps = h("div", "sec");
  ps.appendChild(sechead("Projects & sliders", S.projects.length + " projects"));
  S.projects.forEach(function (p) {
    var open = S.milestones.filter(function (m) { return m.projectId === p.id && !m.done; }).length;
    var total = S.milestones.filter(function (m) { return m.projectId === p.id; }).length;
    var card = h("div", "projcard");
    var ph = h("div", "ph");
    var dot = h("span", "pdot"); dot.style.background = p.color; ph.appendChild(dot);
    var t = h("div", null); t.style.flex = "1";
    t.appendChild(h("div", "h-md", esc(p.name)));
    t.appendChild(h("div", "dim", (total - open) + " of " + total + " done · " + esc(p.priority)));
    ph.appendChild(t);
    var chev = h("span", "dim", "›");
    ph.appendChild(chev);
    on(ph, "click", function () { showProject(p); });
    card.appendChild(ph);
    ps.appendChild(card);
  });
  wrap.appendChild(ps);

  root.appendChild(wrap);
}

function showProject(p) {
  openSheet(p.name, function (body) {
    body.appendChild(h("div", "eyebrow", "Purpose"));
    body.appendChild(h("div", "muted", esc(p.purpose)));
    body.appendChild(h("div", "eyebrow", "Graduation mindset · Spring 2028"));
    var m = h("div", "muted"); m.style.fontFamily = "var(--display)"; m.style.fontSize = "16px";
    m.style.fontStyle = "italic"; m.textContent = "“" + p.mindset + "”";
    body.appendChild(m);
    body.appendChild(h("div", "eyebrow", "Sliders"));
    S.sliders.filter(function (s) { return s.projectId === p.id; }).forEach(function (s) {
      var c = h("div", "card");
      c.appendChild(h("div", "h-md", esc(s.name)));
      c.appendChild(h("div", "dim", esc(s.definition)));
      c.appendChild(h("div", "eyebrow", "Graduation outcome"));
      c.appendChild(h("div", "muted", esc(s.outcome)));
      body.appendChild(c);
    });
  });
}

/* ---------------- ROUTINES ---------------- */
function viewRoutines(root) {
  document.getElementById("tbsub").textContent = "Routines";
  var wrap = h("div", "stack g20");
  wrap.appendChild(h("div", "muted", "Twenty-three of the Memento's Routines milestones were checklist items. This is where they live now — they reset themselves, and they are not a project any more."));
  [["daily", "Daily"], ["weekly", "Weekly · Sunday"], ["monthly", "Monthly"], ["biannual", "Twice yearly"]].forEach(function (pr) {
    var list = S.routines.filter(function (r) { return r.period === pr[0]; });
    if (!list.length) return;
    var dn = list.filter(function (r) { return routineDone(r); }).length;
    var sec = h("div", "sec");
    sec.appendChild(sechead(pr[1], dn + "/" + list.length));
    list.forEach(function (r) { sec.appendChild(routineRow(r)); });
    wrap.appendChild(sec);
  });
  var add = h("button", "btn ghost wide"); add.textContent = "+ Add routine";
  on(add, "click", function () {
    openSheet("New routine", function (body) {
      var n = h("input"); n.type = "text"; n.placeholder = "e.g. Change water filter";
      var l1 = h("label", "fld"); l1.appendChild(h("span", null, "Name")); l1.appendChild(n);
      var s = h("select");
      [["daily","Daily"],["weekly","Weekly"],["monthly","Monthly"],["biannual","Twice yearly"]]
        .forEach(function (o) { s.appendChild(new Option(o[1], o[0])); });
      var l2 = h("label", "fld"); l2.appendChild(h("span", null, "Repeats")); l2.appendChild(s);
      body.appendChild(l1); body.appendChild(l2);
      var b = h("button", "btn wide"); b.textContent = "Add";
      on(b, "click", function () {
        if (!n.value.trim()) return;
        S.routines.push({ id: uid(), name: n.value.trim(), period: s.value });
        save(); closeSheet(); render();
      });
      body.appendChild(b);
    });
  });
  wrap.appendChild(add);
  root.appendChild(wrap);
}

/* ============================ menu / capture ============================ */
function openMenu() {
  openSheet("Detour", function (body) {
    var stats = h("div", "card");
    var mdone = S.milestones.filter(function (m) { return m.done; }).length;
    stats.appendChild(h("div", "eyebrow", "Progress"));
    stats.appendChild(h("div", "h-md", mdone + " of " + S.milestones.length + " milestones done"));
    var gradDays = daysBetween(dkey(today()), "2028-05-31");
    stats.appendChild(h("div", "dim", gradDays + " days to Anderson graduation."));
    body.appendChild(stats);

    body.appendChild(menuBtn("Sync",
      window.DETOUR && window.DETOUR.syncStatusLine ? window.DETOUR.syncStatusLine() : "Not available",
      function () {
        if (window.DETOUR && window.DETOUR.syncPanel) window.DETOUR.syncPanel();
        else toast("sync.js did not load");
      }));
    body.appendChild(menuBtn("Weekly template", "The recurring blocks that generate every week", editTemplates));
    body.appendChild(menuBtn("All open tasks", S.tasks.filter(function (t) { return !t.done; }).length + " across every slider", function () {
      var open = S.tasks.filter(function (t) { return !t.done; }).sort(function (a, b) {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1; if (!b.due) return -1;
        return a.due < b.due ? -1 : 1;
      });
      showTaskList("Open tasks", open);
    }));
    body.appendChild(menuBtn("Captured notes", S.notes.length + " saved", showNotes));
    body.appendChild(menuBtn("Mementos", "Quarterly reflection dates", showMementos));
    body.appendChild(menuBtn("Theme", S.theme === "auto" ? "Follows your phone" : S.theme, function () {
      S.theme = S.theme === "auto" ? "dark" : S.theme === "dark" ? "light" : "auto";
      applyTheme(); save(); closeSheet(); openMenu();
    }));
    body.appendChild(menuBtn("Export data", "Back up everything as JSON", exportData));
    body.appendChild(menuBtn("Import data", "Restore from a backup file", importData));
    body.appendChild(menuBtn("Reset to plan", "Wipe local changes, reload the field plan", function () {
      if (!confirm("Erase all your blocks, ticks and notes, and reload the original field plan?")) return;
      localStorage.removeItem(KEY); location.reload();
    }));
    var f = h("div", "dim");
    f.style.marginTop = "6px";
    f.innerHTML = "Detour · built from the LA Era field plan.<br>All data stays on this device. Nothing is uploaded.";
    body.appendChild(f);
  });
}
function menuBtn(title, sub, fn) {
  var c = h("div", "card");
  c.style.cursor = "pointer";
  c.appendChild(h("div", "h-md", esc(title)));
  c.appendChild(h("div", "dim", esc(sub)));
  on(c, "click", fn);
  return c;
}

function editTemplates() {
  openSheet("Weekly template", function (body) {
    body.appendChild(h("div", "dim", "These recurring blocks generate every week automatically. Changing one here changes it everywhere from now on."));
    var byDay = {};
    S.templates.forEach(function (t) { (byDay[t.day] = byDay[t.day] || []).push(t); });
    for (var d = 0; d < 7; d++) {
      if (!byDay[d]) continue;
      body.appendChild(h("div", "eyebrow", DAYNAMES[d]));
      byDay[d].sort(function (a, b) { return hmToMins(a.start) - hmToMins(b.start); }).forEach(function (t) {
        var r = h("div", "rt");
        var bar = h("span", "pdot"); bar.style.background = t.projectId ? projColor(t.projectId) : "var(--line-strong)";
        r.appendChild(bar);
        r.appendChild(h("div", "n", esc(t.label) + " <span class='dim mono'>" + minsToLabel(hmToMins(t.start)) + " · " + t.mins + "m</span>" +
          (t.sliderId ? "<br><span class='dim'>" + esc(sliderShort(t.sliderId)) + "</span>" : "")));
        var x = h("button", "btn ghost sm"); x.textContent = "Remove";
        on(x, "click", function () {
          S.templates = S.templates.filter(function (q) { return q.id !== t.id; });
          save(); closeSheet(); editTemplates(); render();
        });
        r.appendChild(x);
        body.appendChild(r);
      });
    }
    var addT = h("button", "btn wide"); addT.textContent = "+ Add recurring block";
    on(addT, "click", function () {
      openSheet("New recurring block", function (b2) {
        var n = h("input"); n.type = "text"; n.placeholder = "Label";
        var day = h("select"); DAYNAMES.forEach(function (dn, i) { day.appendChild(new Option(dn, i)); });
        var sl = sliderSelect(null);
        var st = h("input"); st.type = "time"; st.value = "19:00";
        var mn = h("input"); mn.type = "number"; mn.value = 90; mn.step = 15; mn.min = 15;
        [["Label", n], ["Day", day], ["Slider", sl], ["Start", st], ["Minutes", mn]].forEach(function (p) {
          var l = h("label", "fld"); l.appendChild(h("span", null, p[0])); l.appendChild(p[1]); b2.appendChild(l);
        });
        var go = h("button", "btn wide"); go.textContent = "Add";
        on(go, "click", function () {
          var s = sl.value ? slider(sl.value) : null;
          S.templates.push({ id: uid(), day: +day.value, projectId: s ? s.projectId : null,
            sliderId: sl.value || null,
            label: n.value.trim() || (s ? sliderShort(s.id) : "Block"),
            start: st.value, mins: Math.max(15, +mn.value || 60), kind: "project" });
          save(); closeSheet(); render();
        });
        b2.appendChild(go);
      });
    });
    body.appendChild(addT);
  });
}

function showNotes() {
  openSheet("Captured", function (body) {
    if (!S.notes.length) body.appendChild(h("div", "empty", "Nothing captured yet. Use the + button in the header."));
    S.notes.slice().reverse().forEach(function (n) {
      var c = h("div", "card");
      c.appendChild(h("div", "muted", esc(n.text)));
      var mt = h("div", "meta"); mt.style.marginTop = "8px";
      mt.appendChild(h("span", "dim mono", new Date(n.ts).toLocaleDateString()));
      if (n.projectId) {
        var p = project(n.projectId);
        if (p) mt.appendChild(h("span", "pill", esc(p.name)));
      }
      var del = h("button", "btn ghost sm"); del.textContent = "Delete"; del.style.marginLeft = "auto";
      on(del, "click", function () {
        S.notes = S.notes.filter(function (q) { return q.id !== n.id; });
        save(); closeSheet(); showNotes();
      });
      mt.appendChild(del);
      c.appendChild(mt);
      body.appendChild(c);
    });
  });
}

function showMementos() {
  openSheet("Mementos", function (body) {
    body.appendChild(h("div", "dim", "One at the end of each Anderson quarter. Each is when the field plan gets rewritten — reflect, learn, update, schedule."));
    S.mementos.forEach(function (m) {
      var n = daysBetween(dkey(today()), m.due);
      var c = h("div", "card");
      c.appendChild(h("div", "h-md", "Memento " + m.n + " — " + esc(m.label)));
      c.appendChild(h("div", "dim", m.due + (n >= 0 ? " · in " + n + " days" : " · passed")));
      body.appendChild(c);
    });
  });
}

/* ============================ the assistant ============================
   Plain English in, sorted items out. Runs entirely on this device — no key,
   no network, works on the subway. It guesses; the preview is where you fix
   the guess before anything is written. */

var WEEKDAY_WORDS = {
  sunday:0, sun:0, monday:1, mon:1, tuesday:2, tues:2, tue:2, wednesday:3, weds:3, wed:3,
  thursday:4, thurs:4, thur:4, thu:4, friday:5, fri:5, saturday:6, sat:6
};
var MONTH_WORDS = {
  january:0, jan:0, february:1, feb:1, march:2, mar:2, april:3, apr:3, may:4,
  june:5, jun:5, july:6, jul:6, august:7, aug:7, september:8, sept:8, sep:8,
  october:9, oct:9, november:10, nov:10, december:11, dec:11
};

/* slider aliases — the vocabulary he actually types */
var ALIASES = [
  ["e170bea8eb", ["ema","alumni","alumni relations","vp of music","club","board","officer","hillel","treasurer","leadership","committee","chapter","elected","election"]],
  ["4620f197bc", ["anderson","class","homework","coursework","professor","syllabus","lecture","exam","midterm","final","bruinlearn","capstone","bcc","price center","easton","memes","center","specialization","enroll","registrar","study group","case"]],
  ["c4ad3ee6f3", ["otherside","off record","ors","job","internship","intern","recruit","offer","salary","royalt","label","a&r","manager","management","career","paid","contract","resume","application"]],
  ["310350efa2", ["workout","gym","lift","run club","run","hike","cardio","bruinstrong","rec center","stretch","training"]],
  ["1792b12021", ["meal","cook","recipe","grocer","dinner","lunch prep","meal prep","kitchen","trader joe","shop for food"]],
  ["408540ebe2", ["routine","checklist","reset","laundry","clean the","chores"]],
  ["a54f005627", ["taste","reference","influence","inspiration","creative identity","listen to","study the"]],
  ["7625c1a119", ["logic","mix","mixing","master","arrangement","sound design","drums","sample","plugin","stems session","song structure","production course"]],
  ["98fe52e687", ["session","beat","collab","feature","ttbby","deetz","pine boys","swagboys","tgns","gentleman","studio time","record with","produce for"]],
  ["4598f2d0c2", ["release","drop","distrokid","album","ep ","single","catalog","chicago bounce","croissant","1million","tracklist","master delivery","upload to"]],
  ["d179a7ccd2", ["studiovault","site","deploy","frontend","backend","landing page","ui","ship the","build the page","domain","hosting"]],
  ["10463c1a7d", ["the archive","ingest","tier 1","artist page","discography","credits","musicbrainz","scrape","media enterprise"]],
  ["bb43189ac5", ["community","feedback","contributor","user test","outreach","reddit","discord","survey","interview a user"]],
  ["338e7c85dc", ["llc","incorporate","business structure","revenue","pricing","cap table","accounting","monetiz"]],
  ["ebdcefcb48", ["spreadsheet","review","rating","rym","rateyourmusic","frank ocean","nostalgia","voice memo","write up"]],
  ["9b4ef7c76d", ["console","mod","n64","gamecube","retro","solder","cartridge","emulat"]],
  ["5421cfc68e", ["media inventory","vinyl","cd ","collection","inventory","box of"]],
  ["83535dc77f", ["budget","spend","expense","loan","juno","tuition","rent","bill","subscription","statement"]],
  ["eab903428f", ["invest","portfolio","brokerage","stock","roth","index fund","paper trade"]],
  ["82be1baec4", ["text archiv","imessage","extract","stems archive","corpus","backup texts","old messages","photo dump"]],
  ["b54e2ba93d", ["memoir","chapter","draft","memento","essay","write about","写"]]
];

/* the handful of words that are unmistakably his — worth more than a long
   generic match like "application" or "review" happening to be in the line */
var STRONG = ("ema|hillel|otherside|off record|studiovault|ttbby|deetz|pine boys|swagboys|tgns|" +
  "chicago bounce|croissant|1million|juno|bruinlearn|bruinstrong|anderson|bcc|rateyourmusic|rym|" +
  "frank ocean|nostalgia|distrokid|logic|n64|gamecube|memento|memoir|imessage|run club|" +
  "price center|easton|memes|release|workout").split("|");

var TASK_VERBS = /\b(email|e-mail|text|call|dm|message|reach out|follow up|follow-up|ask|submit|apply|send|finish|draft|write up|book|sign up|register|order|buy|pay|renew|read|review|check|confirm|print|upload|post|fix|update|remind|set up|release|drop|ship|launch|publish|deliver)\b/;
var DUE_WORDS = /\b(due|deadline|by|before|no later than|goes up|opens|closes)\b/;
var BLOCK_WORDS = /\b(block|session|studio|gym|workout|class|lecture|meeting|meet with|call with|work on|focus|sprint|practice|coffee with|lunch with)\b/;

function parseCapture(raw) {
  var text = String(raw || "").trim();
  if (!text) return null;
  var low = text.toLowerCase();
  var cuts = [];               // [start, end] spans consumed by date/time parsing
  function cut(m, i) { if (m) cuts.push([m.index + (i || 0), m.index + m[0].length]); }

  var base = today();
  var out = { title: "", kind: "note", sliderId: null, projectId: null,
              due: null, date: null, start: null, mins: 90, repeatDay: null, raw: text };

  /* ---- recurrence ---- */
  var mRep = /\b(?:every|each)\s+(sunday|sundays|monday|mondays|tuesday|tuesdays|wednesday|wednesdays|thursday|thursdays|friday|fridays|saturday|saturdays)\b/.exec(low);
  if (mRep) {
    out.repeatDay = WEEKDAY_WORDS[mRep[1].replace(/s$/, "")];
    cut(mRep);
  } else if (/\b(?:every ?day|daily)\b/.test(low)) {
    var mD = /\b(?:every ?day|daily)\b/.exec(low); out.repeatDay = -1; cut(mD);
  }

  /* ---- explicit time range: "7-9pm", "8 to 9:30am" ---- */
  var mRange = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to|until|til|till)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/.exec(low);
  if (mRange) {
    var e2 = to24(+mRange[4], +(mRange[5] || 0), mRange[6]);
    var s2 = to24(+mRange[1], +(mRange[2] || 0), mRange[3] || mRange[6]);
    out.start = minsToHM(s2);
    out.mins = Math.max(15, e2 - s2);
    cut(mRange);
  } else {
    var mAt = /\b(?:at|from|@)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/.exec(low);
    if (mAt) { out.start = minsToHM(to24(+mAt[1], +(mAt[2] || 0), mAt[3])); cut(mAt); }
    else {
      var mBare = /\bat\s+(\d{1,2})(?::(\d{2}))?\b/.exec(low);
      if (mBare) {
        var hh = +mBare[1];
        if (hh <= 7) hh += 12;                 /* "at 7" in a plan means evening */
        out.start = minsToHM(hh * 60 + (+(mBare[2] || 0)));
        cut(mBare);
      } else if (/\bnoon\b/.test(low)) { out.start = "12:00"; cut(/\bnoon\b/.exec(low)); }
    }
  }

  /* ---- duration --- longest alternatives first, or "2 hours" leaves an "s" ---- */
  var mHr = /\b(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr|h)\b/.exec(low);
  var mMin = /\b(\d{1,3})\s*(?:minutes|minute|mins|min|m)\b/.exec(low);
  if (mHr) { out.mins = Math.round(parseFloat(mHr[1]) * 60); cut(mHr); if (mMin) { out.mins += +mMin[1]; cut(mMin); } }
  else if (mMin) { out.mins = +mMin[1]; cut(mMin); }
  else if (/\bhalf an hour\b|\bhalf hour\b/.test(low)) { out.mins = 30; cut(/\bhalf an? hour\b/.exec(low)); }
  else if (/\ban hour\b/.test(low)) { out.mins = 60; cut(/\ban hour\b/.exec(low)); }

  /* ---- date ---- */
  var d = null;
  var mToday = /\b(today|tonight|this evening|this morning|this afternoon)\b/.exec(low);
  var mTom = /\b(tomorrow|tmrw|tmr)\b/.exec(low);
  var mIn = /\bin\s+(\d+)\s+(day|days|week|weeks|month|months)\b/.exec(low);
  var mWd = /\b(?:this|next|on|by|due)?\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues|tue|weds|wed|thurs|thur|thu|fri|sat)\b/.exec(low);
  var mMd = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/.exec(low);
  var mDm = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b/.exec(low);
  var mSlash = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(low);

  if (mToday) {
    d = base; cut(mToday);
    if (/tonight|this evening/.test(mToday[1]) && !out.start) out.start = "19:00";
    if (/this morning/.test(mToday[1]) && !out.start) out.start = "09:00";
    if (/this afternoon/.test(mToday[1]) && !out.start) out.start = "14:00";
  } else if (mTom) { d = addDays(base, 1); cut(mTom); }
  else if (mIn) {
    var n = +mIn[1], unit = mIn[2];
    d = addDays(base, unit.indexOf("week") === 0 ? n * 7 : unit.indexOf("month") === 0 ? n * 30 : n);
    cut(mIn);
  } else if (mWd) {
    var wd = WEEKDAY_WORDS[mWd[1]];
    var delta = (wd - base.getDay() + 7) % 7;
    if (delta === 0) delta = 7;                       /* "on Tuesday" said on a Tuesday means next one */
    d = addDays(base, delta);
    if (/\bnext\s+$/.test(low.slice(0, mWd.index + mWd[0].indexOf(mWd[1]))) ||
        /\bnext\s/.test(mWd[0])) {
      if (weekStartOf(d).getTime() === weekStartOf(base).getTime()) d = addDays(d, 7);
    }
    cut(mWd);
  } else if (mMd) { d = monthDay(MONTH_WORDS[mMd[1]], +mMd[2], base); cut(mMd); }
  else if (mDm) { d = monthDay(MONTH_WORDS[mDm[2]], +mDm[1], base); cut(mDm); }
  else if (mSlash) { d = monthDay(+mSlash[1] - 1, +mSlash[2], base, mSlash[3]); cut(mSlash); }
  else if (/\bnext week\b/.test(low)) { d = addDays(weekStartOf(base), 8); cut(/\bnext week\b/.exec(low)); }
  else if (/\bend of (?:the )?month\b/.test(low)) {
    d = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    cut(/\bend of (?:the )?month\b/.exec(low));
  } else {
    /* a bare month — "release TGNS in October" — lands on the 1st */
    var mMonth = /\b(?:in|by|during|before)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/.exec(low);
    if (mMonth) { d = monthDay(MONTH_WORDS[mMonth[1]], 1, base); cut(mMonth); }
  }

  /* ---- what kind of thing is this ---- */
  var hasDue = DUE_WORDS.test(low);
  var hasVerb = TASK_VERBS.test(low);
  var hasBlockWord = BLOCK_WORDS.test(low);

  /* A clock time means it goes on the calendar — unless it is phrased as a
     deadline ("due Wednesday at 5"), which is a task that happens to have one. */
  if (out.repeatDay !== null) out.kind = "template";
  else if (out.start && !hasDue) out.kind = "block";
  else if (out.start && hasBlockWord) out.kind = "block";
  else if (hasVerb || hasDue) out.kind = "task";
  else if (/\bmilestone\b|\bgoal\b/.test(low)) out.kind = "milestone";
  else if (d) out.kind = "task";
  else out.kind = "note";

  if (out.kind === "block" || out.kind === "template") { out.date = d ? dkey(d) : dkey(base); }
  else if (d) { out.due = dkey(d); }

  /* ---- which slider ---- */
  var best = null, bestScore = 0;
  ALIASES.forEach(function (pair) {
    pair[1].forEach(function (word) {
      var w = word.trim();
      /* whole words only, so "ema" does not fire inside "cinema" */
      var re = new RegExp("(^|[^a-z0-9])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z0-9]|$)");
      if (!re.test(low)) return;
      var score = w.length + (w.indexOf(" ") >= 0 ? 4 : 0) + (STRONG.indexOf(w) >= 0 ? 14 : 0);
      if (score > bestScore) { bestScore = score; best = pair[0]; }
    });
  });
  if (!best) {
    /* fall back to a literal slider or project name */
    S.sliders.forEach(function (s) {
      var n2 = sliderShort(s.id).toLowerCase();
      if (n2.length > 3 && low.indexOf(n2) >= 0 && n2.length > bestScore) { bestScore = n2.length; best = s.id; }
    });
  }
  out.sliderId = best;
  if (best) { var sObj = slider(best); if (sObj) out.projectId = sObj.projectId; }
  out.confident = bestScore >= 5;

  /* ---- title: whatever is left ---- */
  out.title = cleanTitle(text, cuts);
  if (!out.title) out.title = text;
  return out;
}

function to24(hr, min, ap) {
  var h24 = hr % 12;
  if (ap === "pm") h24 += 12;
  else if (!ap && hr <= 7) h24 += 12;      /* bare "7" reads as evening */
  else if (!ap) h24 = hr % 24;
  return h24 * 60 + min;
}
function monthDay(mi, day, base, yr) {
  var y = yr ? (+yr < 100 ? 2000 + +yr : +yr) : base.getFullYear();
  var d = new Date(y, mi, day);
  if (!yr && d < base) d = new Date(y + 1, mi, day);
  return d;
}
function cleanTitle(text, cuts) {
  /* blank out every span the date/time parser consumed, then tidy up */
  var chars = text.split("");
  cuts.forEach(function (c) { for (var i = c[0]; i < c[1] && i < chars.length; i++) chars[i] = " "; });
  var t = chars.join("").replace(/\s+/g, " ").trim();

  /* leading filler — the way people actually start a sentence out loud */
  var lead = /^(?:i(?:'| a|'l|'v)?\w*\s+(?:need|have|want|got|gonna|will)?\s*(?:to\s+)?(?:have|do|run|take|get)?\s*(?:an?\s+)?|remember to|remind me to|make sure (?:to|i)|don'?t forget to|todo:?|to-?do:?|add|schedule|put|set)\s+/i;
  for (var pass = 0; pass < 2 && lead.test(t); pass++) t = t.replace(lead, "");

  /* trailing connectives left behind where a date used to be, repeatedly */
  var tail = /[\s,;·—–-]*\b(?:on|at|for|from|by|due|before|this|next|every|each|in|of|the|a|an|to|starting)\s*$/i;
  while (tail.test(t)) t = t.replace(tail, "");

  t = t.replace(/^(?:on|at|for|to|the|a|an|and|then)\s+/i, "")
       .replace(/\s*[,;·—–-]+\s*$/, "")
       .replace(/\s{2,}/g, " ")
       .trim();
  if (t) t = t.charAt(0).toUpperCase() + t.slice(1);
  return t;
}

function openAssistant(prefill) {
  openSheet("Say it in plain English", function (body) {
    body.appendChild(h("div", "muted",
      "Type it the way you'd say it. One thing per line. It sorts each line into a block, a task or a note, guesses the slider and the date — then shows you the guess so you can fix it before anything is saved."));

    var ta = h("textarea");
    ta.style.minHeight = "120px";
    ta.placeholder = "Anderson productivity block tonight, 1 hour\n" +
                     "Email the EMA alumni director to find time to meet, due Wednesday\n" +
                     "EMA application goes up Wednesday\n" +
                     "StudioVault every Tuesday 7pm for 2 hours";
    if (prefill) ta.value = prefill;
    body.appendChild(ta);

    var out = h("div", "stack g10");
    body.appendChild(out);

    var go = h("button", "btn wide"); go.textContent = "Sort it";
    on(go, "click", function () {
      var lines = ta.value.split(/[\n;]+/).map(function (s) { return s.trim(); }).filter(Boolean);
      out.innerHTML = "";
      if (!lines.length) { toast("Nothing to sort"); return; }
      var parsed = lines.map(parseCapture).filter(Boolean);
      var editors = parsed.map(function (p) { return previewCard(p); });
      editors.forEach(function (e) { out.appendChild(e.el); });

      var commit = h("button", "btn wide");
      commit.textContent = "Add " + editors.length + " item" + (editors.length === 1 ? "" : "s");
      on(commit, "click", function () {
        var n = 0;
        editors.forEach(function (e) { if (e.commit()) n++; });
        save(); closeSheet(); render();
        toast(n + " added");
      });
      out.appendChild(commit);
      var again = h("button", "btn ghost wide"); again.textContent = "Edit the text and re-sort";
      on(again, "click", function () { out.innerHTML = ""; ta.focus(); });
      out.appendChild(again);
    });
    body.appendChild(go);

    setTimeout(function () { ta.focus(); }, 80);
  });
}

/* one editable card per parsed line — nothing is written until you confirm */
function previewCard(p) {
  var el = h("div", "pv");

  var kindRow = h("div", "kindrow");
  var kindSel = h("select");
  [["block", "Block on the calendar"], ["task", "Task under a slider"],
   ["template", "Recurring weekly block"], ["milestone", "Milestone"], ["note", "Note only"],
   ["skip", "Skip this line"]].forEach(function (o) {
    var opt = new Option(o[1], o[0]);
    if (o[0] === p.kind) opt.selected = true;
    kindSel.appendChild(opt);
  });
  kindRow.appendChild(kindSel);
  el.appendChild(kindRow);
  el.appendChild(h("div", "pvraw", "“" + esc(p.raw) + "”"));

  var title = h("input"); title.type = "text"; title.value = p.title;
  var lt = h("label", "fld"); lt.appendChild(h("span", null, "Title")); lt.appendChild(title);
  el.appendChild(lt);

  var slSel = sliderSelect(p.sliderId);
  var ls = h("label", "fld");
  ls.appendChild(h("span", null, "Slider" + (p.sliderId && !p.confident ? " · low confidence" : "")));
  ls.appendChild(slSel);
  el.appendChild(ls);

  /* block fields */
  var blockFields = h("div", "pvrow");
  var dateI = h("input"); dateI.type = "date"; dateI.value = p.date || (p.due || dkey(today()));
  var startI = h("input"); startI.type = "time"; startI.value = p.start || "19:00";
  var minsI = h("input"); minsI.type = "number"; minsI.step = 15; minsI.min = 15; minsI.value = p.mins;
  blockFields.appendChild(labelled("Date", dateI));
  blockFields.appendChild(labelled("Start", startI));
  blockFields.appendChild(labelled("Mins", minsI));
  el.appendChild(blockFields);

  /* recurring day */
  var dayWrap = h("div", "pvrow");
  var daySel = h("select");
  DAYNAMES.forEach(function (dn, i) {
    var o = new Option(dn, i);
    if (p.repeatDay === i) o.selected = true;
    daySel.appendChild(o);
  });
  if (p.repeatDay === null || p.repeatDay < 0) daySel.value = String((p.date ? parseKey(p.date) : today()).getDay());
  dayWrap.appendChild(labelled("Repeats", daySel));
  el.appendChild(dayWrap);

  /* due date */
  var dueWrap = h("div", "pvrow");
  var dueI = h("input"); dueI.type = "date"; dueI.value = p.due || "";
  dueWrap.appendChild(labelled("Due", dueI));
  el.appendChild(dueWrap);

  function sync() {
    var k = kindSel.value;
    blockFields.classList.toggle("hide", k !== "block");
    dayWrap.classList.toggle("hide", k !== "template");
    dueWrap.classList.toggle("hide", k !== "task" && k !== "milestone");
    ls.classList.toggle("hide", k === "note");
    lt.classList.toggle("hide", k === "skip");
    el.dataset.kind = k;
  }
  on(kindSel, "change", sync);
  sync();

  function commit() {
    var k = kindSel.value;
    if (k === "skip") return false;
    var text = title.value.trim();
    if (!text) return false;
    var slId = slSel.value || null;
    var sObj = slId ? slider(slId) : null;
    var pid = sObj ? sObj.projectId : null;

    if (k === "task") {
      addTask({ sliderId: slId, projectId: pid, title: text, due: dueI.value || null });
    } else if (k === "block") {
      var key = dateI.value || dkey(today());
      if (!S.extras[key]) S.extras[key] = [];
      S.extras[key].push({ key: uid(), projectId: pid, sliderId: slId, label: text,
                           start: startI.value, mins: Math.max(15, +minsI.value || 60), kind: "project" });
    } else if (k === "template") {
      S.templates.push({ id: uid(), day: +daySel.value, projectId: pid, sliderId: slId,
                         label: text, start: startI.value, mins: Math.max(15, +minsI.value || 60), kind: "project" });
    } else if (k === "milestone") {
      S.milestones.push({ id: uid(), projectId: pid, slider: sObj ? sObj.name : null, title: text,
                          why: "Added from capture.", term: "Fall 2026", due: dueI.value || null,
                          build: false, done: false, doneAt: null });
    } else {
      S.notes.push({ id: uid(), ts: new Date().toISOString(), text: text, projectId: pid });
    }
    return true;
  }

  return { el: el, commit: commit };
}

function labelled(text, node) {
  var l = h("label", "fld");
  l.appendChild(h("span", null, text));
  l.appendChild(node);
  return l;
}

/* ---- export / import ---- */
function exportData() {
  var blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = "detour-backup-" + dkey(today()) + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  toast("Backup downloaded");
}
function importData() {
  var inp = document.createElement("input");
  inp.type = "file"; inp.accept = "application/json,.json";
  on(inp, "change", function () {
    var f = inp.files && inp.files[0];
    if (!f) return;
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var data = JSON.parse(fr.result);
        if (!data.version || !data.milestones) throw new Error("not a Detour backup");
        S = data; save(); closeSheet(); applyTheme(); render();
        toast("Restored");
      } catch (e) { toast("That file is not a Detour backup"); }
    };
    fr.readAsText(f);
  });
  inp.click();
}

/* ============================ theme + boot ============================ */
function applyTheme() {
  if (S.theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", S.theme);
}

load();
save();            /* persist the seeded state on first run */
applyTheme();

Array.prototype.forEach.call(document.querySelectorAll("#tabs .tab"), function (t) {
  on(t, "click", function () {
    if (view === "www" && t.dataset.view === "www") wwwCursor = today();   /* second tap returns to today */
    view = t.dataset.view;
    render();
  });
});
on(document.getElementById("btn-menu"), "click", openMenu);
on(document.getElementById("btn-capture"), "click", function () { openAssistant(); });
document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });
window.addEventListener("resize", syncTopbarH);

/* ---- seam for sync.js: it needs to read, replace and redraw the state ---- */
window.DETOUR = {
  get state() { return S; },
  setState: function (next) { S = next; migrate(); save(); },
  save: save, render: render, toast: toast,
  openSheet: openSheet, closeSheet: closeSheet,
  h: h, on: on, esc: esc, uid: uid,
  onSave: null            /* sync.js assigns this */
};

/* re-render on the hour so "right now" stays honest */
setInterval(function () { if (view === "today") render(); }, 60000);
document.addEventListener("visibilitychange", function () { if (!document.hidden) render(); });

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}
})();
