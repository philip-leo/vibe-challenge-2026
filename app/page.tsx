"use client";

import Image from "next/image";
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
  isZeek?: boolean;
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
  { emoji: "🐟", top: 16, sizeRem: 1.2, durationSec: 16, delaySec: -5, blurPx: 0.6, opacity: 0.28, direction: "ltr" },
  { emoji: "🐠", top: 28, sizeRem: 1.7, durationSec: 21, delaySec: -12, blurPx: 1.2, opacity: 0.19, direction: "rtl" },
  { emoji: "🐡", top: 42, sizeRem: 1.4, durationSec: 19, delaySec: -2, blurPx: 1.6, opacity: 0.22, direction: "ltr" },
  { emoji: "🐟", top: 58, sizeRem: 1.8, durationSec: 24, delaySec: -15, blurPx: 1.8, opacity: 0.17, direction: "rtl" },
  { emoji: "🐠", top: 71, sizeRem: 1.3, durationSec: 20, delaySec: -8, blurPx: 1.1, opacity: 0.2, direction: "ltr" },
  { emoji: "🐟", top: 82, sizeRem: 1.1, durationSec: 25, delaySec: -17, blurPx: 1.4, opacity: 0.16, direction: "rtl" },
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

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createZeekCatch() {
  const caughtAt = Date.now();
  return {
    name: "Zeek Cat",
    emoji: "🐱",
    rarity: "legendary" as const,
    weightKg: 1000,
    caughtAt,
    txHash: makeTxHash(caughtAt),
    isZeek: true,
  } satisfies Catch;
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
  const [catchSpotlight, setCatchSpotlight] = useState<Catch | null>(null);
  const [missCue, setMissCue] = useState(false);

  const biteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const biteExpireTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ledgerCommitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successfulCatchCountRef = useRef(0);
  const nextZeekCatchAtRef = useRef(randomInt(3, 5));

  const canCast = phase === "idle";
  const canReel = phase === "line_out" || phase === "bite";
  const isBiteActive = phase === "bite";

  const phaseTextClass = useMemo(() => PHASE_TEXT_CLASSES[phase], [phase]);

  const clearTimer = (timer: ReturnType<typeof setTimeout> | null) => {
    if (timer) {
      clearTimeout(timer);
    }
  };

  const clearAllTimers = () => {
    clearTimer(biteTimeoutRef.current);
    clearTimer(biteExpireTimeoutRef.current);
    clearTimer(ledgerCommitTimeoutRef.current);
    clearTimer(resetTimeoutRef.current);
    biteTimeoutRef.current = null;
    biteExpireTimeoutRef.current = null;
    ledgerCommitTimeoutRef.current = null;
    resetTimeoutRef.current = null;
  };

  const scheduleReset = (delayMs = 1500) => {
    clearTimer(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      setPhase("idle");
      setStatusMessage("Tap Cast to drop your line.");
      setIsNewRecord(false);
      setCatchSpotlight(null);
      setMissCue(false);
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
    if (!canCast) {
      return;
    }

    clearAllTimers();
    setPhase("line_out");
    setStatusMessage("Line is out... waiting for bite signal.");
    setIsNewRecord(false);
    setCatchSpotlight(null);
    setMissCue(false);

    const biteDelayMs = 800 + Math.floor(Math.random() * 1400);
    biteTimeoutRef.current = setTimeout(() => {
      setPhase("bite");
      setStatusMessage("Bite detected! Tap Catch now!");

      biteExpireTimeoutRef.current = setTimeout(() => {
        setPhase("missed");
        setStatusMessage("Oh no. The fish slipped away.");
        setCatchSpotlight(null);
        setMissCue(true);
        scheduleReset(1600);
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

      successfulCatchCountRef.current += 1;
      const shouldDropZeek = successfulCatchCountRef.current >= nextZeekCatchAtRef.current;
      const caughtFish: Catch = shouldDropZeek ? createZeekCatch() : pickFish();
      if (shouldDropZeek) {
        nextZeekCatchAtRef.current = successfulCatchCountRef.current + randomInt(3, 5);
      }
      setPhase("caught");
      setStatusMessage(
        caughtFish.isZeek ? "Legendary signal! Zeek Cat hooked at 1000.00 kg." : "Catch locked. Verifying proof..."
      );
      setMissCue(false);
      setCatchSpotlight(caughtFish);

      clearTimer(ledgerCommitTimeoutRef.current);
      ledgerCommitTimeoutRef.current = setTimeout(() => {
        recordLedgerEntry(caughtFish);
        saveBestCatch(caughtFish);
        setStatusMessage(`Catch verified: ${caughtFish.name} (${caughtFish.weightKg.toFixed(2)} kg).`);
        setCatchSpotlight(null);
        ledgerCommitTimeoutRef.current = null;
      }, 900);

      scheduleReset(2100);
      return;
    }

    setPhase("missed");
    setStatusMessage("Oh no. Too early and the fish got spooked.");
    setIsNewRecord(false);
    setCatchSpotlight(null);
    setMissCue(true);
    scheduleReset(1600);
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
      {isBiteActive ? (
        <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_50%_58%,rgba(251,191,36,0.34),rgba(244,63,94,0.24),transparent_68%)] motion-safe:animate-[biteFlash_340ms_ease-in-out_infinite]" />
      ) : null}

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-32 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <header className="mb-4 flex flex-col gap-1 sm:mb-6">
          <div className="mb-1 flex items-center gap-3">
            <Image src="/zksync-foam.svg" alt="ZKsync Logo" width={72} height={40} className="h-9 w-auto drop-shadow-[0_0_14px_rgba(56,189,248,0.45)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/90">ZKSink</p>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Reel Proofs. Sink Legends.</h1>
          <p className="text-sm text-cyan-100/90 sm:text-base">Catch only when the bite event flashes.</p>
        </header>

        <section className="relative overflow-hidden rounded-3xl border border-cyan-300/35 bg-white/10 p-5 shadow-[0_24px_80px_rgba(8,145,178,0.2)] backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-cyan-200/10 blur-2xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_45%_60%,rgba(34,211,238,0.14),transparent_55%)]" />
          {catchSpotlight ? (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[radial-gradient(circle_at_50%_52%,rgba(16,185,129,0.3),rgba(8,47,73,0.2),transparent_72%)] px-4">
              <div className="w-full max-w-md rounded-3xl border border-emerald-200/70 bg-emerald-400/20 px-6 py-5 text-center shadow-[0_0_48px_rgba(16,185,129,0.55)] backdrop-blur motion-safe:animate-[catchSpotlight_520ms_ease-in-out_infinite]">
                <p className="font-mono text-xs font-semibold tracking-[0.2em] text-emerald-100">CATCH CONFIRMED</p>
                {catchSpotlight.isZeek ? (
                  <div className="mx-auto mt-3 w-fit rounded-2xl border border-emerald-200/70 bg-slate-950/25 p-2">
                    <Image src="/zeek-cat.svg" alt="Zeek Cat" width={120} height={120} className="h-24 w-24 object-contain sm:h-28 sm:w-28" />
                  </div>
                ) : (
                  <div className="mt-3 text-6xl">{catchSpotlight.emoji}</div>
                )}
                <p className="mt-2 text-2xl font-black text-white">{catchSpotlight.name}</p>
                <p className="font-mono text-sm text-emerald-100">{catchSpotlight.weightKg.toFixed(2)} kg catch secured</p>
              </div>
            </div>
          ) : null}

          {missCue ? (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[radial-gradient(circle_at_50%_55%,rgba(251,113,133,0.36),rgba(127,29,29,0.25),transparent_70%)] px-4">
              <div className="w-full max-w-md rounded-3xl border border-rose-300/70 bg-rose-900/55 px-6 py-5 text-center shadow-[0_0_44px_rgba(244,63,94,0.58)] backdrop-blur motion-safe:animate-[missPulse_500ms_ease-in-out_infinite]">
                <p className="font-mono text-xs font-semibold tracking-[0.2em] text-rose-100">FAILED HOOK</p>
                <p className="mt-2 text-3xl">🥲</p>
                <p className="mt-2 text-xl font-black text-rose-100">OH NO, YOU MISSED IT</p>
                <p className="font-mono text-xs text-rose-200">That fish said goodbye. Cast again.</p>
              </div>
            </div>
          ) : null}

          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-cyan-200/45 bg-cyan-100/15 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-100">
                {PHASE_LABELS[phase]}
              </span>
              <span className="font-mono text-xs text-cyan-100/80">Epoch: {todayKey || getLocalDayKey()}</span>
            </div>

            <div
              className={[
                "relative rounded-2xl border border-cyan-300/25 bg-slate-950/35 p-4 sm:p-6",
                isBiteActive ? "ring-2 ring-amber-300/90 shadow-[0_0_36px_rgba(251,191,36,0.65)]" : "",
              ].join(" ")}
            >
              {isBiteActive ? (
                <div className="pointer-events-none absolute -top-2 right-3 rounded-full border border-amber-200/85 bg-rose-500/85 px-3 py-1 font-mono text-[11px] font-bold tracking-[0.22em] text-amber-100 motion-safe:animate-[biteBadge_420ms_steps(2,end)_infinite]">
                  BITE!
                </div>
              ) : null}
              <div className="relative mx-auto grid max-w-3xl grid-cols-[auto_1fr_auto] items-end gap-4 sm:gap-8">
                <div className="pb-1 text-center">
                  <p className="font-mono text-[10px] tracking-[0.18em] text-cyan-200/75">CASTER</p>
                  <div className="mt-2 rounded-xl border border-cyan-300/35 bg-slate-900/70 p-1.5 shadow-[0_0_20px_rgba(59,130,246,0.28)]">
                    <Image src="/zeek-cat.svg" alt="Zeek Cat Caster" width={76} height={76} className="h-16 w-16 object-contain sm:h-[4.5rem] sm:w-[4.5rem]" />
                  </div>
                </div>

                <div className="relative h-44 overflow-hidden rounded-[2.4rem] border border-cyan-300/35 bg-[radial-gradient(circle_at_45%_30%,rgba(34,211,238,0.35),rgba(8,47,73,0.95))] shadow-[inset_0_0_40px_rgba(8,145,178,0.35)] sm:h-48">
                  {isBiteActive ? (
                    <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_48%,rgba(251,191,36,0.42),transparent_58%)] motion-safe:animate-[pondAlert_360ms_ease-in-out_infinite]" />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(125,211,252,0.12),rgba(2,6,23,0.35))]" />
                  <div className="absolute inset-x-0 top-2 h-10 bg-cyan-200/15 blur-xl" />
                  {MEMPOOL_FISH.map((fish, index) => (
                    <span
                      key={`${fish.emoji}-${index}`}
                      className="absolute left-0 select-none"
                      style={{
                        top: `${fish.top}%`,
                        fontSize: `${fish.sizeRem}rem`,
                        opacity: fish.opacity,
                        filter: `blur(${fish.blurPx}px)`,
                        animation: `${fish.direction === "ltr" ? "pondSwimLTR" : "pondSwimRTL"} ${fish.durationSec}s linear ${fish.delaySec}s infinite`,
                        willChange: "transform",
                      }}
                    >
                      {fish.emoji}
                    </span>
                  ))}
                  <div className="absolute inset-x-0 bottom-2 text-center font-mono text-[10px] tracking-[0.2em] text-cyan-100/75">
                    MEMPOOL POND
                  </div>
                </div>

                <div className="pb-1 text-center">
                  <p className="font-mono text-[10px] tracking-[0.18em] text-cyan-200/75">WATCHER</p>
                  <div className="mt-2 rounded-lg border border-cyan-300/30 bg-slate-900/70 p-2 shadow-[0_0_18px_rgba(6,182,212,0.2)]">
                    <div className="font-mono text-[8px] leading-[0.62rem] text-cyan-100 drop-shadow-[0_0_6px_rgba(125,211,252,0.5)]">
                      <div>▗▆▖</div>
                      <div>▐█▌</div>
                      <div>▐▌▌</div>
                      <div>▟▙▙</div>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute left-[12%] top-[33%] h-[2px] w-[36%] origin-left -rotate-[12deg] bg-cyan-100/65" />
                <div className="pointer-events-none absolute left-[5%] top-[12%] h-[4px] w-[47%] origin-left -rotate-[16deg] rounded-full bg-gradient-to-r from-amber-200/90 via-orange-200/85 to-cyan-100/85 shadow-[0_0_14px_rgba(251,191,36,0.55)]" />
                <div className="pointer-events-none absolute left-[48.2%] top-[18.5%] h-[30%] w-[1.5px] rounded-full bg-cyan-100/70 shadow-[0_0_8px_rgba(125,211,252,0.6)]" />
                <span className="pointer-events-none absolute left-[47.7%] top-[47%] text-[13px] drop-shadow-[0_0_6px_rgba(125,211,252,0.7)]">🪝</span>
                <span
                  className={[
                    "pointer-events-none absolute left-[46%] top-[46%] text-sm drop-shadow-[0_0_8px_rgba(251,113,133,0.7)]",
                    phase === "line_out" ? "motion-safe:animate-pulse" : "",
                    phase === "bite" ? "motion-safe:animate-bounce" : "",
                  ].join(" ")}
                >
                  🔴
                </span>
              </div>
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
                    {entry.isZeek ? (
                      <Image src="/zeek-cat.svg" alt="Zeek Cat" width={34} height={34} className="h-8 w-8 object-contain" />
                    ) : (
                      <span className="text-lg">{entry.emoji}</span>
                    )}
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
                {dailyBest.isZeek ? (
                  <Image src="/zeek-cat.svg" alt="Zeek Cat" width={52} height={52} className="h-12 w-12 object-contain" />
                ) : (
                  <span className="text-3xl">{dailyBest.emoji}</span>
                )}
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

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-cyan-300/30 bg-slate-950/85 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-8px_32px_rgba(8,145,178,0.2)] backdrop-blur md:px-6 md:pt-4">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCast}
            disabled={!canCast}
            className="h-14 rounded-xl border border-cyan-300/40 bg-cyan-500/80 px-4 text-lg font-semibold text-cyan-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:border-cyan-300/20 disabled:bg-cyan-900/40 disabled:text-cyan-200/60"
          >
            Cast
          </button>
          <button
            type="button"
            onClick={handleReel}
            disabled={!canReel}
            className={[
              "h-14 rounded-xl border border-emerald-300/40 bg-emerald-500/80 px-4 text-lg font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:border-emerald-300/20 disabled:bg-emerald-900/40 disabled:text-emerald-200/60",
              isBiteActive
                ? "border-amber-200 bg-amber-300 text-amber-950 shadow-[0_0_26px_rgba(251,191,36,0.8)] motion-safe:animate-[reelSignal_360ms_ease-in-out_infinite]"
                : "",
            ].join(" ")}
          >
            {phase === "bite" ? "Catch!" : "Reel"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pondSwimLTR {
          0% {
            transform: translateX(-140%) translateY(0);
          }
          50% {
            transform: translateX(145%) translateY(-4px);
          }
          100% {
            transform: translateX(330%) translateY(0);
          }
        }

        @keyframes pondSwimRTL {
          0% {
            transform: translateX(320%) translateY(0) scaleX(-1);
          }
          50% {
            transform: translateX(135%) translateY(5px) scaleX(-1);
          }
          100% {
            transform: translateX(-140%) translateY(0) scaleX(-1);
          }
        }

        @keyframes biteFlash {
          0% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.62;
          }
          100% {
            opacity: 0.15;
          }
        }

        @keyframes pondAlert {
          0% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            opacity: 0.2;
          }
        }

        @keyframes reelSignal {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes biteBadge {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes catchSpotlight {
          0% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.45);
          }
          50% {
            transform: scale(1.04);
            box-shadow: 0 0 52px rgba(16, 185, 129, 0.82);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.45);
          }
        }

        @keyframes missPulse {
          0% {
            transform: scale(1);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.03);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  );
}
