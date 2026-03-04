"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Phase = "idle" | "line_out" | "bite" | "caught" | "missed";
type Rarity = "common" | "rare" | "legendary";
type SwimDirection = "ltr" | "rtl";

type Catch = {
  name: string;
  emoji: string;
  weightKg: number;
  rarity: Rarity;
  caughtAt: number;
  txHash: string;
};

type FishDef = {
  name: string;
  emoji: string;
  minKg: number;
  maxKg: number;
  rarity: Rarity;
  weight: number;
};

type MempoolFish = {
  emoji: string;
  top: number;
  sizeRem: number;
  durationSec: number;
  delaySec: number;
  blurPx: number;
  opacity: number;
  direction: SwimDirection;
};

const FISH_TABLE: FishDef[] = [
  { name: "Silver Minnow", emoji: "🐟", minKg: 0.2, maxKg: 0.8, rarity: "common", weight: 44 },
  { name: "Bluegill", emoji: "🐠", minKg: 0.5, maxKg: 1.8, rarity: "common", weight: 28 },
  { name: "River Trout", emoji: "🐟", minKg: 1.2, maxKg: 3.6, rarity: "rare", weight: 18 },
  { name: "Thunder Bass", emoji: "🐡", minKg: 2.2, maxKg: 5.8, rarity: "rare", weight: 8 },
  { name: "Golden Marlin", emoji: "🦈", minKg: 7, maxKg: 12.5, rarity: "legendary", weight: 2 },
];

const MEMPOOL_FISH: MempoolFish[] = [
  { emoji: "🐟", top: 18, sizeRem: 1.6, durationSec: 18, delaySec: -6, blurPx: 0.8, opacity: 0.25, direction: "ltr" },
  { emoji: "🐠", top: 26, sizeRem: 2.2, durationSec: 24, delaySec: -11, blurPx: 1.1, opacity: 0.2, direction: "rtl" },
  { emoji: "🐡", top: 38, sizeRem: 1.9, durationSec: 20, delaySec: -2, blurPx: 1.4, opacity: 0.22, direction: "ltr" },
  { emoji: "🐟", top: 51, sizeRem: 2.4, durationSec: 27, delaySec: -15, blurPx: 2.2, opacity: 0.14, direction: "rtl" },
  { emoji: "🐠", top: 63, sizeRem: 1.7, durationSec: 22, delaySec: -8, blurPx: 1.6, opacity: 0.19, direction: "ltr" },
  { emoji: "🐟", top: 75, sizeRem: 1.5, durationSec: 26, delaySec: -19, blurPx: 1.7, opacity: 0.16, direction: "rtl" },
];

const RARITY_CLASSES: Record<Rarity, string> = {
  common: "bg-cyan-500/15 text-cyan-100 border-cyan-300/40",
  rare: "bg-indigo-500/20 text-indigo-100 border-indigo-300/40",
  legendary: "bg-amber-500/20 text-amber-100 border-amber-300/40",
};

const PHASE_LABELS: Record<Phase, string> = {
  idle: "Ready",
  line_out: "Line Out",
  bite: "Bite!",
  caught: "Caught",
  missed: "Missed",
};

const PHASE_TEXT_CLASSES: Record<Phase, string> = {
  idle: "text-cyan-100",
  line_out: "text-sky-100",
  bite: "text-amber-200",
  caught: "text-emerald-200",
  missed: "text-rose-200",
};

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

function makeTxHash(seed: number) {
  const entropy = Math.floor(Math.random() * 65535)
    .toString(16)
    .padStart(4, "0");
  return `0x${seed.toString(16)}${entropy}`.slice(0, 18);
}

function pickFish() {
  const totalWeight = FISH_TABLE.reduce((sum, fish) => sum + fish.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const fish of FISH_TABLE) {
    roll -= fish.weight;
    if (roll <= 0) {
      const rawWeight = fish.minKg + Math.random() * (fish.maxKg - fish.minKg);
      const caughtAt = Date.now();
      return {
        name: fish.name,
        emoji: fish.emoji,
        rarity: fish.rarity,
        weightKg: Math.round(rawWeight * 100) / 100,
        caughtAt,
        txHash: makeTxHash(caughtAt),
      } satisfies Catch;
    }
  }

  const fallback = FISH_TABLE[0];
  const caughtAt = Date.now();
  return {
    name: fallback.name,
    emoji: fallback.emoji,
    rarity: fallback.rarity,
    weightKg: fallback.minKg,
    caughtAt,
    txHash: makeTxHash(caughtAt),
  } satisfies Catch;
}

function formatCatchTime(timestamp: number, withSeconds = false) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
  }).format(new Date(timestamp));
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMessage, setStatusMessage] = useState("Tap Cast to drop your line.");
  const [dailyBest, setDailyBest] = useState<Catch | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<Catch[]>([]);
  const [todayKey, setTodayKey] = useState("");
  const [isNewRecord, setIsNewRecord] = useState(false);

  const biteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const biteExpireTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCasting = phase === "line_out" || phase === "bite";
  const canReel = phase === "line_out" || phase === "bite";

  const phaseTextClass = useMemo(() => PHASE_TEXT_CLASSES[phase], [phase]);

  const clearTimer = (timer: ReturnType<typeof setTimeout> | null) => {
    if (timer) {
      clearTimeout(timer);
    }
  };

  const clearAllTimers = () => {
    clearTimer(biteTimeoutRef.current);
    clearTimer(biteExpireTimeoutRef.current);
    clearTimer(resetTimeoutRef.current);
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

  const recordLedgerEntry = (entry: Catch) => {
    setLedgerEntries((prev) => [entry, ...prev].slice(0, 6));
  };

  const handleCast = () => {
    if (isCasting) {
      return;
    }

    clearAllTimers();
    setPhase("line_out");
    setStatusMessage("Line is out... waiting for bite signal.");
    setIsNewRecord(false);

    const biteDelayMs = 800 + Math.floor(Math.random() * 1400);
    biteTimeoutRef.current = setTimeout(() => {
      setPhase("bite");
      setStatusMessage("Bite detected! Tap Catch now!");

      biteExpireTimeoutRef.current = setTimeout(() => {
        setPhase("missed");
        setStatusMessage("Too slow. The fish escaped.");
        scheduleReset(1300);
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

      const caughtFish = pickFish();
      setPhase("caught");
      setStatusMessage(`Catch verified: ${caughtFish.name} (${caughtFish.weightKg.toFixed(2)} kg).`);
      recordLedgerEntry(caughtFish);
      saveBestCatch(caughtFish);
      scheduleReset(1800);
      return;
    }

    setPhase("missed");
    setStatusMessage("Too early. You reeled in empty water.");
    setIsNewRecord(false);
    scheduleReset(1300);
  };

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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_15%,#12264d_0%,#071224_45%,#040a16_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(34,211,238,0.15),transparent_55%)]" />
        {MEMPOOL_FISH.map((fish, index) => (
          <span
            key={`${fish.emoji}-${index}`}
            className="absolute select-none"
            style={{
              top: `${fish.top}%`,
              fontSize: `${fish.sizeRem}rem`,
              opacity: fish.opacity,
              filter: `blur(${fish.blurPx}px)`,
              animation: `${fish.direction === "ltr" ? "zkSwimLTR" : "zkSwimRTL"} ${fish.durationSec}s linear ${fish.delaySec}s infinite`,
              willChange: "transform",
            }}
          >
            {fish.emoji}
          </span>
        ))}
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-32 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <header className="mb-4 flex flex-col gap-1 sm:mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/90">ZKSink</p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Reel Proofs. Sink Legends.</h1>
          <p className="text-sm text-cyan-100/90 sm:text-base">
            Pure timing mode is back. Catch only when the bite event flashes.
          </p>
        </header>

        <section className="relative overflow-hidden rounded-3xl border border-cyan-300/35 bg-white/10 p-5 shadow-[0_24px_80px_rgba(8,145,178,0.2)] backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-cyan-200/10 blur-2xl" />
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-cyan-200/45 bg-cyan-100/15 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-100">
                {PHASE_LABELS[phase]}
              </span>
              <span className="font-mono text-xs text-cyan-100/80">Epoch: {todayKey || getLocalDayKey()}</span>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={[
                  "inline-block h-4 w-4 rounded-full bg-rose-300 shadow-[0_0_0_4px_rgba(125,211,252,0.2)] motion-safe:transition-all",
                  phase === "bite" ? "motion-safe:animate-bounce" : "",
                  phase === "line_out" ? "motion-safe:animate-pulse" : "",
                ].join(" ")}
              />
              <p className={`text-lg font-semibold sm:text-xl ${phaseTextClass}`}>{statusMessage}</p>
            </div>

            <p className="max-w-2xl text-sm text-cyan-100/95 sm:text-base">
              Timing only: hit <strong>Catch!</strong> the instant bite appears.
            </p>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 md:mt-6 md:grid-cols-2">
          <article className="rounded-2xl border border-cyan-300/35 bg-white/10 p-4 shadow-[0_12px_40px_rgba(8,145,178,0.14)] backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-100">ZK Ledger</h2>
              <span className="font-mono text-[11px] text-cyan-200/80">Recent Verifications</span>
            </div>

            {ledgerEntries.length ? (
              <div className="mt-3 space-y-2">
                {ledgerEntries.map((entry) => (
                  <div
                    key={`${entry.txHash}-${entry.caughtAt}`}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border border-cyan-300/20 bg-slate-950/40 px-3 py-2"
                  >
                    <span className="text-lg">{entry.emoji}</span>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-cyan-100">
                        {formatCatchTime(entry.caughtAt, true)} | {entry.name}
                      </p>
                      <p className="font-mono text-[11px] text-cyan-200/70">{entry.txHash}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-white">{entry.weightKg.toFixed(2)} kg</p>
                      <span className="mt-1 inline-block rounded-full border border-emerald-300/35 bg-emerald-400/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-emerald-100">
                        Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 font-mono text-xs text-cyan-200/70">
                No transactions yet. Land one fish to mint your first verified catch.
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-cyan-300/35 bg-white/10 p-4 shadow-[0_12px_40px_rgba(8,145,178,0.14)] backdrop-blur-xl sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-100">Biggest Catch of the Day</h2>
            {dailyBest ? (
              <div className="mt-3 flex items-start gap-3">
                <span className="text-3xl">{dailyBest.emoji}</span>
                <div>
                  <p className="text-lg font-bold text-white">{dailyBest.name}</p>
                  <p className="font-mono text-sm text-cyan-100">{dailyBest.weightKg.toFixed(2)} kg</p>
                  <p className="mt-1 font-mono text-xs text-cyan-200/70">Set at {formatCatchTime(dailyBest.caughtAt)}</p>
                </div>
                <span
                  className={`ml-auto rounded-full border px-2 py-1 text-xs font-semibold uppercase ${RARITY_CLASSES[dailyBest.rarity]}`}
                >
                  {dailyBest.rarity}
                </span>
              </div>
            ) : (
              <p className="mt-3 text-sm text-cyan-100/85">No record yet today. Cast and claim the top spot.</p>
            )}

            {isNewRecord ? (
              <p className="mt-3 rounded-lg border border-emerald-300/35 bg-emerald-400/20 px-3 py-2 text-sm font-semibold text-emerald-100">
                New daily record verified.
              </p>
            ) : null}
          </article>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-cyan-300/30 bg-slate-950/85 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-8px_32px_rgba(8,145,178,0.2)] backdrop-blur md:sticky md:mx-auto md:mb-6 md:max-w-5xl md:rounded-2xl md:border md:px-6 md:py-4">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCast}
            disabled={isCasting}
            className="h-14 rounded-xl border border-cyan-300/40 bg-cyan-500/80 px-4 text-lg font-semibold text-cyan-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:border-cyan-300/20 disabled:bg-cyan-900/40 disabled:text-cyan-200/60"
          >
            Cast
          </button>
          <button
            type="button"
            onClick={handleReel}
            disabled={!canReel}
            className="h-14 rounded-xl border border-emerald-300/40 bg-emerald-500/80 px-4 text-lg font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:border-emerald-300/20 disabled:bg-emerald-900/40 disabled:text-emerald-200/60"
          >
            {phase === "bite" ? "Catch!" : "Reel"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes zkSwimLTR {
          0% {
            transform: translateX(-12vw) translateY(0);
          }
          50% {
            transform: translateX(52vw) translateY(-6px);
          }
          100% {
            transform: translateX(114vw) translateY(0);
          }
        }

        @keyframes zkSwimRTL {
          0% {
            transform: translateX(112vw) translateY(0) scaleX(-1);
          }
          50% {
            transform: translateX(48vw) translateY(6px) scaleX(-1);
          }
          100% {
            transform: translateX(-14vw) translateY(0) scaleX(-1);
          }
        }
      `}</style>
    </div>
  );
}
