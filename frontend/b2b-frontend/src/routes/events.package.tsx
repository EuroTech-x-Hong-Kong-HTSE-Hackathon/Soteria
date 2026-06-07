import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, btn } from "@/components/Shell";
import { Icon } from "@/components/Icon";

export const Route = createFileRoute("/events/package")({
  head: () => ({
    meta: [
      { title: "Soteria — Package Event" },
      { name: "description", content: "Package pickup event review." },
    ],
  }),
  component: PackageEvent,
});

const steps = [
  {
    t: "10:24 AM",
    label: "Parcel left",
    img: "/parcel_left.png",
  },
  {
    t: "10:35 AM",
    label: "Parcel unattended (18m)",
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop",
    warn: true,
  },
  {
    t: "10:42 AM",
    label: "Parcel removed",
    img: "https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=600&auto=format&fit=crop",
    highlight: true,
  },
];

function PackageEvent() {
  const [resolved, setResolved] = useState<string | null>(null);

  return (
    <Shell breadcrumb="Package Event Review">
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[12px] font-bold tracking-wider border border-outline-variant">
                  PKG-992-B
                </span>
                <span className="text-sm text-on-surface-variant">10:42 AM · Today</span>
                <span className="flex items-center gap-1 text-sm text-on-surface-variant">
                  <Icon name="location_on" size={14} />
                  Tower B Lobby
                </span>
              </div>
              <h2 className="text-[32px] font-semibold tracking-tight text-on-surface">
                Package pickup needs review
              </h2>
            </div>
            <div className="flex gap-2">
              <button className={btn.secondary}>Previous</button>
              <button className={btn.secondary}>Next</button>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant border-l-4 border-l-tertiary-fixed-dim">
            <div className="flex items-start gap-3">
              <Icon name="robot_2" className="text-tertiary-fixed-dim mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="warning" className="text-[#FCD34D]" size={18} fill />
                  <span className="text-[12px] font-bold tracking-wider text-[#FCD34D]">
                    Medium Risk
                  </span>
                </div>
                <p className="text-base text-on-surface leading-relaxed">
                  A parcel was left in Tower B lobby for 18 minutes and later removed by a person
                  who did not match the expected delivery route.
                </p>
              </div>
            </div>
          </div>

          {/* Timeline strip — simplified, single block, clear horizontal flow */}
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant">
            <h3 className="text-[20px] font-semibold text-on-surface mb-4 flex justify-between items-center">
              Event Timeline
              <button className="text-[12px] font-bold tracking-wider text-tertiary flex items-center gap-1 hover:text-tertiary-fixed">
                <Icon name="open_in_new" size={16} />
                Open full clip
              </button>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {steps.map((s, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div
                    className={`w-full aspect-video rounded-lg overflow-hidden relative border ${
                      s.highlight
                        ? "border-tertiary-fixed-dim shadow-[0_0_15px_rgba(77,224,130,0.15)]"
                        : "border-outline-variant"
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-50"
                      style={{ backgroundImage: `url('${s.img}')` }}
                    />
                    <div className="absolute top-2 left-2 bg-surface-container-lowest/80 px-2 py-1 rounded text-[10px] font-bold tracking-wider text-on-surface backdrop-blur-sm">
                      {s.t}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        s.highlight
                          ? "bg-tertiary-fixed-dim"
                          : s.warn
                            ? "bg-[#FCD34D]"
                            : "bg-outline-variant"
                      }`}
                    />
                    <span className="text-sm text-on-surface">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Single info row */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Icon name="videocam" size={16} className="text-tertiary-fixed-dim" />
              Hallway Cluster · 12 cams
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Icon name="blur_on" size={16} className="text-[#4ADE80]" />
              Face blur active
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Icon name="history" size={16} />
              Flagged 10:43 AM
            </div>
          </div>

          {/* Action row — consistent button styles with other pages */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setResolved("verify")}
              disabled={resolved !== null}
              className={`${btn.primary} disabled:opacity-50`}
            >
              <Icon name="security" size={16} />
              Ask guard to verify
            </button>
            <button
              onClick={() => setResolved("expected")}
              disabled={resolved !== null}
              className={`${btn.secondary} disabled:opacity-50`}
            >
              Mark as expected pickup
            </button>
            <button
              onClick={() => setResolved("notified")}
              disabled={resolved !== null}
              className={`${btn.secondary} disabled:opacity-50`}
            >
              Notify property manager
            </button>
          </div>

          {resolved && (
            <div className="bg-surface-container border border-tertiary-fixed-dim/40 rounded-lg p-4 flex items-center gap-3">
              <Icon name="check_circle" className="text-tertiary-fixed-dim" />
              <span className="text-sm text-on-surface">
                {resolved === "verify"
                  ? "Guard requested to verify Tower B lobby."
                  : resolved === "expected"
                    ? "Marked as expected pickup. Event closed."
                    : "Property manager has been notified."}
              </span>
            </div>
          )}
        </div>
      </div>
      
    </Shell>
  );
}
