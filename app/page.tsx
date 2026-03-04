"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Phase = "idle" | "line_out" | "bite" | "caught" | "missed";
type Rarity = "common" | "rare" | "legendary";
type TargetZone = { min: number; max: number };

type Catch = {
  name: string;
  emoji: string;
  weightKg: number;
  rarity: Rarity;
  caughtAt: number;
};

type FishDef = {
  name: string;
  emoji: string;
  minKg: number;
  maxKg: number;
  rarity: Rarity;
  weight: number;
};

const FISH_TABLE: FishDef[] = [
  { name: "Silver Minnow", emoji: "🐟", minKg: 0.2, maxKg: 0.8, rarity: "common", weight: 44 },
  { name: "Bluegill", emoji: "🐠", minKg: 0.5, maxKg: 1.8, rarity: "common", weight: 28 },
  { name: "River Trout", emoji: "🐟", minKg: 1.2, maxKg: 3.6, rarity: "rare", weight: 18 },
  { name: "Thunder Bass", emoji: "🐡", minKg: 2.2, maxKg: 5.8, rarity: "rare", weight: 8 },
  { name: "Golden Marlin", emoji: "🦈", minKg: 7, maxKg: 12.5, rarity: "legendary", weight: 2 },
];

const RARITY_CLASSES: Record<Rarity, string> = {
  common: "bg-slate-100 text-slate-700 border-slate-200",
  rare: "bg-indigo-100 text-indigo-700 border-indigo-200",
  legendary: "bg-amber-100 text-amber-800 border-amber-200",
};

const PHASE_LABELS: Record<Phase, string> = {
  idle: "Ready",
  line_out: "Line Out",
  bite: "Bite!",
  caught: "Caught",
  missed: "Missed",
};

const PHASE_TEXT_CLASSES: Record<Phase, string> = {
  idle: "text-white/90",
  line_out: "text-cyan-100",
  bite: "text-amber-200",
  caught: "text-emerald-200",
  missed: "text-rose-200",
};

const TARGET_ZONE_HEIGHT = 16;

function createTargetZone(): TargetZone {
  const center = 30 + Math.random() * 40;
  const half = TARGET_ZONE_HEIGHT / 2;
  return {
    min: Math.max(8, center - half),
    max: Math.min(92, center + half),
  };
}

function getLocalDayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStorageKey(dayKey: string) {
  return `fishing:best:${dayKey}`;
}

function pickFish() {
  const totalWeight = FISH_TABLE.reduce((sum, fish) => sum + fish.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const fish of FISH_TABLE) {
    roll -= fish.weight;
    if (roll <= 0) {
      const rawWeight = fish.minKg + Math.random() * (fish.maxKg - fish.minKg);
      return {
        name: fish.name,
        emoji: fish.emoji,
        rarity: fish.rarity,
        weightKg: Math.round(rawWeight * 100) / 100,
        caughtAt: Date.now(),
      } satisfies Catch;
    }
  }

  const fallback = FISH_TABLE[0];
  return {
    name: fallback.name,
    emoji: fallback.emoji,
    rarity: fallback.rarity,
    weightKg: fallback.minKg,
    caughtAt: Date.now(),
  } satisfies Catch;
}

function formatCatchTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMessage, setStatusMessage] = useState("Tap Cast to drop your line.");
  const [latestCatch, setLatestCatch] = useState<Catch | null>(null);
  const [dailyBest, setDailyBest] = useState<Catch | null>(null);
  const [todayKey, setTodayKey] = useState("");
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [linePosition, setLinePosition] = useState(50);
  const [targetZone, setTargetZone] = useState<TargetZone>(() => createTargetZone());

  const biteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const biteExpireTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineMotionRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lineVelocityRef = useRef(1.4);

  const isCasting = phase === "line_out" || phase === "bite";
  const canReel = phase === "line_out" || phase === "bite";

  const phaseTextClass = useMemo(() => PHASE_TEXT_CLASSES[phase], [phase]);

  const clearTimer = (timer: ReturnType<typeof setTimeout> | null) => {
    if (timer) {
      clearTimeout(timer);
    }
  };

  const clearLineMotion = () => {
    if (lineMotionRef.current) {
      clearInterval(lineMotionRef.current);
      lineMotionRef.current = null;
    }
  };

  const clearAllTimers = () => {
    clearTimer(biteTimeoutRef.current);
    clearTimer(biteExpireTimeoutRef.current);
    clearTimer(resetTimeoutRef.current);
    clearLineMotion();
    biteTimeoutRef.current = null;
    biteExpireTimeoutRef.current = null;
    resetTimeoutRef.current = null;
  };

  const scheduleReset = (delayMs = 1500) => {
    clearTimer(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      setPhase("idle");
      setStatusMessage("Tap Cast to drop your line.");
      setIsNewRecord(false);
      setLinePosition(50);
    }, delayMs);
  };

  const saveBestCatch = (candidate: Catch) => {
    const currentDayKey = getLocalDayKey();
    const currentStorageKey = getStorageKey(currentDayKey);

    if (currentDayKey !== todayKey) {
      setTodayKey(currentDayKey);
      setDailyBest(null);
    }

    const baseline = currentDayKey === todayKey ? dailyBest : null;
    if (!baseline || candidate.weightKg > baseline.weightKg) {
      setDailyBest(candidate);
      setIsNewRecord(true);
      localStorage.setItem(currentStorageKey, JSON.stringify(candidate));
    } else {
      setIsNewRecord(false);
    }
  };

  const handleCast = () => {
    if (isCasting) {
      return;
    }

    clearAllTimers();
    setPhase("line_out");
    setStatusMessage("Line is out... watch the bobber.");
    setIsNewRecord(false);
    setLinePosition(44 + Math.random() * 12);
    setTargetZone(createTargetZone());
    lineVelocityRef.current = Math.random() > 0.5 ? 1.4 : -1.4;

    const biteDelayMs = 800 + Math.floor(Math.random() * 1400);
    biteTimeoutRef.current = setTimeout(() => {
      setPhase("bite");
      setStatusMessage("Bite! Tap Catch while the bobber is in the green zone!");

      biteExpireTimeoutRef.current = setTimeout(() => {
        setPhase("missed");
        setStatusMessage("Too slow. The fish escaped.");
        scheduleReset(1400);
      }, 1400);
    }, biteDelayMs);
  };

  const handleReel = () => {
    if (!canReel) {
      return;
    }

    clearTimer(biteTimeoutRef.current);
    biteTimeoutRef.current = null;

    if (phase === "bite") {
      clearTimer(biteExpireTimeoutRef.current);
      biteExpireTimeoutRef.current = null;

      const inTargetZone = linePosition >= targetZone.min && linePosition <= targetZone.max;
      if (!inTargetZone) {
        setPhase("missed");
        setStatusMessage("Close, but outside the green zone. Try timing your catch.");
        setIsNewRecord(false);
        scheduleReset(1500);
        return;
      }

      const caughtFish = pickFish();
      setLatestCatch(caughtFish);
      setPhase("caught");
      setStatusMessage(`You caught a ${caughtFish.name} (${caughtFish.weightKg.toFixed(2)} kg)!`);
      saveBestCatch(caughtFish);
      scheduleReset(1900);
      return;
    }

    setPhase("missed");
    setStatusMessage("Too early. You reeled in empty water.");
    setIsNewRecord(false);
    scheduleReset(1400);
  };

  useEffect(() => {
    if (phase !== "line_out" && phase !== "bite") {
      clearLineMotion();
      return;
    }

    clearLineMotion();
    lineMotionRef.current = setInterval(() => {
      setLinePosition((prev) => {
        const phaseSpeed = phase === "bite" ? 1.55 : 1.2;
        let next = prev + lineVelocityRef.current * phaseSpeed;

        if (next >= 92) {
          next = 92;
          lineVelocityRef.current = -(1.1 + Math.random() * 0.9);
        } else if (next <= 8) {
          next = 8;
          lineVelocityRef.current = 1.1 + Math.random() * 0.9;
        } else {
          lineVelocityRef.current += (Math.random() - 0.5) * 0.25;
          lineVelocityRef.current = Math.max(-2.2, Math.min(2.2, lineVelocityRef.current));
        }

        return next;
      });
    }, 70);

    return () => {
      clearLineMotion();
    };
  }, [phase]);

  useEffect(() => {
    const currentDayKey = getLocalDayKey();
    setTodayKey(currentDayKey);

    try {
      const saved = localStorage.getItem(getStorageKey(currentDayKey));
      if (!saved) {
        return;
      }
      const parsed = JSON.parse(saved) as Catch;
      if (
        parsed &&
        typeof parsed.name === "string" &&
        typeof parsed.weightKg === "number" &&
        typeof parsed.emoji === "string" &&
        typeof parsed.caughtAt === "number"
      ) {
        setDailyBest(parsed);
      }
    } catch {
      setDailyBest(null);
    }

    return () => {
      clearAllTimers();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-cyan-50 to-emerald-100 text-slate-900">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-32 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <header className="mb-4 flex flex-col gap-1 sm:mb-6">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Reel Rush</h1>
          <p className="text-sm text-slate-700 sm:text-base">
            Cast, wait for the bite, then reel fast. Biggest catch wins bragging rights.
          </p>
        </header>

        <section className="relative overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-b from-cyan-500 via-sky-600 to-blue-900 p-5 text-white shadow-xl sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-white/15 blur-2xl" />
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white/95">
                {PHASE_LABELS[phase]}
              </span>
              <span className="text-xs text-white/80">Today: {todayKey || getLocalDayKey()}</span>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={[
                  "inline-block h-4 w-4 rounded-full bg-rose-300 shadow-[0_0_0_4px_rgba(255,255,255,0.2)] motion-safe:transition-all",
                  phase === "bite" ? "motion-safe:animate-bounce" : "",
                  phase === "line_out" ? "motion-safe:animate-pulse" : "",
                ].join(" ")}
              />
              <p className={`text-lg font-semibold sm:text-xl ${phaseTextClass}`}>{statusMessage}</p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-slate-900/20 p-3 sm:p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-cyan-100/90">
                <span>Line Visualizer</span>
                <span>{phase === "bite" ? "Target Active" : "Standby"}</span>
              </div>

              <div className="mx-auto mt-3 flex items-center justify-center gap-5">
                <div className="text-2xl">🎣</div>
                <div className="relative h-44 w-20">
                  <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full bg-white/55" />

                  <div
                    className={`absolute left-1/2 w-14 -translate-x-1/2 rounded-lg border transition-colors ${
                      phase === "bite" ? "border-emerald-200 bg-emerald-300/35" : "border-white/30 bg-white/15"
                    }`}
                    style={{
                      top: `${targetZone.min}%`,
                      height: `${targetZone.max - targetZone.min}%`,
                    }}
                  />

                  <span
                    className="absolute left-1/2 -translate-x-1/2 text-xl transition-[top] duration-75 ease-linear"
                    style={{ top: `calc(${linePosition}% - 0.65rem)` }}
                  >
                    🔴
                  </span>
                </div>
                <div className="text-2xl">🌊</div>
              </div>

              <p className="mt-2 text-center text-xs text-cyan-100/90">
                Catch only counts if the bobber is inside the green zone.
              </p>
            </div>

            <p className="max-w-2xl text-sm text-cyan-100/95 sm:text-base">
              Pro tip: hit <strong>Catch!</strong> only when the line gets a bite.
            </p>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 md:mt-6 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Latest Catch</h2>
            {latestCatch ? (
              <div className="mt-3 flex items-start gap-3">
                <span className="text-3xl">{latestCatch.emoji}</span>
                <div>
                  <p className="text-lg font-bold text-slate-900">{latestCatch.name}</p>
                  <p className="text-sm text-slate-700">{latestCatch.weightKg.toFixed(2)} kg</p>
                  <p className="mt-1 text-xs text-slate-500">Caught at {formatCatchTime(latestCatch.caughtAt)}</p>
                </div>
                <span
                  className={`ml-auto rounded-full border px-2 py-1 text-xs font-semibold uppercase ${RARITY_CLASSES[latestCatch.rarity]}`}
                >
                  {latestCatch.rarity}
                </span>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No fish yet. Cast your line and make it count.</p>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Biggest Catch of the Day</h2>
            {dailyBest ? (
              <div className="mt-3 flex items-start gap-3">
                <span className="text-3xl">{dailyBest.emoji}</span>
                <div>
                  <p className="text-lg font-bold text-slate-900">{dailyBest.name}</p>
                  <p className="text-sm text-slate-700">{dailyBest.weightKg.toFixed(2)} kg</p>
                  <p className="mt-1 text-xs text-slate-500">Set at {formatCatchTime(dailyBest.caughtAt)}</p>
                </div>
                <span
                  className={`ml-auto rounded-full border px-2 py-1 text-xs font-semibold uppercase ${RARITY_CLASSES[dailyBest.rarity]}`}
                >
                  {dailyBest.rarity}
                </span>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No record yet today. Be the first to land one.</p>
            )}
            {isNewRecord ? (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                New daily record!
              </p>
            ) : null}
          </article>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur md:sticky md:mx-auto md:mb-6 md:max-w-5xl md:rounded-2xl md:border md:px-6 md:py-4">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCast}
            disabled={isCasting}
            className="h-14 rounded-xl bg-blue-600 px-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:text-blue-50"
          >
            Cast
          </button>
          <button
            type="button"
            onClick={handleReel}
            disabled={!canReel}
            className="h-14 rounded-xl bg-emerald-600 px-4 text-lg font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 disabled:text-emerald-50"
          >
            {phase === "bite" ? "Catch!" : "Reel"}
          </button>
        </div>
      </div>
    </div>
  );
}
