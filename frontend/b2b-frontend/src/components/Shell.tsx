import { Link, useRouterState } from "@tanstack/react-router";
import { Icon } from "./Icon";
import { useState, type ReactNode } from "react";
import { useApp, ESTATES, INCIDENTS } from "@/lib/app-context";

export function Shell({ children, breadcrumb }: { children: ReactNode; breadcrumb: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { estate, setEstate, lang, setLang, t } = useApp();
  const [estateOpen, setEstateOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const isEstate = estate === "all";
  const currentEstate = ESTATES.find((e) => e.id === estate)!;
  const activeIncidents = INCIDENTS.filter((i) => i.level === "active");

  const navItems = [
    { to: "/", label: t("nav.overview"), icon: "dashboard" },
    { to: "/clusters", label: t("nav.clusters"), icon: "videocam" },
    { to: "/incidents/perimeter", label: t("nav.incidents"), icon: "warning", badge: String(activeIncidents.length) },
    { to: "/events/package", label: t("nav.packages"), icon: "inventory_2" },
    { to: "/access", label: t("nav.access"), icon: "directions_car" },
    ...(isEstate ? [{ to: "/perimeter", label: t("nav.perimeter"), icon: "fence" }] : []),
  ] as const;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-on-surface">
      <header className="bg-surface-dim border-b border-outline-variant flex justify-between items-center px-10 h-20 w-full shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 relative">
            <Icon name="shield_person" className="text-tertiary-fixed-dim" size={28} fill />
            <span className="text-[28px] font-bold tracking-tight text-on-surface leading-none">
              Soteria
            </span>
            <button
              onClick={() => setEstateOpen((o) => !o)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant ml-3"
            >
              <span className="text-[12px] font-bold tracking-wider text-primary uppercase">
                {lang === "zh" ? currentEstate.labelZh : currentEstate.label}
              </span>
              <Icon name="expand_more" size={16} className="text-on-surface-variant" />
            </button>
            {estateOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setEstateOpen(false)} />
                <div className="absolute top-full left-[180px] mt-2 w-64 bg-surface-container border border-outline-variant rounded-lg shadow-2xl z-50 overflow-hidden">
                  {ESTATES.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setEstate(e.id);
                        setEstateOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-surface-container-high transition-colors flex items-center justify-between ${
                        e.id === estate ? "bg-surface-container-high" : ""
                      }`}
                    >
                      <span>
                        <div className="text-[13px] font-bold text-on-surface">
                          {lang === "zh" ? e.labelZh : e.label}
                        </div>
                        <div className="text-[11px] text-on-surface-variant">{e.sub}</div>
                      </span>
                      {e.id === estate && (
                        <Icon name="check" size={16} className="text-tertiary-fixed-dim" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="w-px h-6 bg-outline-variant" />
          <div className="flex items-center gap-1 text-on-surface-variant text-sm">
            <span>{t("header.console")}</span>
            <span className="opacity-50 mx-1">•</span>
            <span className="text-on-surface font-medium">{breadcrumb}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="flex items-center gap-1 px-2 py-1 text-on-surface-variant hover:text-on-surface transition-colors text-[12px] font-bold tracking-wider"
            title="Toggle language"
          >
            <span className={lang === "en" ? "text-tertiary-fixed-dim" : ""}>EN</span>
            <span className="opacity-50">/</span>
            <span className={lang === "zh" ? "text-tertiary-fixed-dim" : ""}>中文</span>
          </button>
          <div className="flex items-center gap-2 bg-[#16321F] text-[#4ADE80] px-3 py-1.5 rounded-full border border-[#4ADE80]/20">
            <Icon name="lock" size={14} />
            <span className="text-[11px] font-extrabold tracking-wide whitespace-nowrap">
              {t("header.onprem")}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-tertiary transition-colors relative"
            >
              <Icon name="notifications" />
              {activeIncidents.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error" />
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-[360px] bg-surface-container border border-outline-variant rounded-lg shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant flex justify-between items-center">
                    <h3 className="font-bold text-on-surface">{t("notif.title")}</h3>
                    <Link
                      to="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-[11px] font-bold tracking-wider text-tertiary-fixed-dim uppercase hover:text-tertiary-fixed"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto divide-y divide-outline-variant">
                    {INCIDENTS.map((i) => (
                      <div key={i.id} className="px-4 py-3 hover:bg-surface-container-high">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              i.level === "active"
                                ? "bg-error-container text-error"
                                : "bg-surface-variant text-on-surface-variant"
                            }`}
                          >
                            {i.level === "active" ? t("notif.active") : t("notif.resolved")}
                          </span>
                          <span className="text-[11px] text-on-surface-variant ml-auto">{i.time}</span>
                        </div>
                        <div className="text-sm text-on-surface font-medium">
                          {lang === "zh" ? i.titleZh : i.title}
                        </div>
                        <div className="text-[12px] text-on-surface-variant">{i.loc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <button className="w-10 h-10 rounded-full border border-outline-variant hover:border-tertiary-fixed-dim transition-colors flex items-center justify-center bg-surface-container">
            <Icon name="account_circle" className="text-on-surface-variant" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="bg-surface-dim border-r border-outline-variant w-64 flex flex-col h-full py-6 shrink-0">
          <div className="px-4 mb-4">
            <h2 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
              {t("nav.views")}
            </h2>
          </div>
          <ul className="flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? "bg-surface-container-high text-tertiary-fixed-dim font-bold border-l-2 border-tertiary-fixed-dim"
                        : "text-on-surface-variant font-medium hover:bg-surface-container-high hover:text-on-surface"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon name={item.icon} size={20} fill={active} />
                      <span className="text-sm">{item.label}</span>
                    </span>
                    {"badge" in item && item.badge && item.badge !== "0" && (
                      <span className="bg-surface-variant text-on-surface px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
            <div className="my-4 border-t border-outline-variant mx-2" />
            <div className="px-2 mb-2">
              <h2 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                {t("nav.modules")}
              </h2>
            </div>
            <li>
              <Link
                to="/elderly"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  pathname === "/elderly"
                    ? "bg-surface-container-high text-tertiary-fixed-dim font-bold border-l-2 border-tertiary-fixed-dim"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <Icon name="elderly" size={20} />
                <span>{t("nav.elderly")}</span>
              </Link>
            </li>
          </ul>
          <div className="px-2 mt-auto">
            <a className="flex items-center gap-2 px-3 py-2 rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors text-sm" href="#">
              <Icon name="settings" size={20} />
              <span>Settings</span>
            </a>
          </div>
        </nav>

        <main className="flex-1 flex flex-col h-full bg-background overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 bg-primary-fixed text-[#191c20] font-bold text-[12px] uppercase tracking-wider px-5 py-3 rounded-full hover:bg-white transition-colors",
  secondary:
    "inline-flex items-center justify-center gap-2 bg-surface-container border border-outline-variant text-on-surface font-bold text-[12px] uppercase tracking-wider px-5 py-3 rounded-full hover:bg-surface-container-high transition-colors",
  danger:
    "inline-flex items-center justify-center gap-2 bg-error text-on-error font-bold text-[14px] uppercase tracking-wider px-6 py-3.5 rounded-full hover:opacity-90 transition-opacity",
  ghost:
    "inline-flex items-center justify-center gap-2 text-tertiary-fixed-dim hover:text-tertiary-fixed font-bold text-[12px] uppercase tracking-wider transition-colors",
};

/** No-op kept for backwards-compat with old imports. */
export function PrivacyStrip() {
  return null;
}
