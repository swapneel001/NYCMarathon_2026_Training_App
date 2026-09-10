// Plan data and the pure derivations shared by the browser and the API.
// script.js renders these into the page; api/records.js joins them against
// logged entries. Must stay DOM-free so the serverless function can import
// it — see CLAUDE.md's "Plan data → rendered UI" section.

// t types: easy | tempo | interval | hills | long | opt | race
// pace: display string shown in cell
// detail: short workout description (intervals/hills only)
export const weeks = [
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
    note:"Step-back in intensity, not distance. Wednesday introduces marathon-pace work — 7:20/km is your Singapore-adjusted MP, not the 7:00 race target. Saturday's 24km is a new PB by 1km: build from 23, don't leap.",
    tue:{t:"easy",  d:7.0,  pace:"7:15/km"},
    wed:{t:"opt",   d:6.4,  pace:"7:25/km"},
    fri:{t:"tempo", d:9.0,  pace:"7:20/km", detail:"2km WU · 5km @ MP (7:20) · 2km CD"},
    sun:{t:"long",  d:24.0, pace:"7:55/km", detail:"Fuel rehearsal: gel at 45min, then every 30–35min. Target 60g carbs/hr including isotonic."}
  },
  {
    w:12, dates:"Sep 21–Sep 27", tag:"peak",
    note:"Kiprun Singapore HM — Sun 27 Sep, Marina Bay. Run it AT marathon pace (7:00–7:05), not as a max effort. Expect ~2:28–2:30. If the second half feels controlled, sub-5 is on. Race replaces the long run — add nothing. Skip Friday upper gym if you'd rather arrive fresh.",
    tue:{t:"easy", d:8.0,  pace:"7:15/km"},
    wed:{t:"opt",  d:4.8,  pace:"7:20/km"},
    fri:{t:"easy", d:6.0,  pace:"7:20/km", detail:"Include 4×90s at MP (7:20) mid-run to prime the legs. Full recovery between."},
    sun:{t:"race", d:21.1, pace:"7:00/km", label:"🏃 Kiprun Singapore HM", detail:"Start 7:05, negative split if comfortable. Full race-day fuelling and kit rehearsal."}
  },
  {
    w:13, dates:"Sep 28–Oct 4", tag:"stepback",
    note:"Recovery week post-Kiprun. No tempo, no hills, no pace targets anywhere. Saturday's long run is purely time on feet.",
    tue:{t:"easy", d:5.0,  pace:"7:30/km", detail:"Very relaxed. Shake out the race."},
    wed:{t:"opt",  d:6.4,  pace:"7:25/km"},
    fri:{t:"easy", d:8.0,  pace:"7:20/km"},
    sun:{t:"long", d:22.0, pace:"8:00/km", detail:"No pace targets. Slower is fine and expected."}
  },
  {
    w:14, dates:"Oct 5–Oct 11", tag:"peak",
    note:"Longest run of the plan — 30km, reduced from 32 to match your actual base. TIME-CAPPED AT 3:45: stop wherever you are. Aerobic benefit plateaus past that; injury risk doesn't.",
    tue:{t:"easy",  d:8.0,  pace:"7:10/km"},
    wed:{t:"opt",   d:6.4,  pace:"7:20/km"},
    fri:{t:"tempo", d:10.0, pace:"7:25/km", detail:"2km WU · 6km @ MP (7:25) · 2km CD"},
    sun:{t:"long",  d:30.0, pace:"8:00/km", detail:"Hard cap 3:45 — stop wherever you are. Full fuelling rehearsal, this is the dress run."}
  },
  // ── TAPER ────────────────────────────────────────────────────────────────────
  {
    w:15, dates:"Oct 12–Oct 18", tag:"taper",
    note:"Taper begins. Volume drops, intensity stays. Finishing the long run at MP teaches the legs to hold pace on tired legs — the single most race-specific thing left.",
    tue:{t:"easy",  d:8.0,  pace:"7:15/km"},
    wed:{t:"opt",   d:4.8,  pace:"7:20/km"},
    fri:{t:"tempo", d:8.0,  pace:"7:20/km", detail:"1.5km WU · 5km @ MP (7:20) · 1.5km CD"},
    sun:{t:"long",  d:21.0, pace:"7:50/km", detail:"Last 6km @ MP (7:25). Progressive finish."}
  },
  {
    w:16, dates:"Oct 19–Oct 25", tag:"taper",
    note:"Big volume drop. You'll feel restless and possibly heavy-legged — both normal. No heroics, no testing fitness.",
    tue:{t:"easy", d:6.0,  pace:"7:15/km"},
    wed:{t:"opt",  d:4.8,  pace:"7:20/km"},
    fri:{t:"easy", d:6.0,  pace:"7:20/km", detail:"Include 6×20s strides after the run. Not a workout."},
    sun:{t:"long", d:14.0, pace:"7:45/km", detail:"Last 4km @ MP (7:25)."}
  },
  {
    w:17, dates:"Oct 26–Nov 1", tag:"race",
    note:"Race week. Shakeouts only, no gym at all. Carb load Thu–Sat, stay off your feet, sleep. Sunday 1 Nov: go out at 7:05–7:10 for the first 8km — the Verrazzano downhill will tempt you to bank time. Don't.",
    tue:{t:"easy", d:5.0,  pace:"7:20/km"},
    wed:{t:"opt",  d:3.2,  pace:"7:20/km"},
    fri:{t:"easy", d:4.0,  pace:"7:20/km", detail:"Include 4×20s strides. Legs open, nothing more."},
    sun:{t:"race", d:42.2, pace:"7:00/km", label:"🏁 NYC Marathon", detail:"Target 4:55. First 8km @ 7:05–7:10. Gel at 45min then every 30–35min."}
  },
];

// Plan start: Monday July 6, 2026 (week runs Mon–Sun)
export const planStart = new Date(2026, 6, 6); // month is 0-indexed, July=6

export function dayDate(weekIndex, dayOffset) {
  // dayOffset: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  const d = new Date(planStart);
  d.setDate(d.getDate() + weekIndex * 7 + dayOffset);
  return d;
}

const crossCell  = { t:"cross" };
export const RACE_WEEKS = [12, 17]; // Kiprun HM (Sun 27 Sep), NYC Marathon (Sun 1 Nov)
const restCell   = null;
const optCrossCell = { t:"cross", optional: true };

// Per-week Saturday override
// w.w: 12=Kiprun HM, 14=30km peak, 17=marathon → rest
// 10 (29km), 7 (24km) → optional cross
export function satCell(w) {
  // Long run day. Race weeks move to Sunday, so Saturday is rest.
  if (RACE_WEEKS.includes(w.w)) return restCell;
  return w.sun;
}

export function sunCell(w) {
  // Cross-train recovery spin the day after the long run — except race weeks.
  if (RACE_WEEKS.includes(w.w)) return w.sun;
  if ([12, 14].includes(w.w)) return { t:"cross", note:"keep it short — big week" };
  return crossCell;
}

// The three running days are Mon, Wed/Thu, and Sat. Mon and Wed/Thu are
// interchangeable: one easy, one quality, whichever suits on the day.
// Thursday absorbs the quality run when Tuesday's leg work leaves Wednesday flat.

export function easyRunCell(w) {
  if (!w.tue) return restCell;
  return { ...w.tue, note: "⇄ swap with Wed/Thu by feel" };
}

export function qualityCell(w) {
  if (!w.fri) return restCell;
  return { ...w.fri, note: "⇄ swap with Mon by feel" };
}

export function flexCell(w) {
  if (w.w === 17) return restCell;
  return { t:"flex", label:"Flex", note:"quality run if not done Wed · else rest or light gym" };
}

// Gym: Mon = lower, Fri = upper. Volume tracks the running phase.
export function gymCell(w, part) {
  if (w.w === 17) return restCell;                       // race week — nothing
  if (w.w === 16 && part === "lower") return restCell;   // legs fully rested

  const label = part === "lower" ? "Gym — Lower" : "Gym — Upper";
  if (w.w <= 8)  return { t:"gym", label, note:"build · 3 sets" };
  if (w.w <= 14) return { t:"gym", label, note:"maintain · 2 sets, −20% load" };
  return { t:"gym", label, note:"taper · light" };
}

// Compute weekly total (tue + fri + sun required; wed optional excluded from total)
export function weeklyTotal(w) {
  let total = 0;
  if (w.tue && w.tue.d) total += w.tue.d;
  if (w.fri && w.fri.d) total += w.fri.d;
  if (w.sun && w.sun.d) total += w.sun.d;
  return Math.round(total * 10) / 10;
}

// The week's seven slots in render order. The index into this array is the
// dayOffset passed to dayDate(), and the cell id is `${w.w}-${key}` — so the
// API resolves a logged cell id back to the very session the page rendered.
export const DAYS = [
  { key:"mon", label:"MON", cell: w => easyRunCell(w) },
  { key:"tue", label:"TUE", cell: w => gymCell(w, "upper") },
  { key:"wed", label:"WED", cell: w => qualityCell(w) },
  { key:"thu", label:"THU", cell: w => gymCell(w, "lower") },
  { key:"fri", label:"FRI", cell: w => flexCell(w) },
  { key:"sat", label:"SAT", cell: w => satCell(w) },
  { key:"sun", label:"SUN", cell: w => sunCell(w) },
];

// What a cell means once derived: display name, planned targets, whether it
// counts toward run volume, and whether it can be logged at all.
export function sessionMeta(info) {
  const { t, d, pace, label } = info;
  return {
    typeName: {
      easy:"Easy run", tempo:"Tempo run", interval:"Intervals",
      hills:"Hill reps", long:"Long run", opt:"Easy (opt)",
      race: label || "Race", cross:"Cross-train", gym: label || "Gym", flex: label || "Flex"
    }[t],
    plannedDist: d || null,
    plannedPace: pace || null,
    counts: ["easy","tempo","interval","hills","long","race"].includes(t) ? "run" : "extra",
    loggable: !["gym", "cross"].includes(t),
  };
}

export const gymDays = [
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
