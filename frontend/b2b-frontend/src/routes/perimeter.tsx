import { createFileRoute } from "@tanstack/react-router";
import { Shell, btn } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { useApp, PERIMETER_FEEDS, INCIDENTS } from "@/lib/app-context";

export const Route = createFileRoute("/perimeter")({
  head: () => ({ meta: [{ title: "Soteria — Perimeter" }] }),
  component: Perimeter,
});

function Perimeter() {
  const { lang, t, estate } = useApp();

  if (estate !== "all") {
    return (
      <Shell breadcrumb={t("nav.perimeter")}>
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="max-w-md text-center bg-surface-container border border-outline-variant rounded-xl p-8 flex flex-col items-center gap-3">
            <Icon name="fence" size={48} className="text-on-surface-variant" />
            <h2 className="text-[22px] font-semibold text-on-surface">{t("peri.title")}</h2>
            <p className="text-sm text-on-surface-variant">{t("peri.estateOnly")}</p>
          </div>
        </div>
      </Shell>
    );
  }

  const alerts = INCIDENTS.filter((i) => /perimeter|wall/i.test(i.title));

  return (
    <Shell breadcrumb={t("nav.perimeter")}>
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          <div className="border-b border-outline-variant pb-6">
            <h1 className="text-[40px] font-bold tracking-tight text-on-surface mb-2 leading-tight">
              {t("peri.title")}
            </h1>
            <p className="text-base text-on-surface-variant">{t("peri.sub")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PERIMETER_FEEDS.map((f) => (
              <div
                key={f.id}
                className={`bg-surface-container rounded-xl border overflow-hidden flex flex-col ${
                  f.status === "alert" ? "border-error" : "border-outline-variant"
                }`}
              >
                <div
                  className="relative w-full aspect-video bg-cover bg-center"
                  style={{ backgroundImage: `url('${f.img}')` }}
                >
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="bg-black/60 text-white text-[10px] font-bold tracking-wider px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                      LIVE
                    </span>
                    <span className="bg-black/60 text-white text-[10px] font-bold tracking-wider px-2 py-1 rounded backdrop-blur-sm">
                      {f.cam}
                    </span>
                  </div>
                  {f.status === "alert" && (
                    <div className="absolute bottom-3 left-3 right-3 bg-error-container border border-error text-error px-3 py-2 rounded-lg flex items-center gap-2 text-[12px] font-bold tracking-wider">
                      <Icon name="warning" size={16} fill />
                      {lang === "zh" ? f.noteZh : f.note}
                    </div>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-on-surface">{lang === "zh" ? f.zoneZh : f.zone}</div>
                    <div className="text-[12px] text-on-surface-variant">
                      {f.status === "ok" ? (lang === "zh" ? f.noteZh : f.note) : "Active alert"}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      f.status === "alert"
                        ? "bg-error-container text-error"
                        : "bg-tertiary-container text-tertiary-fixed-dim"
                    }`}
                  >
                    {f.status === "alert" ? "Alert" : "Clear"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {alerts.length > 0 && (
            <div className="bg-surface-container border border-outline-variant rounded-xl p-6">
              <h3 className="text-[20px] font-semibold text-on-surface mb-4 flex items-center gap-2">
                <Icon name="campaign" /> Perimeter alerts
              </h3>
              <ul className="flex flex-col gap-3">
                {alerts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between border border-outline-variant rounded-lg p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-on-surface">
                        {lang === "zh" ? a.titleZh : a.title}
                      </div>
                      <div className="text-[12px] text-on-surface-variant">
                        {a.loc} · {a.time}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        a.level === "active"
                          ? "bg-error-container text-error"
                          : "bg-surface-variant text-on-surface-variant"
                      }`}
                    >
                      {a.level}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
