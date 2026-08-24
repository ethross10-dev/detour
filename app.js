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
    createdAt: new Date().toISOString(),
    theme: "auto",
    projects: clone(seed.projects),
    sliders: clone(seed.sliders),
    milestones: clone(seed.milestones),
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
  return S;
}
var saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
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
      return { key: t.id, templateId: t.id, projectId: t.projectId, label: t.label,
               start: t.start, mins: t.mins, kind: t.kind, fromTemplate: true };
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
var goalFilter = "all";

function render() {
  var el = document.getElementById("view");
  el.innerHTML = "";
  Array.prototype.forEach.call(document.querySelectorAll("#tabs .tab"), function (t) {
    t.setAttribute("aria-selected", t.dataset.view === view ? "true" : "false");
  });
  ({ today: viewToday, week: viewWeek, sunday: viewSunday, goals: viewGoals, routines: viewRoutines }[view])(el);
  el.scrollTop = 0;
  window.scrollTo(0, 0);
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
    var ms = b.projectId ? nextMilestone(b.projectId) : null;
    if (ms) hero.appendChild(h("div", "sub", "→ " + esc(ms.title)));
    else if (b.kind === "ritual") hero.appendChild(h("div", "sub", "The whole week gets decided here."));
    var act = h("div", "row"); act.style.marginTop = "4px";
    var go = h("button", "btn"); go.textContent = "Mark done";
    on(go, "click", function () { setBlockState(k, b.key, { done: true }); render(); });
    act.appendChild(go);
    if (b.projectId) {
      var open = h("button", "btn ghost"); open.textContent = "Goals";
      on(open, "click", function () { goalFilter = b.projectId; view = "goals"; render(); });
      act.appendChild(open);
    }
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
  var p = b.projectId ? project(b.projectId) : null;
  var meta = [];
  if (p) meta.push(p.name);
  if (st.note) meta.push(st.note);
  if (meta.length) body.appendChild(h("div", "m", esc(meta.join(" · "))));
  on(body, "click", function () { editBlock(b, date); });
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

/* ---------------- WEEK ---------------- */
function viewWeek(root) {
  document.getElementById("tbsub").textContent = "Week of " + fmtDate(weekCursor);
  var wrap = h("div", "stack g20");

  var nav = h("div", "wknav");
  var prev = h("button", "btn ghost sm"); prev.textContent = "‹ Prev";
  on(prev, "click", function () { weekCursor = addDays(weekCursor, -7); render(); });
  var now = h("button", "btn ghost sm"); now.textContent = "This week";
  on(now, "click", function () { weekCursor = weekStartOf(today()); render(); });
  var next = h("button", "btn ghost sm"); next.textContent = "Next ›";
  on(next, "click", function () { weekCursor = addDays(weekCursor, 7); render(); });
  nav.appendChild(prev); nav.appendChild(now); nav.appendChild(next);
  wrap.appendChild(nav);

  var totalMins = 0, totalDone = 0, totalBlocks = 0;
  for (var i = 0; i < 7; i++) {
    var d = addDays(weekCursor, i), k = dkey(d);
    var blocks = blocksFor(d);
    totalBlocks += blocks.length;
    blocks.forEach(function (b) {
      totalMins += b.mins;
      if (blockState(k, b.key).done) totalDone++;
    });
    var col = h("div", "daycol");
    var head = h("div", "dayhead" + (sameDay(d, today()) ? " today" : ""));
    head.appendChild(h("span", "dn", DAYNAMES[d.getDay()].slice(0, 3)));
    head.appendChild(h("span", "dd", MONTHS[d.getMonth()].slice(0,3) + " " + d.getDate()));
    head.appendChild(h("span", "ln"));
    var mins = blocks.reduce(function (s, b) { return s + b.mins; }, 0);
    if (mins) head.appendChild(h("span", "dim mono", (mins / 60).toFixed(mins % 60 ? 1 : 0) + "h"));
    col.appendChild(head);
    if (!blocks.length) {
      var e = h("div", "empty"); e.style.padding = "14px"; e.textContent = "Open";
      col.appendChild(e);
    }
    blocks.forEach(function (b) { col.appendChild(blockRow(b, d)); });
    var add = h("button", "btn ghost sm");
    add.textContent = "+ block";
    (function (dd) { on(add, "click", function () { editBlock(null, dd); }); })(d);
    col.appendChild(add);
    wrap.appendChild(col);
  }

  var sum = h("div", "card");
  sum.appendChild(h("div", "eyebrow", "Week load"));
  sum.appendChild(h("div", "h-md", (totalMins / 60).toFixed(1) + " hours blocked across " + totalBlocks + " blocks"));
  sum.appendChild(h("div", "dim", totalDone + " completed. Anything over about 25 hours of Detour blocks in a heavy academic week is a plan you will not keep."));
  wrap.appendChild(sum);

  root.appendChild(wrap);
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

    var sel = h("select");
    sel.appendChild(new Option("— none —", ""));
    S.projects.forEach(function (p) {
      var o = new Option(p.name, p.id);
      if (b && b.projectId === p.id) o.selected = true;
      sel.appendChild(o);
    });
    field("Project", sel, "project");

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
      var label = name.value.trim() || (sel.value ? project(sel.value).name : "Block");
      if (isNew || !b.fromTemplate) {
        if (!S.extras[k]) S.extras[k] = [];
        if (isNew) {
          var nb = { key: uid(), projectId: sel.value || null, label: label,
                     start: st.value, mins: Math.max(15, +len.value || 60), kind: "project" };
          S.extras[k].push(nb);
          if (note.value.trim()) setBlockState(k, nb.key, { note: note.value.trim() });
        } else {
          S.extras[k] = S.extras[k].map(function (x) {
            return x.key === b.key ? Object.assign(x, { projectId: sel.value || null, label: label,
              start: st.value, mins: Math.max(15, +len.value || 60) }) : x;
          });
          setBlockState(k, b.key, { note: note.value.trim() });
        }
      } else {
        /* editing a recurring template instance → detach it for this date only */
        if (!S.removed[k]) S.removed[k] = [];
        if (S.removed[k].indexOf(b.templateId) < 0) S.removed[k].push(b.templateId);
        if (!S.extras[k]) S.extras[k] = [];
        var det = { key: uid(), projectId: sel.value || null, label: label,
                    start: st.value, mins: Math.max(15, +len.value || 60), kind: b.kind };
        S.extras[k].push(det);
        setBlockState(k, det.key, { note: note.value.trim(), done: blockState(k, b.key).done });
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
    sb.appendChild(h("div", "dim", "Your weekly template already places the recurring ones. Open the Week tab to add, move or skip anything for this specific week."));
    var go = h("button", "btn wide"); go.textContent = "Open the week";
    on(go, "click", function () { weekCursor = upcoming; view = "week"; render(); });
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

    body.appendChild(menuBtn("Weekly template", "The recurring blocks that generate every week", editTemplates));
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
        r.appendChild(h("div", "n", esc(t.label) + " <span class='dim mono'>" + minsToLabel(hmToMins(t.start)) + " · " + t.mins + "m</span>"));
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
        var pr = h("select"); pr.appendChild(new Option("— none —", ""));
        S.projects.forEach(function (p) { pr.appendChild(new Option(p.name, p.id)); });
        var st = h("input"); st.type = "time"; st.value = "19:00";
        var mn = h("input"); mn.type = "number"; mn.value = 90; mn.step = 15; mn.min = 15;
        [["Label", n], ["Day", day], ["Project", pr], ["Start", st], ["Minutes", mn]].forEach(function (p) {
          var l = h("label", "fld"); l.appendChild(h("span", null, p[0])); l.appendChild(p[1]); b2.appendChild(l);
        });
        var go = h("button", "btn wide"); go.textContent = "Add";
        on(go, "click", function () {
          S.templates.push({ id: uid(), day: +day.value, projectId: pr.value || null,
            label: n.value.trim() || "Block", start: st.value, mins: Math.max(15, +mn.value || 60), kind: "project" });
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

function openCapture() {
  openSheet("Capture", function (body) {
    body.appendChild(h("div", "dim", "An idea, a review, a name, a link. Sort it later."));
    var t = h("textarea"); t.placeholder = "…";
    body.appendChild(t);
    var sel = h("select");
    sel.appendChild(new Option("— no project —", ""));
    S.projects.forEach(function (p) { sel.appendChild(new Option(p.name, p.id)); });
    var l = h("label", "fld"); l.appendChild(h("span", null, "Project")); l.appendChild(sel);
    body.appendChild(l);
    var b = h("button", "btn wide"); b.textContent = "Save";
    on(b, "click", function () {
      if (!t.value.trim()) { closeSheet(); return; }
      S.notes.push({ id: uid(), ts: new Date().toISOString(), text: t.value.trim(), projectId: sel.value || null });
      save(); closeSheet(); toast("Captured");
    });
    body.appendChild(b);
    setTimeout(function () { t.focus(); }, 80);
  });
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
  on(t, "click", function () { view = t.dataset.view; if (view === "week") weekCursor = weekStartOf(today()); render(); });
});
on(document.getElementById("btn-menu"), "click", openMenu);
on(document.getElementById("btn-capture"), "click", openCapture);
document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });

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
