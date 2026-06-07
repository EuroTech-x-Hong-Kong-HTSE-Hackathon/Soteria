import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { useApp, VEHICLES } from "@/lib/app-context";

export const Route = createFileRoute("/access")({
  head: () => ({
    meta: [{ title: "Soteria — Access & Vehicles" }],
  }),
  component: Access,
});

function Access() {
  const { lang, t } = useApp();

  return (
    <Shell breadcrumb={t("nav.access")}>
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div className="border-b border-outline-variant pb-6">
            <h1 className="text-[40px] font-bold tracking-tight text-on-surface mb-2 leading-tight">
              {t("access.title")}
            </h1>
            <p className="text-base text-on-surface-variant">{t("access.sub")}</p>
          </div>

          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-outline-variant" />
            <ul className="flex flex-col gap-4">
              {VEHICLES.map((v) => (
                <li
                  key={v.id}
                  className="relative pl-14 bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row gap-4"
                >
                  <div
                    className={`absolute left-2 top-5 w-9 h-9 rounded-full flex items-center justify-center border-2 z-10 ${
                      v.direction === "in"
                        ? "bg-tertiary-container border-tertiary-fixed-dim text-tertiary-fixed-dim"
                        : "bg-surface-variant border-outline-variant text-on-surface"
                    }`}
                  >
                    <Icon name={v.direction === "in" ? "login" : "logout"} size={18} />
                  </div>
                  <div
                    className="w-full md:w-48 aspect-video rounded-lg bg-cover bg-center border border-outline-variant relative overflow-hidden shrink-0"
                    style={{ backgroundImage: `url('${v.img}')` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                        ▶ CLIP
                      </span>
                      <span className="text-[10px] font-bold tracking-wider text-white tabular-nums bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                        {v.time}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-1 justify-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-wider tabular-nums text-on-surface-variant">
                        {v.time}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          v.direction === "in"
                            ? "bg-tertiary-container text-tertiary-fixed-dim"
                            : "bg-surface-variant text-on-surface"
                        }`}
                      >
                        {v.direction === "in" ? t("access.in") : t("access.out")}
                      </span>
                    </div>
                    <div className="text-[18px] font-semibold text-on-surface tabular-nums">{v.plate}</div>
                    <div className="text-sm text-on-surface-variant">{lang === "zh" ? v.whoZh : v.who}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Shell>
  );
}
