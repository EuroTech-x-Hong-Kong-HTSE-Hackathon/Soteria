import { createFileRoute } from "@tanstack/react-router";
import { FamilyNav } from "@/components/soteria/FamilyNav";
import { PrivacyPill } from "@/components/soteria/PrivacyPill";

export const Route = createFileRoute("/family/support")({
  head: () => ({
    meta: [
      { title: "Soteria — Support" },
      { name: "description", content: "Help and contact for the trusted adult app." },
    ],
  }),
  component: FamilySupport,
});

const ITEMS = [
  { icon: "call", title: "Call Soteria care", sub: "Mon–Sun · 8am–10pm" },
  { icon: "chat", title: "Message a specialist", sub: "Typical reply in 15 min" },
  { icon: "menu_book", title: "How privacy works", sub: "On-device detection, never streamed" },
  { icon: "tune", title: "Adjust alert sensitivity", sub: "Margaret's companion settings" },
];

function FamilySupport() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex justify-center">
      <div className="w-full max-w-md flex flex-col pb-24">
        <header className="flex flex-col items-center pt-xl pb-md px-margin-mobile border-b border-outline-variant bg-surface-dim gap-md">
          <PrivacyPill />
          <h1 className="text-display-sm font-bold tracking-tight">Support</h1>
        </header>
        <main className="flex-1 px-margin-mobile py-lg flex flex-col gap-sm">
          {ITEMS.map((it) => (
            <button
              key={it.title}
              className="bg-surface-container rounded-xl p-md border border-outline-variant/40 flex items-center gap-md text-left active:scale-[0.99] transition-transform"
            >
              <div className="bg-surface-dim p-sm rounded-lg border border-outline-variant/30">
                <span
                  className="material-symbols-outlined text-tertiary-fixed-dim"
                  style={{ fontSize: 24 }}
                >
                  {it.icon}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-headline-sm">{it.title}</span>
                <span className="text-body-md text-on-surface-variant">{it.sub}</span>
              </div>
            </button>
          ))}
        </main>
        <FamilyNav active="/family/support" />
      </div>
    </div>
  );
}