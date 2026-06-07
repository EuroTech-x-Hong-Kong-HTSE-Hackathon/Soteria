import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soteria — Sign in" },
      {
        name: "description",
        content:
          "Sign in to Soteria as a trusted adult or as the person at home.",
      },
    ],
  }),
  component: Login,
});

type Role = "family" | "resident";

function Login() {
  const [role, setRole] = useState<Role>("family");

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="w-full max-w-md mx-auto flex flex-col px-margin-mobile pt-xl pb-xl">
        <div className="flex items-center gap-xs justify-center mb-xl mt-lg">
          <span
            className="material-symbols-outlined icon-fill text-tertiary-fixed-dim"
            style={{ fontSize: 28 }}
          >
            shield_person
          </span>
          <span className="text-display-sm font-bold tracking-tight">Soteria</span>
        </div>

        <h1 className="text-headline-md font-semibold mb-xs">Welcome back</h1>
        <p className="text-body-md text-on-surface-variant mb-lg">
          Choose how you're signing in today.
        </p>

        <div className="grid grid-cols-2 gap-sm mb-lg">
          <RoleCard
            active={role === "family"}
            onClick={() => setRole("family")}
            icon="supervisor_account"
            title="Trusted adult"
            sub="Sarah"
          />
          <RoleCard
            active={role === "resident"}
            onClick={() => setRole("resident")}
            icon="elderly"
            title="Person at home"
            sub="Margaret"
          />
        </div>

        <label className="text-label-caps uppercase text-on-surface-variant mb-xs">
          Email
        </label>
        <input
          type="email"
          defaultValue={role === "family" ? "sarah@example.com" : "margaret@example.com"}
          key={role}
          className="bg-surface-container border border-outline-variant rounded-lg px-md py-sm text-body-md mb-md focus:outline-none focus:border-tertiary-fixed-dim"
        />
        <label className="text-label-caps uppercase text-on-surface-variant mb-xs">
          Passcode
        </label>
        <input
          type="password"
          defaultValue="••••••"
          className="bg-surface-container border border-outline-variant rounded-lg px-md py-sm text-body-md mb-lg focus:outline-none focus:border-tertiary-fixed-dim"
        />

        <Link
          to={role === "family" ? "/family" : "/resident"}
          className="h-14 rounded-full bg-cta text-on-cta text-headline-sm font-semibold flex items-center justify-center active:scale-95 transition-transform"
        >
          Sign in
        </Link>

        <p className="text-body-md text-on-surface-variant text-center mt-lg">
          Demo · pick a role above to enter that view.
        </p>
      </div>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-xl p-md border flex flex-col items-start gap-xs text-left transition-colors " +
        (active
          ? "bg-surface-container-high border-tertiary-fixed-dim"
          : "bg-surface-container border-outline-variant/40")
      }
    >
      <span
        className={
          "material-symbols-outlined " +
          (active ? "icon-fill text-tertiary-fixed-dim" : "text-on-surface-variant")
        }
        style={{ fontSize: 28 }}
      >
        {icon}
      </span>
      <span className="text-headline-sm">{title}</span>
      <span className="text-label-caps uppercase text-on-surface-variant">{sub}</span>
    </button>
  );
}