import { Link } from "@tanstack/react-router";

type Tab = { to: string; icon: string; label: string };

const TABS: Tab[] = [
  { to: "/family", icon: "home_filled", label: "Home" },
  { to: "/family/live", icon: "videocam", label: "Live Feed" },
  { to: "/family/alert", icon: "visibility", label: "Alert" },
  { to: "/family/support", icon: "help", label: "Support" },
];

export function FamilyNav({ active }: { active: Tab["to"] }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-surface-container-lowest border-t border-outline-variant/20 flex justify-around items-center h-16 px-sm">
      {TABS.map((t) => {
        const isActive = t.to === active;
        return (
          <Link
            key={t.to}
            to={t.to}
            className={
              "flex flex-col items-center justify-center gap-1 w-20 h-full active:scale-95 transition-transform " +
              (isActive ? "text-tertiary-fixed-dim" : "text-on-surface-variant")
            }
          >
            <span
              className={"material-symbols-outlined " + (isActive ? "icon-fill" : "")}
            >
              {t.icon}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {t.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}