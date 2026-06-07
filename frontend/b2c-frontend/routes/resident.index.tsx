import { createFileRoute, Link } from "@tanstack/react-router";
import { PrivacyPill } from "@/components/soteria/PrivacyPill";
import { ResidentNav } from "@/components/soteria/ResidentNav";

export const Route = createFileRoute("/resident/")({
  head: () => ({
    meta: [
      { title: "Soteria — Companion home" },
      {
        name: "description",
        content:
          "Margaret's calm companion home: weather, schedule, care circle and a single help button.",
      },
      { property: "og:title", content: "Soteria — Companion home" },
    ],
  }),
  component: ResidentHome,
});

function ResidentHome() {
  return (
    <div
      className="min-h-screen flex flex-col justify-self-center w-full max-w-md mx-auto pb-20"
      style={{ backgroundColor: "#F8F7F4", color: "#1A1C1E" }}
    >
      <header
        className="flex justify-between items-center px-margin-mobile h-16 w-full border-b"
        style={{ borderColor: "rgba(26,28,30,0.08)" }}
      >
        <div className="flex flex-col">
          <span className="text-headline-sm font-bold">Soteria</span>
          <span className="text-body-md opacity-70">Friday, 6 June</span>
        </div>
        <PrivacyPill />
      </header>

      <main className="flex-1 flex flex-col px-margin-mobile py-lg gap-xl">
        <section className="flex flex-col gap-sm mt-md">
          <h1 className="text-display-sm font-bold tracking-tight">
            Good morning, Margaret.
          </h1>
          <p className="text-headline-sm opacity-70">I'm here if you need me.</p>
        </section>

        <section className="flex flex-col gap-gutter">
          <Card icon="cloud" label="Local Conditions" value="18° and overcast" />
          <Card icon="medication" label="Upcoming Schedule" value="Pharmacy at 2pm" />
          <Card icon="group" label="Network Status" value="3 connected" />
        </section>

        <div className="flex-1" />

        <div className="flex flex-col items-center justify-center pb-lg">
          <Link
            to="/resident/check-in"
            className="w-full rounded-full h-24 px-8 flex flex-col items-center justify-center gap-xs border transition-colors"
            style={{
              backgroundColor: "#1A1C1E",
              color: "#F8F7F4",
              borderColor: "rgba(26,28,30,0.2)",
            }}
          >
            <span className="text-display-sm font-bold">I need help</span>
            <span className="text-body-md opacity-80">Hold for emergency call</span>
          </Link>
        </div>
      </main>
      <ResidentNav active="/resident" />
    </div>
  );
}

function Card({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-xl p-lg flex items-center gap-md border"
      style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(26,28,30,0.08)" }}
    >
      <div
        className="h-14 w-14 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#EFEDE7" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#1A1C1E" }}>
          {icon}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-label-caps uppercase opacity-60">{label}</span>
        <span className="text-headline-sm mt-xs">{value}</span>
      </div>
    </div>
  );
}