import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FamilyNav } from "@/components/soteria/FamilyNav";

export const Route = createFileRoute("/family/alert")({
  head: () => ({
    meta: [
      { title: "Soteria — Possible fall" },
      {
        name: "description",
        content:
          "Possible fall detected for Margaret. Privacy-preserving preview with quick actions for the trusted adult.",
      },
    ],
  }),
  component: FamilyAlert,
});

function FamilyAlert() {
  const [timeLeft, setTimeLeft] = useState(14);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const startHold = () => {
    if (holdRef.current) clearInterval(holdRef.current);
    setHoldProgress(0);
    holdRef.current = setInterval(() => {
      setHoldProgress((p) => {
        if (p >= 100) {
          if (holdRef.current) clearInterval(holdRef.current);
          return 100;
        }
        return p + 5;
      });
    }, 50);
  };
  const endHold = () => {
    if (holdRef.current) clearInterval(holdRef.current);
    if (holdProgress < 100) setHoldProgress(0);
  };

  const mm = "00";
  const ss = Math.max(timeLeft, 0).toString().padStart(2, "0");

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col pb-24 bg-surface-container border-x border-outline-variant/30">
        <div className="bg-error-container text-on-error-container p-md border-b border-error/20 animate-pulse">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined icon-fill">warning</span>
            <div>
              <h1 className="text-headline-sm font-semibold">
                Possible fall — Margaret
              </h1>
              <p className="text-body-md opacity-80">Detected 4 seconds ago</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-gutter flex flex-col gap-lg">
          <div className="rounded-xl overflow-hidden bg-surface-variant border border-outline-variant/50 flex flex-col">
            <div className="aspect-video relative bg-surface-container-high flex items-center justify-center overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center blur-md opacity-30"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA7DeGLrDYypYEu36Bw0UC3kA2ue1Z_wITa3NPiOpZJAV1ZfrRiczKBzTVG5jQFUYdsL4cwwWIDDJoLtkI5CxBz5s03frNKs8nkqSZjz_3EVE90I57zKtOLCo49YCJyC1frkS_AQU86I81mIAA5okH1C8lnEGZweVc0t8zF3psSjpWDHFZGV9R29hePHmRnrC5a3RJilRX1e5k1BglUCW-XVVsU2lvQ3-tdm9tQhm7BPVJDrwUc2og8v1MgnUbbsRp0nFhcYBONVNnq')",
                }}
              />
              <span
                className="material-symbols-outlined text-tertiary-fixed-dim z-10"
                style={{ fontSize: 72, opacity: 0.85 }}
              >
                accessibility_new
              </span>
              <div
                className="absolute top-sm left-sm rounded-full flex items-center gap-xs px-sm py-xs z-20"
                style={{ backgroundColor: "#16321F", color: "#4ADE80" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  lock
                </span>
                <span className="text-privacy-pill uppercase">Privacy Active</span>
              </div>
            </div>
            <div className="p-sm bg-surface-container flex flex-col items-center justify-center gap-sm border-t border-outline-variant/50">
              <p className="text-label-caps uppercase text-on-surface-variant text-center px-sm">
                Privacy view — raw video stays on Margaret's device.
              </p>
              <button
                onMouseDown={startHold}
                onMouseUp={endHold}
                onMouseLeave={endHold}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startHold();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  endHold();
                }}
                className="relative overflow-hidden w-full max-w-[220px] h-10 rounded-full border border-tertiary-fixed-dim/50 bg-tertiary-container/30 flex items-center justify-center select-none active:scale-95 transition-transform touch-none"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-tertiary-fixed-dim/20 transition-[width] duration-100 linear"
                  style={{ width: `${holdProgress}%` }}
                />
                <span className="text-label-caps uppercase text-tertiary-fixed-dim relative z-10">
                  {holdProgress >= 100 ? "Accessing…" : "Hold to view full clip"}
                </span>
              </button>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-md">
            <div className="flex gap-sm items-start">
              <span className="material-symbols-outlined text-primary mt-xs">
                smart_toy
              </span>
              <p className="text-body-md text-on-surface">
                "I saw Margaret go to the floor in the lounge and she has not moved."
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-md">
            <div className="text-display-lg text-error tabular-nums tracking-tighter font-bold">
              {mm}:{ss}
            </div>
            <p className="text-body-md text-on-surface-variant text-center mt-sm max-w-[280px]">
              Margaret has <span>{Math.max(timeLeft, 0)}</span> seconds to say she's OK
              before this alert escalates.
            </p>
          </div>
        </div>

        <div className="bg-surface-container-highest p-gutter flex flex-col gap-sm rounded-t-xl border-t border-outline-variant/50 mb-16">
          <button className="w-full bg-error text-on-error text-headline-sm font-semibold py-sm rounded-full flex items-center justify-center gap-xs hover:bg-error/90 transition-colors">
            <span className="material-symbols-outlined">call</span>
            Call Margaret now
          </button>
          <button className="w-full border border-tertiary-fixed-dim text-tertiary-fixed-dim text-headline-sm font-semibold py-sm rounded-full flex items-center justify-center gap-xs hover:bg-tertiary-fixed-dim/10 transition-colors">
            <span className="material-symbols-outlined">done_all</span>
            I'm aware
          </button>
          <div className="flex gap-sm mt-xs w-full">
            <button className="flex-1 border border-outline-variant text-on-surface-variant text-label-caps uppercase py-sm rounded-full hover:bg-surface-container transition-colors">
              Forward to Tom
            </button>
            <button className="flex-1 border border-outline-variant text-on-surface-variant text-label-caps uppercase py-sm rounded-full hover:bg-surface-container transition-colors">
              Mark false alarm
            </button>
          </div>
          <p className="text-label-caps uppercase text-outline text-center mt-sm">
            If you cannot act, Tom will be paged in 60 seconds.
          </p>
        </div>

        <FamilyNav active="/family/alert" />
      </div>
    </div>
  );
}