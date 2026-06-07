import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPill } from "@/components/soteria/PrivacyPill";
import { FamilyNav } from "@/components/soteria/FamilyNav";

export const Route = createFileRoute("/family/")({
  head: () => ({
    meta: [
      { title: "Soteria — Trusted adult" },
      {
        name: "description",
        content:
          "Sarah's quiet dashboard for Margaret — calm status, care circle, and a friendly hello.",
      },
    ],
  }),
  component: FamilyHome,
});

function FamilyHome() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex justify-center">
      <div className="w-full max-w-md flex flex-col pb-24">
        <header className="flex flex-col items-center pt-xl pb-md px-margin-mobile border-b border-outline-variant bg-surface-dim">
          <div className="flex items-center justify-between w-full mb-md">
            <div className="w-8" />
            <div className="text-center flex-1">
              <h1 className="text-headline-md font-bold tracking-tight">Margaret</h1>
              <p className="text-body-md text-on-surface-variant mt-xs">
                Mum · Elderly Safety Add-on
              </p>
            </div>
            <button className="w-8 flex justify-end text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
          <PrivacyPill label="Shared only after a safety event" />
        </header>

        <main className="flex-1 px-margin-mobile py-lg flex flex-col gap-lg">
          <section className="bg-surface-container rounded-xl p-lg border border-outline-variant/50 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-tertiary-fixed-dim/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex items-center gap-sm mb-sm">
                  <div
                    className="w-3 h-3 rounded-full bg-tertiary-fixed-dim animate-pulse"
                    style={{ boxShadow: "0 0 8px rgba(77,224,130,0.6)" }}
                  />
                  <h2 className="text-headline-md font-semibold">All quiet</h2>
                </div>
                <p className="text-label-caps uppercase text-on-surface-variant mb-md">
                  Last activity 3 minutes ago
                </p>
              </div>
              <div className="bg-surface-dim p-sm rounded-lg border border-outline-variant/30">
                <span
                  className="material-symbols-outlined icon-fill text-tertiary-fixed-dim"
                  style={{ fontSize: 32 }}
                >
                  sensor_occupied
                </span>
              </div>
            </div>
            <div className="mt-md pt-md border-t border-outline-variant/30 relative z-10">
              <p className="text-body-lg text-on-surface">
                Margaret is moving normally around the lounge.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-sm">
            <h3 className="text-label-caps uppercase text-on-surface-variant pl-xs">
              Care Circle
            </h3>
            <div className="flex gap-md overflow-x-auto pb-sm no-scrollbar">
              <Avatar initial="S" name="You" online />
              <Avatar initial="T" name="Carer Tom" />
              <Avatar initial="A" name="Margaret" online />
              <Avatar initial="D" name="Dr. P" />
            </div>
          </section>

          <section className="bg-surface-container-high rounded-xl p-md border border-outline-variant/30 flex flex-col gap-md">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-on-surface">waving_hand</span>
              <div>
                <h3 className="text-headline-sm">Say hi to Margaret</h3>
                <p className="text-body-md text-on-surface-variant mt-xs">
                  Sends a friendly message to her companion display.
                </p>
              </div>
            </div>
            <div className="flex gap-sm items-center">
              <input
                type="text"
                placeholder="Type a short message…"
                className="flex-1 bg-surface-dim border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-tertiary-fixed-dim focus:ring-1 focus:ring-tertiary-fixed-dim transition-all"
              />
              <button className="bg-tertiary-fixed-dim text-on-tertiary-fixed text-label-caps uppercase px-lg py-sm rounded-full hover:opacity-90 transition-opacity whitespace-nowrap font-semibold">
                Send
              </button>
            </div>
          </section>
        </main>

        <FamilyNav active="/family" />
      </div>
    </div>
  );
}

function Avatar({
  initial,
  name,
  online = false,
}: {
  initial: string;
  name: string;
  online?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-xs shrink-0">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-2 border-surface-container bg-surface-bright flex items-center justify-center text-on-surface-variant text-headline-sm font-semibold">
          {initial}
        </div>
        <div
          className={
            "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface-container " +
            (online ? "bg-tertiary-fixed-dim" : "bg-outline")
          }
        />
      </div>
      <span className="text-label-caps uppercase text-on-surface-variant truncate w-16 text-center">
        {name}
      </span>
    </div>
  );
}