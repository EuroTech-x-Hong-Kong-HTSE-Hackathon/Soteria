import { createFileRoute, Link } from "@tanstack/react-router";
import { PrivacyPill } from "@/components/soteria/PrivacyPill";
import { ResidentNav } from "@/components/soteria/ResidentNav";

export const Route = createFileRoute("/resident/notified")({
  head: () => ({
    meta: [
      { title: "Soteria — Contact notified" },
      {
        name: "description",
        content:
          "Reassurance screen shown after Margaret's trusted contact has been told.",
      },
    ],
  }),
  component: ResidentNotified,
});

function ResidentNotified() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col w-full max-w-md mx-auto pb-20">
      <header className="flex items-center justify-between px-margin-mobile h-16 w-full">
        <span className="text-label-caps uppercase text-on-surface-variant">
          Soteria check-in
        </span>
        <PrivacyPill label="On this device" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile gap-lg text-center">
        <div
          className="w-24 h-24 rounded-full bg-surface-container-highest flex items-center justify-center border border-tertiary animate-pulse"
        >
          <span
            className="material-symbols-outlined text-tertiary"
            style={{ fontSize: 56 }}
          >
            monitor_heart
          </span>
        </div>

        <div className="space-y-sm max-w-md">
          <h1 className="text-display-sm font-bold tracking-tight">
            Your trusted contact has been told.
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Sarah was notified at 9:42 AM. Stay where you are if you can't move. Help is
            on the way.
          </p>
        </div>

        <Link
          to="/resident"
          className="bg-primary text-on-primary text-headline-sm font-semibold px-xl py-md rounded-full hover:bg-primary-fixed transition-colors"
        >
          I'm OK now
        </Link>
      </main>

      <section className="px-margin-mobile pb-xl">
        <div className="relative flex justify-between items-center pt-lg">
          <div className="absolute left-[10%] right-[10%] top-[34px] h-[2px] bg-surface-container-highest z-0" />
          <div className="absolute left-[10%] right-1/2 top-[34px] h-[2px] bg-tertiary z-0" />
          <Step label="Detected" done />
          <Step label="Sarah told" done />
          <Step label="Awaiting reply" />
        </div>
      </section>
      <ResidentNav active="/resident/notified" />
    </div>
  );
}

function Step({ label, done = false }: { label: string; done?: boolean }) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-sm bg-surface px-sm">
      <span
        className={
          "material-symbols-outlined " +
          (done ? "text-tertiary icon-fill" : "text-on-surface-variant")
        }
      >
        {done ? "check_circle" : "radio_button_unchecked"}
      </span>
      <span
        className={
          "text-label-caps uppercase " +
          (done ? "text-on-surface" : "text-on-surface-variant")
        }
      >
        {label}
      </span>
    </div>
  );
}