import { createFileRoute } from "@tanstack/react-router";
import { ResidentNav } from "@/components/soteria/ResidentNav";
import { PrivacyPill } from "@/components/soteria/PrivacyPill";

export const Route = createFileRoute("/resident/support")({
  head: () => ({
    meta: [
      { title: "Soteria — Support" },
      { name: "description", content: "Help for Margaret on the companion." },
    ],
  }),
  component: ResidentSupport,
});

const ITEMS = [
  { icon: "call", title: "Call Sarah", sub: "Trusted contact" },
  { icon: "support_agent", title: "Call Soteria care", sub: "We pick up day and night" },
  { icon: "volume_up", title: "Make text larger", sub: "Or louder voice replies" },
];

function ResidentSupport() {
  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ backgroundColor: "#F8F7F4", color: "#1A1C1E" }}
    >
      <div className="w-full max-w-md flex flex-col pb-24">
        <header
          className="flex justify-between items-center px-margin-mobile h-16 w-full border-b"
          style={{ borderColor: "rgba(26,28,30,0.08)" }}
        >
          <span className="text-headline-sm font-bold">Support</span>
          <PrivacyPill />
        </header>
        <main className="flex-1 px-margin-mobile py-lg flex flex-col gap-md">
          {ITEMS.map((it) => (
            <button
              key={it.title}
              className="rounded-xl p-lg flex items-center gap-md border text-left"
              style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(26,28,30,0.08)" }}
            >
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#EFEDE7" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 28, color: "#1A1C1E" }}
                >
                  {it.icon}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-headline-sm">{it.title}</span>
                <span className="text-body-md opacity-70">{it.sub}</span>
              </div>
            </button>
          ))}
        </main>
        <ResidentNav active="/resident/support" />
      </div>
    </div>
  );
}