import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Icon } from "@/components/Icon";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soteria — Estate Overview" },
      { name: "description", content: "Live estate security overview" },
    ],
  }),
  component: Overview,
});

const stats = [
  { value: "42", label: "cameras", state: "Online", icon: "videocam", positive: true },
  { value: "5", label: "clusters", state: "Active zones", icon: "hub" },
  { value: "2", label: "events", state: "Needs review", icon: "visibility", warn: true },
  { value: "0", label: "critical", state: "All clear", icon: "verified_user", positive: true },
];

const clusters = [
  { name: "Gate Cluster", icon: "gite", cams: 6, fn: "License + Tailgating", state: "review", x: "10%", y: "50%" },
  { name: "Perimeter", icon: "fence", cams: 12, fn: "Intrusion + Loitering", state: "ok", x: "50%", y: "15%", center: true },
  { name: "Tower B Hallway", icon: "door_front", cams: 8, fn: "Packages + Motion", state: "review", x: "45%", y: "65%" },
  { name: "Parking Level B1", icon: "local_parking", cams: 10, fn: "Plates + Activity", state: "ok", x: "70%", y: "75%" },
  { name: "Utility Room", icon: "bolt", cams: 6, fn: "Access", state: "ok", x: "85%", y: "30%" },
];

const reviewCards = [
  { id: "1", title: "Possible tailgating at Main Gate", loc: "Main Gate • Gate Cluster", time: "Just now", level: "review", to: "/incidents/perimeter" as const },
  { id: "2", title: "Package left in Tower B lobby", loc: "Tower B Lobby • Hallway Cluster", time: "2m ago", level: "review", to: "/events/package" as const },
  { id: "3", title: "Loitering near perimeter wall", loc: "North Wall • Perimeter", time: "15m ago", level: "notice" },
  { id: "4", title: "Unknown vehicle plate needs review", loc: "B1 Entrance • Parking Cluster", time: "1h ago", level: "notice" },
];

function Overview() {
  return (
    <Shell breadcrumb="Live Estate View">
      {/* Stats strip */}
      <div className="p-6 shrink-0 border-b border-outline-variant bg-surface">
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`bg-surface-container border rounded-lg p-3 flex items-center gap-4 relative overflow-hidden ${
                s.warn ? "border-[#FFB4AB]/30" : "border-outline-variant"
              }`}
            >
              {s.warn && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFB4AB]/5 to-transparent" />
              )}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative ${
                  s.warn ? "bg-[#93000A] border border-[#FFB4AB]/50" : s.positive ? "bg-tertiary-fixed-dim/10" : "bg-surface-variant"
                }`}
              >
                <Icon
                  name={s.icon}
                  className={s.warn ? "text-[#FFDAD6]" : s.positive ? "text-tertiary-fixed-dim" : "text-on-surface"}
                />
              </div>
              <div className="relative">
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-semibold tabular-nums ${s.warn ? "text-[#FFB4AB]" : "text-on-surface"}`}>
                    {s.value}
                  </span>
                  <span className="text-sm text-on-surface-variant">{s.label}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {(s.positive || s.warn) && (
                    <span
                      className={`w-2 h-2 rounded-full ${s.warn ? "bg-[#FFB4AB] animate-pulse" : "bg-tertiary-fixed-dim"}`}
                    />
                  )}
                  <span
                    className={`text-[12px] font-bold tracking-wider ${
                      s.warn ? "text-[#FFB4AB]" : s.positive ? "text-tertiary-fixed-dim" : "text-on-surface-variant"
                    }`}
                  >
                    {s.state}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative bg-surface-container-lowest map-grid-bg overflow-hidden flex items-center justify-center p-6">
          <div className="relative w-full max-w-[820px] aspect-[4/3] rounded-xl border border-outline-variant/30 bg-surface-container/20 backdrop-blur-sm">
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 800 600">
              <path d="M 100 100 L 700 100 L 700 500 L 100 500 Z" fill="none" stroke="#8f9195" strokeDasharray="8 8" strokeWidth="2" />
              <path d="M 400 100 L 400 500" stroke="#8f9195" strokeWidth="1" />
              <path d="M 0 300 L 100 300 M 700 300 L 800 300" stroke="#c5c6cb" strokeOpacity="0.3" strokeWidth="8" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Icon name="domain" size={300} />
            </div>
            {clusters.map((c) => (
              <Link
                key={c.name}
                to="/clusters"
                className="absolute group cursor-pointer hover:scale-105 transition-transform z-10"
                style={{
                  top: c.y,
                  left: c.x,
                  transform: c.center ? "translate(-50%, -50%)" : "translateY(-50%)",
                }}
              >
                <div
                  className={`bg-surface-container border rounded-xl p-3 shadow-lg backdrop-blur-md relative min-w-[180px] ${
                    c.state === "review" ? "border-[#FFB4AB]/50" : "border-outline-variant"
                  }`}
                >
                  {c.state === "review" && (
                    <div className="absolute -inset-1 rounded-xl border border-[#FFB4AB] animate-ping opacity-20" />
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        c.state === "review"
                          ? "bg-[#93000A] text-[#FFDAD6]"
                          : "bg-surface-variant text-on-surface"
                      }`}
                    >
                      <Icon name={c.icon} size={18} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-on-surface leading-tight">
                        {c.name}
                      </h3>
                      <div
                        className={`flex items-center gap-1 text-[11px] font-bold tracking-wider ${
                          c.state === "review" ? "text-[#FFB4AB]" : "text-tertiary-fixed-dim"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.state === "review" ? "bg-[#FFB4AB]" : "bg-tertiary-fixed-dim"
                          }`}
                        />
                        <span>{c.state === "review" ? "Review" : "OK"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 text-[12px] text-on-surface-variant bg-background/50 rounded-lg p-1.5 border border-outline-variant/30">
                    <span className="tabular-nums">{c.cams} cams</span>
                    <span className="opacity-50">|</span>
                    <span>{c.fn}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Review queue */}
        <aside className="w-[360px] bg-surface border-l border-outline-variant flex flex-col shrink-0 h-full">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-dim">
            <div className="flex items-center gap-2">
              <Icon name="queue_play_next" className="text-on-surface" />
              <h2 className="text-[20px] font-semibold text-on-surface">Live Review Queue</h2>
            </div>
            <span className="bg-surface-variant text-on-surface px-2 py-0.5 rounded-full text-[12px] font-bold tabular-nums">
              4
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {reviewCards.map((c) => (
              <div
                key={c.id}
                className={`bg-surface-container border border-outline-variant rounded-lg p-4 relative overflow-hidden ${
                  c.level === "notice" ? "opacity-80 hover:opacity-100 transition-opacity" : ""
                }`}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    c.level === "review" ? "bg-[#FFB4AB]" : "bg-secondary"
                  }`}
                />
                <div className="flex justify-between items-start mb-2">
                  <div
                    className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${
                      c.level === "review"
                        ? "bg-[#93000A] text-[#FFDAD6] border border-[#FFB4AB]/30"
                        : "bg-surface-variant text-on-surface border border-outline-variant"
                    }`}
                  >
                    {c.level === "review" ? "Needs Review" : "Notice"}
                  </div>
                  <span className="text-[12px] text-on-surface-variant tabular-nums">{c.time}</span>
                </div>
                <h4 className="text-[15px] font-semibold text-on-surface mb-1 leading-tight">
                  {c.title}
                </h4>
                <div className="flex items-center gap-1 text-[13px] text-on-surface-variant mb-3">
                  <Icon name="location_on" size={14} />
                  <span>{c.loc}</span>
                </div>
                {c.to ? (
                  <Link
                    to={c.to}
                    className="w-full inline-flex bg-primary-fixed text-[#191c20] font-bold text-[12px] uppercase tracking-wider py-2 rounded-lg hover:bg-white transition-colors items-center justify-center gap-1"
                  >
                    <Icon name="visibility" size={16} />
                    Review
                  </Link>
                ) : (
                  <Link
                    to="/notifications"
                    className="w-full inline-flex border border-outline-variant text-on-surface font-bold text-[12px] uppercase tracking-wider py-2 rounded-lg hover:bg-surface-container-high transition-colors items-center justify-center"
                  >
                    Open Log
                  </Link>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>

      
    </Shell>
  );
}
