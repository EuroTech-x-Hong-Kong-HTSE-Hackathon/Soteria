import { Link } from "@tanstack/react-router";

type Tab = { to: string; icon: string; label: string };

const TABS: Tab[] = [
  { to: "/resident", icon: "home_filled", label: "Home" },
  { to: "/resident/check-in", icon: "health_and_safety", label: "Check-in" },
  { to: "/resident/notified", icon: "monitor_heart", label: "Status" },
  { to: "/resident/support", icon: "help", label: "Support" },
];

export function ResidentNav({ active }: { active: Tab["to"] }) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex justify-around items-center h-16 px-sm border-t"
      style={{ backgroundColor: "#F8F7F4", borderColor: "rgba(26,28,30,0.1)" }}
    >
      {TABS.map((t) => {
        const isActive = t.to === active;
        return (
          <Link
            key={t.to}
            to={t.to}
            className="flex flex-col items-center justify-center gap-1 w-20 h-full active:scale-95 transition-transform"
            style={{ color: isActive ? "#1A1C1E" : "rgba(26,28,30,0.55)" }}
          >
            <span className={"material-symbols-outlined " + (isActive ? "icon-fill" : "")}>
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