"use client";

import { useEffect, useRef, useState } from "react";

const FAKE_WALLETS = [
  "0x8b2d4af6db1d2ce5db7fb04e6d18b7dbb1041920",
  "0x13fb9987534be7d987c2c9f5f4ac5bd42e5bb112",
  "0x9ec1ebf08f2a6d07a50dfd85d66f1d628f86afcb",
];
const QUICK_AMOUNTS = [25, 50, 100, 250];
const QUICK_RECIPIENTS = ["ana@lisboa", "damir@zk", "0x4d2f...8be1", "joao@alfama"];
const TIMELINE_STEPS = [
  { title: "Queued", description: "Transfer request entered the Lisbon relay queue." },
  { title: "Validating", description: "Wallet signature and recipient checks are complete." },
  { title: "Settled", description: "Funds arrived in the destination mock wallet." },
];

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Home() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [lastTransfer, setLastTransfer] = useState<{
    id: string;
    recipient: string;
    amount: number;
    requestedAt: string;
  } | null>(null);
  const [timelineProgress, setTimelineProgress] = useState(-1);
  const [timelineTimes, setTimelineTimes] = useState(["", "", ""]);
  const timelineTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  function clearTimelineTimeouts() {
    timelineTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timelineTimeoutsRef.current = [];
  }

  function resetTransfer() {
    clearTimelineTimeouts();
    setLastTransfer(null);
    setTimelineProgress(-1);
    setTimelineTimes(["", "", ""]);
    setRecipient("");
    setAmount("");
  }

  useEffect(() => {
    return () => {
      clearTimelineTimeouts();
    };
  }, []);

  function toggleWallet() {
    if (connectedAddress) {
      clearTimelineTimeouts();
      setConnectedAddress(null);
      setLastTransfer(null);
      setTimelineProgress(-1);
      setTimelineTimes(["", "", ""]);
      return;
    }

    const randomWallet = FAKE_WALLETS[Math.floor(Math.random() * FAKE_WALLETS.length)];
    setConnectedAddress(randomWallet);
  }

  const isConnected = Boolean(connectedAddress);
  const recipientValue = recipient.trim();
  const parsedAmount = Number(amount);
  const isRecipientValid = recipientValue.length >= 3;
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount <= 2450;
  const isTransferInFlight = timelineProgress >= 0 && timelineProgress < TIMELINE_STEPS.length - 1;
  const isTimelineComplete = timelineProgress === TIMELINE_STEPS.length - 1;
  const canSubmit = isConnected && isRecipientValid && isAmountValid && !isTransferInFlight;
  const fee = isAmountValid ? Math.max(0.2, parsedAmount * 0.0035) : 0;
  const totalDebit = isAmountValid ? parsedAmount + fee : 0;
  const timelinePercent =
    timelineProgress < 0 ? 0 : ((timelineProgress + 1) / TIMELINE_STEPS.length) * 100;

  const helperText = !isConnected
    ? "Connect wallet to unlock transfer."
    : isTransferInFlight
      ? "Transfer in progress. Timeline is updating."
      : !isRecipientValid
        ? "Recipient should be at least 3 characters."
        : !isAmountValid
          ? "Enter amount between 0.01 and 2,450 EUR."
          : "Ready to send.";

  function submitTransfer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    clearTimelineTimeouts();

    const now = new Date();
    setLastTransfer({
      id: `LIS-${Math.floor(100000 + Math.random() * 900000)}`,
      recipient: recipientValue,
      amount: parsedAmount,
      requestedAt: formatTime(now),
    });
    setTimelineProgress(0);
    setTimelineTimes([formatTime(now), "", ""]);

    timelineTimeoutsRef.current.push(
      setTimeout(() => {
        setTimelineProgress(1);
        setTimelineTimes((prev) => [prev[0], formatTime(new Date()), prev[2]]);
      }, 900),
    );
    timelineTimeoutsRef.current.push(
      setTimeout(() => {
        setTimelineProgress(2);
        setTimelineTimes((prev) => [prev[0], prev[1], formatTime(new Date())]);
      }, 2200),
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.28),transparent_44%),radial-gradient(circle_at_82%_16%,rgba(249,115,22,0.24),transparent_36%),linear-gradient(160deg,#040711_0%,#0A1328_45%,#1A0F12_100%)] text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-6 py-10 sm:px-8 lg:py-14">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-sky-200/90">Lisbon Demo Flow</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Send Money in Lisbon</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
              Fake wallet connect, transfer form, and success timeline are now wired for the demo.
            </p>
          </div>
          <span className="rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-100">
            Mocknet Live
          </span>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_20px_80px_-30px_rgba(56,189,248,0.45)] backdrop-blur-sm sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-300">Wallet</p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
              {isConnected ? "Wallet Connected" : "Connect to Start"}
            </h2>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              {isConnected
                ? `Ready to send from ${shortAddress(connectedAddress!)}.`
                : "Tap connect and we will attach a demo wallet address instantly."}
            </p>

            <button
              type="button"
              onClick={toggleWallet}
              className="mt-6 inline-flex rounded-xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
            >
              {isConnected ? "Disconnect Wallet" : "Connect Wallet"}
            </button>
          </div>

          <aside className="rounded-3xl border border-white/15 bg-slate-900/55 p-6 backdrop-blur-sm sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-300">Session Status</p>
            <div className="mt-4 flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`}
                aria-hidden
              />
              <p className="text-sm text-slate-200">{isConnected ? "Connected" : "Awaiting wallet connect"}</p>
            </div>

            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Address</p>
                <p className="mt-1 font-medium text-slate-100">
                  {isConnected ? shortAddress(connectedAddress!) : "Not connected"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Demo Balance</p>
                <p className="mt-1 font-medium text-slate-100">{isConnected ? "2,450.00 EUR" : "--"}</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-slate-950/40 p-6 sm:p-8">
          <h3 className="text-lg font-semibold">Transfer Panel</h3>
          <p className="mt-2 text-sm text-slate-300">
            Enter recipient and amount to trigger a mocked Lisbon transfer.
          </p>

          <form className="mt-5 space-y-4" onSubmit={submitTransfer}>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                disabled={isTransferInFlight}
                className="rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-300/70"
                placeholder="Recipient (wallet or username)"
              />
              <div className="relative">
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  disabled={isTransferInFlight}
                  className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 pr-14 text-sm text-slate-100 outline-none transition focus:border-sky-300/70"
                  placeholder="Amount"
                  inputMode="decimal"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  EUR
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  disabled={isTransferInFlight}
                  className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-sky-300/70 hover:text-sky-100"
                >
                  {preset} EUR
                </button>
              ))}
            </div>

            <div>
              <p className="text-sm text-slate-300">{helperText}</p>
              {isConnected && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {QUICK_RECIPIENTS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRecipient(item)}
                      disabled={isTransferInFlight}
                      className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300 transition hover:border-sky-300/70 hover:text-sky-100"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isConnected && isAmountValid && (
              <div className="rounded-xl border border-white/15 bg-slate-900/55 p-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Network Fee</span>
                  <span>{fee.toFixed(2)} EUR</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-slate-300">
                  <span>Estimated Arrival</span>
                  <span>~2.2s</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 font-semibold text-slate-100">
                  <span>Total Debit</span>
                  <span>{totalDebit.toFixed(2)} EUR</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 hover:enabled:bg-emerald-200"
            >
              {isTransferInFlight ? "Processing..." : "Send Money"}
            </button>
          </form>

          {lastTransfer && (
            <div className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm sm:p-5">
              <p className="font-semibold text-emerald-200">Transaction Timeline</p>
              <p className="mt-1 text-slate-200">
                {lastTransfer.amount.toFixed(2)} EUR to {lastTransfer.recipient}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-100/90">
                Ref {lastTransfer.id} • {lastTransfer.requestedAt}
              </p>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-300 transition-all duration-500"
                  style={{ width: `${timelinePercent}%` }}
                />
              </div>

              <div className="mt-4">
                {TIMELINE_STEPS.map((step, index) => {
                  const isComplete = timelineProgress > index;
                  const isActive = timelineProgress === index;

                  return (
                    <div key={step.title} className="flex gap-3">
                      <div className="mt-0.5 flex flex-col items-center">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isComplete ? "bg-emerald-300" : isActive ? "bg-sky-300" : "bg-white/25"
                          }`}
                        />
                        {index < TIMELINE_STEPS.length - 1 && (
                          <span className={`mt-1 h-8 w-px ${isComplete ? "bg-emerald-300/80" : "bg-white/20"}`} />
                        )}
                      </div>
                      <div className={index < TIMELINE_STEPS.length - 1 ? "pb-2.5" : ""}>
                        <p
                          className={`font-medium ${
                            isComplete || isActive ? "text-emerald-100" : "text-slate-300"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-slate-300">{step.description}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          {timelineTimes[index] || "Pending"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {isTimelineComplete && (
                <button
                  type="button"
                  onClick={resetTransfer}
                  className="mt-4 rounded-lg border border-emerald-300/40 bg-emerald-300/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100 transition hover:bg-emerald-300/25"
                >
                  New Transfer
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
