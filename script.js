import { mergeLogs } from "./lib/mergeLogs.js";

// t types: easy | tempo | interval | hills | long | opt | race
// pace: display string shown in cell
// detail: short workout description (intervals/hills only)
const weeks = [
  // ── BASE PHASE ──────────────────────────────────────────────────────────────
  {
    w:1, dates:"Jul 6–Jul 12", tag:"base",
    note:"First week — your long run is already 14–15km so 14.5km on Saturday is fine. All easy pace, settle into the routine.",
    tue:{t:"easy", d:4.8,  pace:"7:30/km"},
    wed:{t:"opt",  d:4.8,  pace:"7:30/km"},
    fri:{t:"easy", d:8.1,  pace:"7:30/km"},
    sun:{t:"long", d:14.5, pace:"7:50/km"}
  },
  {
    w:2, dates:"Jul 13–Jul 19", tag:"stepback",
    note:"Step-back week. Shorter Saturday long run — let the body settle into the rhythm.",
    tue:{t:"easy", d:4.8, pace:"7:30/km"},
    wed:{t:"opt",  d:4.8, pace:"7:30/km"},
    fri:{t:"easy", d:8.1, pace:"7:30/km"},
    sun:{t:"long", d:9.7, pace:"7:45/km"}
  },
  // ── BUILD PHASE ─────────────────────────────────────────────────────────────
  {
    w:3, dates:"Jul 20–Jul 26", tag:"build",
    note:"First tempo session (Wed). Warm up 1km, hold 7:15/km through the middle, cool down 1km. Saturday's long run pushes past half marathon distance.",
    tue:{t:"easy",  d:4.8, pace:"7:20/km"},
    wed:{t:"opt",   d:4.8, pace:"7:30/km"},
    fri:{t:"tempo", d:9.7, pace:"7:15/km", detail:"1km WU · 7.7km @ tempo · 1km CD"},
    sun:{t:"long",  d:17.7, pace:"7:55/km"}
  },
  {
    w:4, dates:"Jul 27–Aug 2", tag:"build",
    note:"First hill session (Wed). Find a 200–300m hill — hard effort up, jog down, 6 reps. Builds leg strength and economy.",
    tue:{t:"easy",  d:4.8, pace:"7:20/km"},
    wed:{t:"opt",   d:6.4, pace:"7:30/km"},
    fri:{t:"hills", d:8.0, pace:"effort", detail:"2km WU · 6×250m hill reps · 2km CD"},
    sun:{t:"long",  d:19.3, pace:"7:55/km"}
  },
  {
    w:5, dates:"Aug 3–Aug 9", tag:"stepback",
    note:"Step-back week. Easy midweek run — legs recovering from the first hill session. Don't push.",
    tue:{t:"easy", d:4.8, pace:"7:20/km"},
    wed:{t:"opt",  d:4.8, pace:"7:30/km"},
    fri:{t:"easy", d:9.7, pace:"7:20/km"},
    sun:{t:"long", d:14.5, pace:"7:50/km"}
  },
  {
    w:6, dates:"Aug 10–Aug 16", tag:"build",
    note:"Tempo run gets longer. Saturday crosses 22km for the first time — real marathon training territory now.",
    tue:{t:"easy",  d:6.4,  pace:"7:15/km"},
    wed:{t:"opt",   d:6.4,  pace:"7:30/km"},
    fri:{t:"tempo", d:11.3, pace:"7:10/km", detail:"1.5km WU · 8km @ tempo · 1.5km CD"},
    sun:{t:"long",  d:22.5, pace:"7:55/km"}
  },
  {
    w:7, dates:"Aug 17–Aug 23", tag:"build",
    note:"First interval session. 400m repeats — controlled, not a sprint. Start practising race nutrition on Saturday's long run.",
    tue:{t:"easy",    d:6.4,  pace:"7:15/km"},
    wed:{t:"opt",     d:6.4,  pace:"7:30/km"},
    fri:{t:"interval",d:10.0, pace:"6:30/km", detail:"2km WU · 6×400m @ 6:30 · 90s jog rest · 2km CD"},
    sun:{t:"long",    d:24.1, pace:"8:00/km"}
  },
  {
    w:8, dates:"Aug 24–Aug 30", tag:"stepback",
    note:"Step-back week. Easy efforts only. Body absorbing the quality work from weeks 6–7.",
    tue:{t:"easy", d:6.4, pace:"7:20/km"},
    wed:{t:"opt",  d:6.4, pace:"7:30/km"},
    fri:{t:"easy", d:8.0, pace:"7:20/km"},
    sun:{t:"long", d:19.3, pace:"8:00/km"}
  },
  // ── PEAK PHASE ──────────────────────────────────────────────────────────────
  {
    w:9, dates:"Aug 31–Sep 6", tag:"peak",
    note:"Hill session returns — more reps, stronger legs now. Saturday pushes to 27km. Start of the peak block.",
    tue:{t:"easy",  d:6.4,  pace:"7:10/km"},
    wed:{t:"opt",   d:6.4,  pace:"7:25/km"},
    fri:{t:"hills", d:10.0, pace:"effort", detail:"2km WU · 8×250m hill reps · 2km CD"},
    sun:{t:"long",  d:27.4, pace:"8:00/km"}
  },
  {
    w:10, dates:"Sep 7–Sep 13", tag:"peak",
    note:"800m intervals — longer reps build marathon-specific endurance. 29km Saturday is your first true peak. Nail the nutrition.",
    tue:{t:"easy",    d:8.1,  pace:"7:10/km"},
    wed:{t:"opt",     d:6.4,  pace:"7:25/km"},
    fri:{t:"interval",d:11.0, pace:"6:20/km", detail:"2km WU · 5×800m @ 6:20 · 2min jog rest · 2km CD"},
    sun:{t:"long",    d:29.0, pace:"8:05/km"}
  },
  {
    w:11, dates:"Sep 14–Sep 20", tag:"stepback",
    note:"Mandatory step-back before the biggest weeks. Midweek tempo at controlled effort — don't race it.",
    tue:{t:"easy",  d:8.1,  pace:"7:10/km"},
    wed:{t:"opt",   d:6.4,  pace:"7:25/km"},
    fri:{t:"tempo", d:12.0, pace:"7:05/km", detail:"2km WU · 8km @ tempo · 2km CD"},
    sun:{t:"long",  d:21.0, pace:"7:55/km"}
  },
  {
    w:12, dates:"Sep 21–Sep 27", tag:"peak",
    note:"Kiprun Singapore Half Marathon — Sun 27 Sep, Marina Bay. Race at goal pace (6:45/km). Easy midweek, Saturday off. The race replaces the long run — don't add distance, and skip Friday's upper session if you'd rather arrive fresh.",
    tue:{t:"easy", d:8.1, pace:"7:05/km"},
    wed:{t:"opt",  d:4.8, pace:"7:20/km"},
    fri:{t:"easy", d:6.4, pace:"7:10/km"},
    sun:{t:"race", d:21.1, pace:"6:45/km", label:"🏃 Kiprun Singapore HM"}
  },
  {
    w:13, dates:"Sep 28–Oct 4", tag:"stepback",
    note:"Recovery week post-Kiprun. Easy everything — no tempo, no hills. Saturday's long run returns but keep it very relaxed.",
    tue:{t:"easy", d:8.1,  pace:"7:10/km"},
    wed:{t:"opt",  d:6.4,  pace:"7:25/km"},
    fri:{t:"easy", d:8.0,  pace:"7:10/km"},
    sun:{t:"long", d:19.3, pace:"7:55/km"}
  },
  {
    w:14, dates:"Oct 5–Oct 11", tag:"peak",
    note:"32km on Saturday — the longest run of the plan. Go easy (8:00+/km): time on feet, not pace. Midweek 1km intervals sharpen the legs before taper.",
    tue:{t:"easy",    d:8.1,  pace:"7:05/km"},
    wed:{t:"opt",     d:6.4,  pace:"7:20/km"},
    fri:{t:"interval",d:10.0, pace:"6:15/km", detail:"2km WU · 4×1km @ 6:15 · 90s jog rest · 2km CD"},
    sun:{t:"long",    d:32.2, pace:"8:10/km"}
  },
  // ── TAPER ────────────────────────────────────────────────────────────────────
  {
    w:15, dates:"Oct 12–Oct 18", tag:"taper",
    note:"Taper starts. Volume drops — keep the midweek tempo to stay sharp. Legs may feel heavy; that's normal.",
    tue:{t:"easy",  d:8.1, pace:"7:10/km"},
    wed:{t:"opt",   d:4.8, pace:"7:20/km"},
    fri:{t:"tempo", d:8.0, pace:"7:00/km", detail:"1km WU · 6km @ tempo · 1km CD"},
    sun:{t:"long",  d:19.3, pace:"7:50/km"}
  },
  {
    w:16, dates:"Oct 19–Oct 25", tag:"taper",
    note:"Big drop in volume. You'll feel restless — that's the legs charging up. Trust the taper. No heroics.",
    tue:{t:"easy", d:6.4, pace:"7:10/km"},
    wed:{t:"opt",  d:4.8, pace:"7:20/km"},
    fri:{t:"easy", d:6.4, pace:"7:10/km"},
    sun:{t:"long", d:12.9, pace:"7:45/km"}
  },
  {
    w:17, dates:"Oct 26–Nov 1", tag:"race",
    note:"Race week. Short shakeouts only, no gym at all. Stay off your feet, carb load Thu–Sat, sleep. Sunday 1 Nov is yours — 17 weeks of work pays off.",
    tue:{t:"easy", d:4.8, pace:"7:15/km"},
    wed:{t:"opt",  d:3.2, pace:"7:20/km"},
    fri:{t:"easy", d:3.2, pace:"7:15/km"},
    sun:{t:"race", d:42.2, pace:"6:45/km", label:"🏁 NYC Marathon"}
  },
];

const tagLabel = {
  base:"Base", build:"Build", stepback:"Step-back ↓",
  peak:"Peak", taper:"Taper ↓", race:"Race Week"
};

const cellRegistry = {}; // cellId -> { typeName, plannedDist, plannedPace }

function buildCell(info, dayLabel, dateStr, cellId) {
  const dateLine = dateStr ? `<div class="day-date">${dateStr}</div>` : "";
  if (!info) {
    return `<div class="day-cell cell-rest">
      <div class="day-name">${dayLabel}</div>
      ${dateLine}
      <div class="day-type">Rest</div>
    </div>`;
  }
  const { t, d, pace, label, detail } = info;
  const cls = {
    easy:"cell-easy", tempo:"cell-tempo", interval:"cell-interval",
    hills:"cell-hills", long:"cell-long", opt:"cell-optional",
    race:"cell-race", cross:"cell-cross", gym:"cell-gym", flex:"cell-flex"
  }[t] || "cell-easy";

  const typeName = {
    easy:"Easy run", tempo:"Tempo run", interval:"Intervals",
    hills:"Hill reps", long:"Long run", opt:"Easy (opt)",
    race: label || "Race", cross:"Cross-train", gym: label || "Gym", flex: label || "Flex"
  }[t];

  const distLine   = d      ? `<div class="day-dist">${d} km</div>`    : "";
  const paceLine   = pace   ? `<div class="day-pace">${pace}</div>`    : "";
  const detailLine = detail ? `<div class="day-detail">${detail}</div>`: "";
  const noteLine   = info.note ? `<div class="day-detail">${info.note}</div>` : "";

  const counts = ["easy","tempo","interval","hills","long","race"].includes(t) ? "run" : "extra";

  if (cellId) {
    cellRegistry[cellId] = { typeName, plannedDist: d || null, plannedPace: pace || null, counts };
  }

  const loggable = !["gym", "cross"].includes(t);
  const clickAttr = cellId && loggable ? `onclick="openModal('${cellId}')"` : "";

  return `<div class="day-cell ${cls}${loggable ? "" : " no-log"}" id="cell-${cellId}" data-cellid="${cellId}" data-counts="${counts}" ${clickAttr}>
    ${loggable ? '<div class="cell-check">✓</div>' : ""}
    <div class="day-name">${dayLabel}</div>
    ${dateLine}
    <div class="day-type">${typeName}</div>
    ${distLine}${paceLine}${detailLine}${noteLine}
    <div class="day-actual" id="actual-${cellId}" style="display:none;"></div>
  </div>`;
}

const sectionTitles = {
  1:  "Base Phase — Weeks 1–2",
  3:  "Build Phase — Weeks 3–8",
  9:  "Peak Phase — Weeks 9–14",
  15: "Taper & Race — Weeks 15–17"
};

const container = document.getElementById("weeks-container");

// Plan start: Monday July 6, 2026 (week runs Mon–Sun)
const planStart = new Date(2026, 6, 6); // month is 0-indexed, July=6

function weekDate(weekIndex, dayOffset) {
  // dayOffset: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  const d = new Date(planStart);
  d.setDate(d.getDate() + weekIndex * 7 + dayOffset);
  return d.toLocaleDateString("en-GB", { day:"numeric", month:"short" });
}

const crossCell  = { t:"cross" };
const RACE_WEEKS = [12, 17]; // Kiprun HM (Sun 27 Sep), NYC Marathon (Sun 1 Nov)
const restCell   = null;
const optCrossCell = { t:"cross", optional: true };

// Per-week Saturday override
// w.w: 12=Kiprun HM, 14=32km peak, 17=marathon → rest
// 10 (29km), 7 (24km) → optional cross
function satCell(w) {
  // Long run day. Race weeks move to Sunday, so Saturday is rest.
  if (RACE_WEEKS.includes(w.w)) return restCell;
  return w.sun;
}

function sunCell(w) {
  // Cross-train recovery spin the day after the long run — except race weeks.
  if (RACE_WEEKS.includes(w.w)) return w.sun;
  if ([12, 14].includes(w.w)) return { t:"cross", note:"keep it short — big week" };
  return crossCell;
}

// The three running days are Mon, Wed/Thu, and Sat. Mon and Wed/Thu are
// interchangeable: one easy, one quality, whichever suits on the day.
// Thursday absorbs the quality run when Tuesday's leg work leaves Wednesday flat.

function easyRunCell(w) {
  if (!w.tue) return restCell;
  return { ...w.tue, note: "⇄ swap with Wed/Thu by feel" };
}

function qualityCell(w) {
  if (!w.fri) return restCell;
  return { ...w.fri, note: "⇄ swap with Mon by feel" };
}

function flexCell(w) {
  if (w.w === 17) return restCell;
  return { t:"flex", label:"Flex", note:"quality run if not done Wed · else rest or light gym" };
}

// Gym: Mon = lower, Fri = upper. Volume tracks the running phase.
function gymCell(w, part) {
  if (w.w === 17) return restCell;                       // race week — nothing
  if (w.w === 16 && part === "lower") return restCell;   // legs fully rested

  const label = part === "lower" ? "Gym — Lower" : "Gym — Upper";
  if (w.w <= 8)  return { t:"gym", label, note:"build · 3 sets" };
  if (w.w <= 14) return { t:"gym", label, note:"maintain · 2 sets, −20% load" };
  return { t:"gym", label, note:"taper · light" };
}

// Compute weekly total (tue + fri + sun required; wed optional excluded from total)
function weeklyTotal(w) {
  let total = 0;
  if (w.tue && w.tue.d) total += w.tue.d;
  if (w.fri && w.fri.d) total += w.fri.d;
  if (w.sun && w.sun.d) total += w.sun.d;
  return Math.round(total * 10) / 10;
}

// Grand total across all weeks
const grandTotal = Math.round(weeks.reduce((sum, w) => sum + weeklyTotal(w), 0));
document.getElementById("total-vol-val").textContent = grandTotal + " km";

weeks.forEach((w, i) => {
  if (sectionTitles[w.w]) {
    const sl = document.createElement("div");
    sl.className = "section-label";
    sl.textContent = sectionTitles[w.w];
    container.appendChild(sl);
  }

  const wTotal = weeklyTotal(w);
  const longDist = w.sun.t === "race"
    ? (w.sun.label || "Race")
    : `${w.sun.d} km`;

  const card = document.createElement("div");
  card.className = `week-card ${
    w.tag === "stepback" ? "stepback" :
    w.tag === "peak"     ? "peak"     :
    w.tag === "taper"    ? "taper"    :
    w.tag === "race"     ? "race-wk"  : ""
  }`;

  card.innerHTML = `
    <div class="week-header" onclick="this.parentElement.classList.toggle('open')">
      <div class="week-num">WK ${w.w}</div>
      <div class="week-dates">${w.dates}</div>
      <span class="week-tag tag-${w.tag}">${tagLabel[w.tag]}</span>
      <div class="week-meta">
        <div class="week-meta-item">
          <div class="week-meta-label">Long run</div>
          <div class="week-meta-value long-col">${longDist}</div>
        </div>
        <div class="week-meta-item">
          <div class="week-meta-label">Run / Planned</div>
          <div class="week-meta-value total-col" id="week-actual-${w.w}">— / ${wTotal} km</div>
        </div>
      </div>
      <div class="toggle-icon">▼</div>
    </div>
    <div class="week-body">
      <div class="days-grid">
        ${buildCell(easyRunCell(w),     "MON", weekDate(i, 0), `${w.w}-mon`)}
        ${buildCell(gymCell(w, "upper"),"TUE", weekDate(i, 1), `${w.w}-tue`)}
        ${buildCell(qualityCell(w),     "WED", weekDate(i, 2), `${w.w}-wed`)}
        ${buildCell(gymCell(w, "lower"), "THU", weekDate(i, 3), `${w.w}-thu`)}
        ${buildCell(flexCell(w),      "FRI", weekDate(i, 4), `${w.w}-fri`)}
        ${buildCell(satCell(w),         "SAT", weekDate(i, 5), `${w.w}-sat`)}
        ${buildCell(sunCell(w),         "SUN", weekDate(i, 6), `${w.w}-sun`)}
      </div>
      <div class="week-note">${w.note}</div>
    </div>
  `;
  container.appendChild(card);
});

// open week 1 by default
container.querySelector(".week-card").classList.add("open");

// ── Storage + multi-device sync ──────────────────────────────────────────────
// localStorage is the offline cache; the API is the source of truth when a
// sync code is set. Entries carry loggedAt so devices merge instead of
// overwriting, and cleared entries become tombstones so deletes propagate.

const STORAGE_KEY  = "nyc-marathon-2026-log";
const SYNC_CODE_KEY = "nyc-marathon-2026-sync-code";
const DEFAULT_SYNC_CODE = "swapneel_nycm_2026";

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

// An entry counts as logged only if it isn't a tombstone and has content.
// Also gated on hasSynced: progress stays hidden until the code is
// re-entered and synced this session, even if it's sitting in localStorage.
function isLogged(entry) {
  return hasSynced && !!(entry && !entry.deleted && (entry.dist || entry.time));
}

let progress = loadProgress();
let hasSynced = false;
let activeCellId = null;
let syncCode = localStorage.getItem(SYNC_CODE_KEY) || DEFAULT_SYNC_CODE;

function setSyncStatus(state, text) {
  const dot = document.getElementById("sync-dot");
  dot.className = "sync-dot" + (state ? " " + state : "");
  document.getElementById("sync-status").textContent = text;
}

function syncButtonClick() {
  const code = document.getElementById("sync-code").value.trim();
  if (code.length < 4) {
    setSyncStatus("err", "Code must be at least 4 characters");
    return;
  }
  syncCode = code;
  localStorage.setItem(SYNC_CODE_KEY, code);
  syncNow();
}

async function syncNow() {
  if (!syncCode) {
    setSyncStatus("", "Not syncing — enter a code to enable");
    return;
  }
  setSyncStatus("syncing", "Syncing…");
  try {
    // Push local state; the server merges and returns the authoritative log.
    const res = await fetch(`/api/log?code=${encodeURIComponent(syncCode)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: progress }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

    progress = mergeLogs(progress, json.data || {});
    saveProgress(progress);
    hasSynced = true;
    refreshAllCells();
    if (typeof refreshGymSelections === "function") refreshGymSelections();
    updateProgressBar();
    updateVolumeStats();

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setSyncStatus("ok", `Synced ${time}`);
  } catch (err) {
    setSyncStatus("err", `Offline — saved locally (${err.message})`);
  }
}

function refreshAllCells() {
  document.querySelectorAll("[data-cellid]").forEach(el => {
    applyProgressToCell(el.dataset.cellid);
  });
}

function openModal(cellId) {
  activeCellId = cellId;
  const info = cellRegistry[cellId];
  const existing = isLogged(progress[cellId]) ? progress[cellId] : null;

  document.getElementById("modal-title").textContent = info ? info.typeName : "Log Run";
  document.getElementById("modal-sub").textContent = info
    ? `Planned: ${info.plannedDist ? info.plannedDist + " km" : "—"}${info.plannedPace ? " @ " + info.plannedPace : ""}`
    : "";

  document.getElementById("modal-dist").value  = existing?.dist  ?? (info?.plannedDist ?? "");
  document.getElementById("modal-time").value  = existing?.time  ?? "";
  document.getElementById("modal-notes").value = existing?.notes ?? "";
  updateModalPace();

  document.getElementById("log-modal").classList.add("open");
}

function closeModal() {
  document.getElementById("log-modal").classList.remove("open");
  activeCellId = null;
}

function updateModalPace() {
  const dist = parseFloat(document.getElementById("modal-dist").value);
  const timeStr = document.getElementById("modal-time").value.trim();
  const paceEl = document.getElementById("modal-pace");
  if (!dist || !timeStr || !timeStr.includes(":")) { paceEl.textContent = ""; return; }
  const [mm, ss] = timeStr.split(":").map(Number);
  if (isNaN(mm) || isNaN(ss)) { paceEl.textContent = ""; return; }
  const paceSecPerKm = (mm * 60 + ss) / dist;
  const pm = Math.floor(paceSecPerKm / 60);
  const ps = Math.round(paceSecPerKm % 60);
  paceEl.textContent = `→ ${pm}:${ps.toString().padStart(2, "0")}/km`;
}

document.getElementById("modal-dist").addEventListener("input", updateModalPace);
document.getElementById("modal-time").addEventListener("input", updateModalPace);

function saveLog() {
  if (!activeCellId) return;
  const dist  = document.getElementById("modal-dist").value.trim();
  const time  = document.getElementById("modal-time").value.trim();
  const notes = document.getElementById("modal-notes").value.trim();
  const now = new Date().toISOString();

  progress[activeCellId] = (!dist && !time && !notes)
    ? { deleted: true, loggedAt: now }
    : { dist, time, notes, loggedAt: now };

  saveProgress(progress);
  applyProgressToCell(activeCellId);
  updateProgressBar();
  updateVolumeStats();
  closeModal();
}

function clearLog() {
  if (!activeCellId) return;
  // Tombstone rather than delete, so the clear syncs to other devices once you sync.
  progress[activeCellId] = { deleted: true, loggedAt: new Date().toISOString() };
  saveProgress(progress);
  applyProgressToCell(activeCellId);
  updateProgressBar();
  updateVolumeStats();
  closeModal();
}

function applyProgressToCell(cellId) {
  const el = document.getElementById(`cell-${cellId}`);
  const actualEl = document.getElementById(`actual-${cellId}`);
  if (!el || !actualEl) return;
  const entry = progress[cellId];
  const info = cellRegistry[cellId];

  if (isLogged(entry)) {
    el.classList.add("done");
    let text = "";
    if (entry.dist) text += `${entry.dist} km`;
    if (entry.time) text += (text ? " · " : "") + entry.time;
    if (entry.dist && entry.time && entry.time.includes(":")) {
      const [mm, ss] = entry.time.split(":").map(Number);
      if (!isNaN(mm) && !isNaN(ss)) {
        const paceSecPerKm = (mm * 60 + ss) / parseFloat(entry.dist);
        const pm = Math.floor(paceSecPerKm / 60);
        const ps = Math.round(paceSecPerKm % 60);
        text += ` (${pm}:${ps.toString().padStart(2, "0")}/km)`;
      }
    }
    actualEl.textContent = "✓ " + text;
    actualEl.style.display = "block";
    actualEl.classList.toggle(
      "behind",
      !!(info?.plannedDist && entry.dist && parseFloat(entry.dist) < info.plannedDist * 0.9)
    );
  } else {
    el.classList.remove("done");
    actualEl.style.display = "none";
    actualEl.textContent = "";
  }
}

function updateProgressBar() {
  const runCells = document.querySelectorAll('[data-counts="run"]');
  const total = runCells.length;
  let done = 0;
  runCells.forEach(el => {
    if (isLogged(progress[el.dataset.cellid])) done++;
  });
  document.getElementById("progress-count").textContent = `${done} / ${total}`;
  document.getElementById("progress-fill").style.width = total ? `${(done / total) * 100}%` : "0%";
}

// Actual km run so far, from logged entries on run-counting cells only
// (gym/cross/flex/rest cells don't contribute).
function loggedDist(cellId) {
  const entry = progress[cellId];
  if (!isLogged(entry)) return 0;
  const dist = parseFloat(entry.dist);
  return isFinite(dist) ? dist : 0;
}

function weekActualVolume(w) {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  let total = 0;
  days.forEach(day => {
    const cellId = `${w.w}-${day}`;
    if (cellRegistry[cellId]?.counts === "run") total += loggedDist(cellId);
  });
  return Math.round(total * 10) / 10;
}

function totalActualVolume() {
  return Math.round(weeks.reduce((sum, w) => sum + weekActualVolume(w), 0) * 10) / 10;
}

function updateVolumeStats() {
  const volEl = document.getElementById("vol-run-val");
  if (volEl) volEl.textContent = `${totalActualVolume()} km`;

  weeks.forEach(w => {
    const el = document.getElementById(`week-actual-${w.w}`);
    if (el) el.textContent = `${weekActualVolume(w)} / ${weeklyTotal(w)} km`;
  });
}

// ── Gym tab ──────────────────────────────────────────────────────────────────
const gymPhases = [
  { weeks:"Weeks 1–8",   title:"Build strength", desc:"Moderately heavy, 6–8 reps, push progression. This is when lifting does the most for running economy." },
  { weeks:"Weeks 9–14",  title:"Maintain only",  desc:"Same lifts, drop to 2 sets, cut load ~20%. Legs are handling 27–32km long runs — don't add fatigue." },
  { weeks:"Weeks 15–17", title:"Taper down",     desc:"One short full-body session a week, light or bodyweight. Last real session ~10 days out. Nothing new in race week." },
];

const gymDays = [
  {
    id:"lower", cls:"lower", title:"Lower — Thursday", sub:"Gym only · 2 days clear of Saturday's long run",
    slots:[
      { id:"l1", name:"Single-leg strength", sets:"3 × 6–8 each leg",
        why:"Running is a single-leg sport — this transfers most directly.",
        vars:["Rear-foot elevated split squat","Walking lunge","Step-up (knee-height box)"] },
      { id:"l2", name:"Hip hinge", sets:"3 × 6–8",
        why:"Builds the posterior chain that drives your stride.",
        vars:["Romanian deadlift","Single-leg RDL — lighter, 3×8 each","Trap bar deadlift"] },
      { id:"l3", name:"Bilateral squat", sets:"3 × 6–8",
        why:"General leg strength base.",
        vars:["Goblet squat","Front squat","Leg press"] },
      { id:"l4", name:"Calf — both heads", sets:"see each",
        why:"Highest-value slot for a marathoner. The soleus takes the most load in distance running and is where most Achilles trouble starts.",
        vars:["Standing calf raise (gastroc) — 3×10–12","Seated calf raise (soleus) — 3×15–20","Single-leg eccentric off a step — 3×8 slow lowers"] },
      { id:"l5", name:"Hip stability", sets:"2 × 12–15",
        why:"Keeps the pelvis steady late in long runs when form degrades.",
        vars:["Copenhagen plank (adductors)","Side plank with hip abduction","Banded lateral walk"] },
    ]
  },
  {
    id:"upper", cls:"upper", title:"Upper — Tuesday", sub:"Gym only · legs untouched, so Saturday's long run stays fresh",
    slots:[
      { id:"u1", name:"Horizontal pull", sets:"3 × 8–10",
        why:"Counters desk posture and holds your chest open late in a race.",
        vars:["One-arm DB row","Chest-supported row","Inverted row"] },
      { id:"u2", name:"Vertical pull", sets:"3 × 6–10",
        why:"Upper back endurance for arm carriage.",
        vars:["Lat pulldown","Assisted pull-up","Half-kneeling single-arm pulldown"] },
      { id:"u3", name:"Horizontal push", sets:"3 × 8–10",
        why:"Balances the pulling volume.",
        vars:["Push-up (weighted if easy)","DB bench press","Landmine press"] },
      { id:"u6", name:"Vertical push (shoulders)", sets:"3 × 8–10",
        why:"Shoulder health and overhead mobility — worth keeping year-round, not just in a running block.",
        vars:["Half-kneeling DB overhead press","Seated DB shoulder press","Landmine press (shoulder-dominant)"] },
      { id:"u4", name:"Anti-rotation core", sets:"3 × 10 each side",
        why:"Stops energy leaking sideways with every foot strike.",
        vars:["Pallof press","Suitcase carry — 40m","Bird dog"] },
      { id:"u5", name:"Anti-extension core", sets:"3 × 10–12",
        why:"Holds posture together when you're tired.",
        vars:["Dead bug","Ab wheel rollout","Hollow hold"] },
      { id:"u7", name:"Delts — optional", sets:"2 × 12–15",
        why:"Optional. Shoulder balance and aesthetics — no running benefit, but no real cost either.",
        vars:["DB lateral raise","Cable lateral raise","Rear-delt fly / face pull"] },
      { id:"u8", name:"Arms — optional finisher", sets:"2 × 10–12 each",
        why:"Optional. Superset them and it's about six minutes. Drop it on weeks you feel beaten up.",
        vars:["DB curl + overhead triceps extension","Hammer curl + rope pushdown","Chin-up + dip"] },
    ]
  },
];

function renderPhaseGuide() {
  document.getElementById("phase-guide").innerHTML = gymPhases.map(p => `
    <div class="phase-card">
      <div class="phase-weeks">${p.weeks}</div>
      <div class="phase-title">${p.title}</div>
      <div class="phase-desc">${p.desc}</div>
    </div>
  `).join("");
}

function renderGym() {
  document.getElementById("gym-container").innerHTML = gymDays.map(day => `
    <div class="gym-day ${day.cls}">
      <div class="gym-day-header">
        <div class="gym-day-title">${day.title}</div>
        <div class="gym-day-sub">${day.sub}</div>
      </div>
      ${day.slots.map(slot => `
        <div class="gym-slot${slot.name.includes("optional") ? " optional" : ""}">
          <div class="gym-slot-head">
            <span class="gym-slot-name">${slot.name}</span>
            <span class="gym-slot-sets">${slot.sets}</span>
            <span class="gym-slot-why">${slot.why}</span>
          </div>
          <div class="gym-variations">
            ${slot.vars.map((v, idx) => `
              <div class="gym-var" id="gymvar-${slot.id}-${idx}"
                   onclick="selectVariation('${slot.id}', ${idx})">
                <div class="gym-var-dot"></div>
                <span>${v}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `).join("");
  refreshGymSelections();
}

// Selections live in the same synced store, keyed separately so they never
// count toward run progress.
function gymKey(slotId) { return `gym:${slotId}`; }

function selectVariation(slotId, idx) {
  const key = gymKey(slotId);
  const current = progress[key];
  const already = current && !current.deleted && current.variation === idx;

  progress[key] = already
    ? { deleted: true, loggedAt: new Date().toISOString() }
    : { variation: idx, loggedAt: new Date().toISOString() };

  saveProgress(progress);
  refreshGymSelections();
}

function refreshGymSelections() {
  gymDays.forEach(day => day.slots.forEach(slot => {
    const entry = hasSynced ? progress[gymKey(slot.id)] : null;
    const chosen = entry && !entry.deleted ? entry.variation : null;
    slot.vars.forEach((_, idx) => {
      const el = document.getElementById(`gymvar-${slot.id}-${idx}`);
      if (el) el.classList.toggle("selected", chosen === idx);
    });
  }));
}

function switchTab(name) {
  ["plan", "gym"].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle("active", t === name);
    document.getElementById(`tabbtn-${t}`).classList.toggle("active", t === name);
  });
}

renderPhaseGuide();
renderGym();

refreshAllCells();
updateProgressBar();
updateVolumeStats();

// No auto-sync, and progress stays hidden (hasSynced is false) until you
// enter a code and press Sync — even though it's cached in localStorage.
setSyncStatus("", "Not synced — enter your code and press Sync");

// Close modal on overlay click (not box click)
document.getElementById("log-modal").addEventListener("click", (e) => {
  if (e.target.id === "log-modal") closeModal();
});

// Exposed for index.html's inline onclick="..." handlers — a module
// script's top-level declarations aren't implicit globals like a
// classic script's are.
window.openModal = openModal;
window.closeModal = closeModal;
window.saveLog = saveLog;
window.clearLog = clearLog;
window.switchTab = switchTab;
window.syncButtonClick = syncButtonClick;
window.selectVariation = selectVariation;
