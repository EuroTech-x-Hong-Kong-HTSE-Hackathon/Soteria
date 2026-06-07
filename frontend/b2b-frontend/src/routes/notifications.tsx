import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { useApp, INCIDENTS } from "@/lib/app-context";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Soteria — Notifications" }] }),
  component: Notifications,
});

function Notifications() {
  const { lang, t } = useApp();
  const active = INCIDENTS.filter((i) => i.level === "active");
  const resolved = INCIDENTS.filter((i) => i.level === "resolved");

  const Section = ({ title, items, tone }: { title: string; items: typeof INCIDENTS; tone: "active" | "resolved" }) => (
    <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
      <div className="px-6 py-3 bg-surface-container-high border-b border-outline-variant flex items-center justify-between">
        <h2 className="text-[14px] font-bold uppercase tracking-wider text-on-surface">{title}</h2>
        <span className="text-[12px] font-bold tabular-nums text-on-surface-variant">{items.length}</span>
      </div>
      <ul className="divide-y divide-outline-variant">
        {items.map((i) => (
          <li key={i.id} className="px-6 py-4 flex items-start gap-4 hover:bg-surface-container-high transition-colors">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                tone === "active" ? "bg-error-container text-error" : "bg-surface-variant text-on-surface-variant"
              }`}
            >
              <Icon name={tone === "active" ? "warning" : "check_circle"} size={18} fill={tone === "active"} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-on-surface">{lang === "zh" ? i.titleZh : i.title}</div>
              <div className="text-[12px] text-on-surface-variant">{i.loc}</div>
            </div>
            <span className="text-[12px] text-on-surface-variant tabular-nums shrink-0">{i.time}</span>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-6 py-8 text-center text-sm text-on-surface-variant italic">None</li>
        )}
      </ul>
    </div>
  );

  return (
    <Shell breadcrumb={t("nav.notifications")}>
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <div className="border-b border-outline-variant pb-6">
            <h1 className="text-[40px] font-bold tracking-tight text-on-surface mb-2 leading-tight">
              {t("notif.title")}
            </h1>
          </div>
          <Section title={t("notif.active")} items={active} tone="active" />
          <Section title={t("notif.resolved")} items={resolved} tone="resolved" />
        </div>
      </div>
    </Shell>
  );
}
