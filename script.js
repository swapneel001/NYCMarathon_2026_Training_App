import { mergeLogs } from "./lib/mergeLogs.js";
import {
  weeks, gymDays, DAYS, dayDate, sessionMeta, weeklyTotal,
} from "./lib/planData.js";

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
  const { t, d, pace, detail } = info;
  const cls = {
    easy:"cell-easy", tempo:"cell-tempo", interval:"cell-interval",
    hills:"cell-hills", long:"cell-long", opt:"cell-optional",
    race:"cell-race", cross:"cell-cross", gym:"cell-gym", flex:"cell-flex"
  }[t] || "cell-easy";

  const { typeName, counts, loggable, ...planned } = sessionMeta(info);

  const distLine   = d      ? `<div class="day-dist">${d} km</div>`    : "";
  const paceLine   = pace   ? `<div class="day-pace">${pace}</div>`    : "";
  const detailLine = detail ? `<div class="day-detail">${detail}</div>`: "";
  const noteLine   = info.note ? `<div class="day-detail">${info.note}</div>` : "";

  if (cellId) {
    cellRegistry[cellId] = { typeName, ...planned, counts };
  }

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

function weekDate(weekIndex, dayOffset) {
  return dayDate(weekIndex, dayOffset)
    .toLocaleDateString("en-GB", { day:"numeric", month:"short" });
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
        ${DAYS.map((day, off) =>
          buildCell(day.cell(w), day.label, weekDate(i, off), `${w.w}-${day.key}`)
        ).join("\n        ")}
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
  { weeks:"Weeks 9–14",  title:"Maintain only",  desc:"Same lifts, drop to 2 sets, cut load ~20%. Legs are handling 27–30km long runs — don't add fatigue." },
  { weeks:"Weeks 15–17", title:"Taper down",     desc:"One short full-body session a week, light or bodyweight. Last real session ~10 days out. Nothing new in race week." },
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
