// Vercel serverless function — read-only performance records.
//
// GET /api/records?code=<sync code>
//
// api/log.js returns the raw log, which is keyed by opaque cell ids
// ("3-wed") and means nothing on its own. This joins that log against the
// plan in lib/planData.js so an outside reader (Claude, a notebook, curl)
// gets self-describing sessions: what was planned, what was actually run,
// and how far through the block you are. Read-only by design — logging
// still goes through api/log.js.

import { keyFor, readLog } from "../lib/redis.js";
import {
  weeks, gymDays, DAYS, dayDate, sessionMeta, weeklyTotal,
} from "../lib/planData.js";

const round1 = (n) => Math.round(n * 10) / 10;

function isoDate(d) {
  // Local components, not toISOString() — planStart is a local midnight and
  // shifting it into UTC would slide dates a day on a non-UTC machine.
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Mirrors script.js's isLogged(), minus the client's hasSynced gate.
const isLogged = (e) => !!(e && !e.deleted && (e.dist || e.time));

// Times are logged as mm:ss (the app's modal parses them that way), so a
// two-hour long run reads as "141:30". Same parse here, so the pace shown
// in the app and the pace reported here always agree.
function paceFrom(dist, time) {
  const km = parseFloat(dist);
  if (!km || !time || !time.includes(":")) return null;
  const [mm, ss] = String(time).split(":").map(Number);
  if (isNaN(mm) || isNaN(ss)) return null;
  const secPerKm = (mm * 60 + ss) / km;
  return `${Math.floor(secPerKm / 60)}:${String(Math.round(secPerKm % 60)).padStart(2, "0")}/km`;
}

export function buildRecords(log, now = new Date()) {
  const today = isoDate(now);
  let kmLogged = 0, kmPlanned = 0, kmPlannedToDate = 0;
  let runsLogged = 0, runsPlanned = 0, runsPlannedToDate = 0;
  let longest = null, last = null;

  const weekRecords = weeks.map((w, i) => {
    const sessions = [];
    let weekKm = 0;

    DAYS.forEach((day, off) => {
      const info = day.cell(w);
      if (!info) return; // rest day

      const cellId = `${w.w}-${day.key}`;
      const date = isoDate(dayDate(i, off));
      const meta = sessionMeta(info);
      const entry = log[cellId];
      const logged = isLogged(entry);
      const isRun = meta.counts === "run";

      // Runs are always listed so missed ones stay visible; gym, cross and
      // flex slots only show up once something was actually logged there.
      if (!isRun && !logged) return;

      const record = {
        cellId,
        date,
        due: date <= today,
        day: day.label,
        session: meta.typeName,
        plannedKm: meta.plannedDist,
        plannedPace: meta.plannedPace,
        logged,
      };
      if (info.detail) record.detail = info.detail;

      if (logged) {
        const km = parseFloat(entry.dist);
        record.actualKm = isFinite(km) ? km : null;
        record.actualTime = entry.time || null;
        record.actualPace = paceFrom(entry.dist, entry.time);
        if (entry.notes) record.notes = entry.notes;
        record.loggedAt = entry.loggedAt || null;

        if (isRun && isFinite(km)) {
          weekKm += km;
          if (!longest || km > longest.actualKm) longest = record;
        }
        if (isRun) runsLogged++;
        if (!last || (record.loggedAt || "") > (last.loggedAt || "")) last = record;
      }

      if (isRun) {
        runsPlanned++;
        if (record.due) {
          runsPlannedToDate++;
          kmPlannedToDate += meta.plannedDist || 0;
        }
      }
      sessions.push(record);
    });

    kmLogged += weekKm;
    kmPlanned += weeklyTotal(w);

    return {
      week: w.w,
      dates: w.dates,
      phase: w.tag,
      plannedKm: weeklyTotal(w),
      loggedKm: round1(weekKm),
      note: w.note,
      sessions,
    };
  });

  const gym = [];
  gymDays.forEach((day) => day.slots.forEach((slot) => {
    const entry = log[`gym:${slot.id}`];
    if (!entry || entry.deleted || entry.variation == null) return;
    gym.push({
      day: day.title,
      exercise: slot.name,
      sets: slot.sets,
      chosen: slot.vars[entry.variation] ?? null,
      loggedAt: entry.loggedAt || null,
    });
  }));

  const raceWeek = weeks[weeks.length - 1];
  const current = weekRecords.find((w) => w.sessions.some((s) => !s.due));

  return {
    plan: "NYC Marathon 2026 — 17-week Hal Higdon Novice 2 (adapted)",
    raceDay: isoDate(dayDate(weeks.length - 1, 6)),
    today,
    currentWeek: current ? current.week : raceWeek.w,
    summary: {
      runsLogged,
      runsPlannedToDate,
      runsPlanned,
      kmLogged: round1(kmLogged),
      kmPlannedToDate: round1(kmPlannedToDate),
      kmPlanned: round1(kmPlanned),
      longestRun: longest && { date: longest.date, km: longest.actualKm, pace: longest.actualPace },
      lastLogged: last && { date: last.date, session: last.session, km: last.actualKm ?? null, loggedAt: last.loggedAt },
    },
    weeks: weekRecords,
    gymSelections: gym,
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = keyFor(req.query.code);
  if (!key) {
    return res
      .status(400)
      .json({ error: "Invalid sync code (4–64 chars, letters/numbers/-/_)" });
  }

  try {
    return res.status(200).json(buildRecords(await readLog(key)));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
