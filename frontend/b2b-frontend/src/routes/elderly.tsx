import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { useApp, ELDERLY, ESTATES } from "@/lib/app-context";

export const Route = createFileRoute("/elderly")({
  head: () => ({ meta: [{ title: "Soteria — Elderly Safety" }] }),
  component: Elderly,
});

function Elderly() {
  const { lang, t, estate } = useApp();

  const list = ELDERLY.filter((e) => estate === "all" || e.tower === estate);

  const towerLabel = (id: "tower-a" | "tower-b" | "tower-c") => {
    const e = ESTATES.find((x) => x.id === id)!;
    return lang === "zh" ? e.labelZh : e.label;
  };

  return (
    <Shell breadcrumb={t("nav.elderly")}>
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div className="border-b border-outline-variant pb-6">
            <h1 className="text-[40px] font-bold tracking-tight text-on-surface mb-2 leading-tight">
              {t("eld.title")}
            </h1>
            <p className="text-base text-on-surface-variant">{t("eld.sub")}</p>
          </div>

          {list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-variant p-10 text-center text-on-surface-variant">
              {t("eld.empty")}
            </div>
          ) : (
            <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1.4fr_1fr_0.6fr_0.8fr_1.2fr_auto] gap-4 px-6 py-3 bg-surface-container-high border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <div>Resident</div>
                <div>{t("eld.tower")}</div>
                <div>{t("eld.floor")}</div>
                <div>{t("eld.apt")}</div>
                <div>{t("eld.last")}</div>
                <div className="text-right">Status</div>
              </div>
              <ul className="divide-y divide-outline-variant">
                {list.map((e) => (
                  <li
                    key={e.id}
                    className="grid grid-cols-[1.4fr_1fr_0.6fr_0.8fr_1.2fr_auto] gap-4 px-6 py-4 items-center hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center">
                        <Icon name="elderly" size={20} className="text-on-surface" />
                      </div>
                      <span className="text-sm font-semibold text-on-surface">
                        {lang === "zh" ? e.residentZh : e.resident}
                      </span>
                    </div>
                    <div className="text-sm text-on-surface-variant">{towerLabel(e.tower)}</div>
                    <div className="text-sm text-on-surface-variant tabular-nums">{e.floor}</div>
                    <div className="text-sm text-on-surface-variant tabular-nums">{e.apt}</div>
                    <div className="text-sm text-on-surface-variant">
                      {lang === "zh" ? e.lastMotionZh : e.lastMotion}
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                          e.status === "alert"
                            ? "bg-error-container text-error"
                            : e.status === "check"
                              ? "bg-[#4c4942] text-[#cbc6bd]"
                              : "bg-tertiary-container text-tertiary-fixed-dim"
                        }`}
                      >
                        {e.status === "alert" ? "Alert" : e.status === "check" ? "Check" : "OK"}
                      </span>
                    </div>
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
