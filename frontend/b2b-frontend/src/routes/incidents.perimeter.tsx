import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, btn } from "@/components/Shell";
import { Icon } from "@/components/Icon";

export const Route = createFileRoute("/incidents/perimeter")({
  head: () => ({
    meta: [
      { title: "Soteria — Active Incident" },
      { name: "description", content: "Possible perimeter breach incident review." },
    ],
  }),
  component: Incident,
});

function Incident() {
  const [resolved, setResolved] = useState<null | "dispatched" | "false">(null);

  return (
    <Shell breadcrumb="Active Incidents">
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-6xl mx-auto flex flex-col xl:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-surface-container rounded-xl border border-error overflow-hidden flex flex-col">
              <div className="p-6 border-b border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 rounded-full bg-error-container text-error text-[10px] font-bold uppercase tracking-wider">
                      High risk
                    </span>
                    <span className="text-sm text-on-surface-variant tabular-nums">
                      Detected 23 seconds ago
                    </span>
                  </div>
                  <h1 className="text-[24px] font-semibold text-on-surface">
                    Possible perimeter breach
                  </h1>
                  <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                    <Icon name="location_on" size={16} />
                    Rear boundary wall · Camera P-04
                  </p>
                </div>
              </div>

              <div className="relative w-full aspect-video bg-black flex flex-col justify-center items-center">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-20"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1614850715649-1d0106293cb1?q=80&w=2070&auto=format&fit=crop')",
                  }}
                />
                <div className="relative z-10 flex flex-col items-center gap-2 p-6 text-center">
                  <Icon name="visibility_off" size={48} className="text-tertiary opacity-70" fill />
                  <p className="text-sm text-on-surface opacity-80">
                    Privacy view — identity hidden until operator opens full evidence.
                  </p>
                  <button className="mt-2 px-4 py-2 rounded-full border border-outline-variant text-on-surface text-[12px] font-bold uppercase tracking-wider hover:bg-surface-bright transition-colors flex items-center gap-1 active:scale-95">
                    <Icon name="touch_app" size={16} />
                    Hold to open full clip
                  </button>
                </div>
              </div>

              <div className="p-6 bg-surface-container flex flex-col gap-4">
                <div className="flex items-start gap-2">
                  <Icon name="smart_toy" className="text-tertiary mt-0.5" />
                  <p className="text-base text-on-surface leading-relaxed">
                    System suggests review: A person crossed the rear boundary wall and moved toward
                    the parking area. No matching gate entry was recorded.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["Boundary zone", "Nighttime", "No gate record"].map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1.5 rounded-full border border-outline-variant text-[12px] font-bold tracking-wider text-on-surface-variant"
                    >
                      {t}
                    </span>
                  ))}
                  <span className="px-3 py-1.5 rounded-full bg-[#4c4942] text-[#cbc6bd] text-[12px] font-bold tracking-wider flex items-center gap-1">
                    <Icon name="error" size={14} />
                    Needs review
                  </span>
                </div>
              </div>
            </div>

            {/* Action row — only Dispatch guard + Mark false alarm, equal size */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setResolved("dispatched")}
                disabled={resolved !== null}
                className="flex-1 min-w-[260px] py-4 px-6 rounded-full bg-error text-on-error text-[16px] font-bold uppercase tracking-wider flex justify-center items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Icon name="shield_person" fill />
                Dispatch guard
              </button>
              <button
                onClick={() => setResolved("false")}
                disabled={resolved !== null}
                className="flex-1 min-w-[260px] py-4 px-6 rounded-full border border-outline-variant text-on-surface text-[16px] font-bold uppercase tracking-wider flex justify-center items-center gap-2 hover:bg-surface-bright transition-colors disabled:opacity-50"
              >
                <Icon name="close" />
                Mark false alarm
              </button>
            </div>
            {resolved && (
              <div className="bg-surface-container border border-tertiary-fixed-dim/40 rounded-lg p-4 flex items-center gap-3">
                <Icon name="check_circle" className="text-tertiary-fixed-dim" />
                <span className="text-sm text-on-surface">
                  {resolved === "dispatched"
                    ? "Guard dispatched to rear boundary wall. ETA 2 minutes."
                    : "Marked as false alarm. Incident closed and logged."}
                </span>
              </div>
            )}
          </div>

          {/* Timeline */}
          <aside className="w-full xl:w-80 shrink-0">
            <div className="bg-surface-container rounded-xl border border-outline-variant p-6 h-full flex flex-col">
              <h2 className="text-[20px] font-semibold text-on-surface mb-6 flex items-center gap-2">
                <Icon name="history" />
                Incident timeline
              </h2>
              <div className="flex-grow flex flex-col gap-6 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-outline-variant" />
                {[
                  { t: "22:41:06", e: "Motion detected at rear wall", active: true },
                  { t: "22:41:12", e: "AI classified object as 'Person'" },
                  { t: "22:41:15", e: "Subject tracked moving North" },
                  { t: "22:40:00", e: "Routine system check OK", dim: true },
                ].map((it, i) => (
                  <div key={i} className={`relative pl-8 ${it.dim ? "opacity-60" : ""}`}>
                    <div
                      className={`absolute left-0 top-1 w-6 h-6 rounded-full bg-surface-container border flex items-center justify-center z-10 ${
                        it.active ? "border-error" : "border-outline-variant"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          it.active ? "bg-error" : "bg-outline-variant"
                        }`}
                      />
                    </div>
                    <div className="text-[11px] text-on-surface-variant tabular-nums mb-1 font-bold tracking-wider">
                      {it.t}
                    </div>
                    <div className="text-sm text-on-surface">{it.e}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
      
    </Shell>
  );
}
