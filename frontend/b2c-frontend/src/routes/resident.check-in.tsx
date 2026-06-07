import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PrivacyPill } from "@/components/soteria/PrivacyPill";
import { ResidentNav } from "@/components/soteria/ResidentNav";

export const Route = createFileRoute("/resident/check-in")({
  head: () => ({
    meta: [
      { title: "Soteria — Check-in" },
      {
        name: "description",
        content:
          "Calm fall check-in with a 20-second countdown before a trusted contact is told.",
      },
    ],
  }),
  component: ResidentCheckIn,
});

function ResidentCheckIn() {
  const [timeLeft, setTimeLeft] = useState(20);
  const navigate = useNavigate();

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const danger = timeLeft <= 5;

  return (
    <div
      className="min-h-screen flex flex-col w-full max-w-md mx-auto pb-20"
      style={{ backgroundColor: "#F8F7F4", color: "#1A1C1E" }}
    >
      <header className="flex items-center justify-between px-margin-mobile h-16 w-full">
        <span className="text-label-caps uppercase opacity-60">Soteria check-in</span>
        <PrivacyPill label="On this device" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile gap-lg text-center">
        <h1 className="text-display-sm font-bold leading-tight">
          I think you may have fallen. Are you alright?
        </h1>

        <div
          className={
            "rounded-full w-48 h-48 flex items-center justify-center border-4 timer-active"
          }
          style={{
            backgroundColor: danger
              ? "rgba(248,113,113,0.1)"
              : "rgba(77,224,130,0.1)",
            borderColor: danger
              ? "rgba(248,113,113,0.5)"
              : "rgba(77,224,130,0.35)",
          }}
        >
          <span
            className="huge-numeral"
            style={{ color: danger ? "#F87171" : "#1A1C1E" }}
          >
            {Math.max(timeLeft, 0)}
          </span>
        </div>

        <p className="text-headline-sm opacity-70 max-w-md">
          I'll alert your trusted contact if you don't respond.
        </p>

        <div className="flex flex-col gap-sm w-full max-w-md mt-lg">
          <button
            onClick={() => navigate({ to: "/resident" })}
            className="h-16 rounded-full text-headline-md font-semibold active:scale-95 transition-transform"
            style={{ backgroundColor: "#4ADE80", color: "#00210c" }}
          >
            I'm OK
          </button>
          <Link
            to="/resident/notified"
            className="h-16 rounded-full text-headline-md font-semibold flex items-center justify-center border-2 active:scale-95 transition-transform"
            style={{ borderColor: "#F87171", color: "#F87171" }}
          >
            Send help now
          </Link>
        </div>
      </main>

      <footer
        className="mt-auto px-margin-mobile py-lg border-t text-center"
        style={{ borderColor: "rgba(26,28,30,0.1)" }}
      >
        <p className="text-body-md opacity-70">
          If you need help and can't move, stay where you are — your trusted contact will
          be told.
        </p>
      </footer>
      <ResidentNav active="/resident/check-in" />
    </div>
  );
}