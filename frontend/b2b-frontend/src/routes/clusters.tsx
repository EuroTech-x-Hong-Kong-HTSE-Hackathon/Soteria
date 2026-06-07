import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell, btn } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { useApp, localizeCluster, localizeFn, type Cluster } from "@/lib/app-context";

export const Route = createFileRoute("/clusters")({
  head: () => ({
    meta: [
      { title: "Soteria — Camera Clusters" },
      { name: "description", content: "Assign security functions and cameras to each cluster." },
    ],
  }),
  component: Clusters,
});

function Clusters() {
  const { visibleClusters, setClusters, lang, t, estate } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Cluster | null>(null);

  // Reset editing when estate changes so the drawer doesn't hold a stale cluster.
  useEffect(() => {
    setEditingId(null);
    setDraft(null);
  }, [estate]);

  function openEdit(id: string) {
    const c = visibleClusters.find((x) => x.id === id) ?? null;
    setEditingId(id);
    setDraft(
      c
        ? {
            ...c,
            functions: c.functions.map((f) => ({ ...f })),
            cameras: c.cameras.map((cam) => ({ ...cam })),
          }
        : null,
    );
  }
  function toggleFn(fid: string) {
    if (!draft) return;
    setDraft({
      ...draft,
      functions: draft.functions.map((f) => (f.id === fid ? { ...f, active: !f.active } : f)),
    });
  }
  function toggleCam(cid: string) {
    if (!draft) return;
    setDraft({
      ...draft,
      cameras: draft.cameras.map((c) => (c.id === cid ? { ...c, active: !c.active } : c)),
    });
  }
  function save() {
    if (!draft) return;
    setClusters((cs) => cs.map((c) => (c.id === draft.id ? draft : c)));
    setEditingId(null);
    setDraft(null);
  }
  function cancel() {
    setEditingId(null);
    setDraft(null);
  }
  function addCluster() {
    const id = `c${Date.now()}`;
    const fresh: Cluster = {
      id,
      name: "New Cluster",
      nameZh: "新集群",
      sub: "Unassigned • 0 cams",
      scope: estate,
      functions: [
        { id: "loi", label: "Loitering", labelZh: "徘徊检测", active: false },
        { id: "mot", label: "Motion detection", labelZh: "动作检测", active: false },
      ],
      cameras: [],
    };
    setClusters((cs) => [...cs, fresh]);
    openEdit(id);
  }

  return (
    <Shell breadcrumb={t("nav.clusters")}>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant pb-6">
              <div>
                <h1 className="text-[40px] font-bold tracking-tight text-on-surface mb-2 leading-tight">
                  {t("clusters.title")}
                </h1>
                <p className="text-base text-on-surface-variant max-w-2xl">{t("clusters.subtitle")}</p>
              </div>
              <button onClick={addCluster} className={btn.primary}>
                <Icon name="add" size={18} />
                {t("btn.create")}
              </button>
            </div>

            {visibleClusters.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant p-10 text-center text-on-surface-variant">
                {t("clusters.empty")}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {visibleClusters.map((c) => {
                  const editing = editingId === c.id;
                  const activeFns = c.functions.filter((f) => f.active);
                  const activeCams = c.cameras.filter((cam) => cam.active).length;
                  return (
                    <div
                      key={c.id}
                      className={`rounded-xl border p-6 flex flex-col gap-4 relative overflow-hidden ${
                        editing
                          ? "bg-surface-container-high border-tertiary-fixed-dim"
                          : "bg-surface-container border-outline-variant"
                      }`}
                    >
                      {editing && <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary-fixed-dim" />}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-[22px] font-semibold text-on-surface">{localizeCluster(c, lang)}</h3>
                          <p className="text-sm text-on-surface-variant">
                            {c.sub} · {activeCams}/{c.cameras.length} cams on
                          </p>
                        </div>
                        <div className="flex items-center gap-1 bg-surface-container-highest px-2 py-1 rounded-full border border-outline-variant">
                          <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
                          <span className="text-[12px] font-bold tracking-wider text-on-surface">
                            {t("clusters.active")}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeFns.length === 0 && (
                          <span className="text-[12px] text-on-surface-variant italic">{t("clusters.noFn")}</span>
                        )}
                        {activeFns.map((f) => (
                          <span
                            key={f.id}
                            className="px-2 py-1 border border-tertiary-fixed-dim/30 rounded-md text-[12px] font-bold tracking-wider text-tertiary-fixed-dim bg-tertiary-container"
                          >
                            {localizeFn(f, lang)}
                          </span>
                        ))}
                      </div>
                      <div className="mt-auto pt-4 flex justify-end border-t border-outline-variant">
                        <button onClick={() => openEdit(c.id)} className={btn.ghost}>
                          {editing ? t("btn.editing") : t("btn.edit")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {draft && editingId && (
          <aside className="w-[380px] shrink-0 bg-surface-container border-l border-outline-variant flex flex-col h-full">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
              <h2 className="text-[20px] font-semibold text-on-surface">{t("btn.edit")}</h2>
              <button onClick={cancel} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <Icon name="close" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
              <div>
                <div className="text-[12px] font-bold tracking-wider text-on-surface-variant mb-1 uppercase">
                  {t("clusters.target")}
                </div>
                <div className="text-[22px] font-semibold text-on-surface">{localizeCluster(draft, lang)}</div>
                <div className="text-sm text-on-surface-variant">{draft.sub}</div>
              </div>
              <div className="h-px bg-outline-variant w-full" />
              <div className="flex flex-col gap-3">
                <div className="text-[12px] font-bold tracking-wider text-on-surface uppercase mb-1">
                  {t("clusters.fns")}
                </div>
                {draft.functions.map((f) => (
                  <label
                    key={f.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${
                      f.active ? "border-outline-variant bg-surface-dim" : "border-transparent hover:bg-surface-container-high"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={f.active}
                      onChange={() => toggleFn(f.id)}
                      className="w-4 h-4 rounded accent-tertiary-fixed-dim"
                    />
                    <span className={`text-sm ${f.active ? "text-on-surface" : "text-on-surface-variant"}`}>
                      {localizeFn(f, lang)}
                    </span>
                  </label>
                ))}
              </div>
              <div className="h-px bg-outline-variant w-full" />
              <div className="flex flex-col gap-2">
                <div className="text-[12px] font-bold tracking-wider text-on-surface uppercase mb-1">
                  {t("clusters.cams")}
                </div>
                {draft.cameras.length === 0 && (
                  <div className="text-[12px] italic text-on-surface-variant">No cameras yet.</div>
                )}
                {draft.cameras.map((cam) => (
                  <label
                    key={cam.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${
                      cam.active ? "border-outline-variant bg-surface-dim" : "border-transparent hover:bg-surface-container-high"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={cam.active}
                      onChange={() => toggleCam(cam.id)}
                      className="w-4 h-4 rounded accent-tertiary-fixed-dim"
                    />
                    <Icon name="videocam" size={16} className={cam.active ? "text-tertiary-fixed-dim" : "text-on-surface-variant"} />
                    <span className={`text-sm ${cam.active ? "text-on-surface" : "text-on-surface-variant"}`}>
                      {cam.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant bg-surface-container-high flex gap-3">
              <button onClick={cancel} className={`${btn.secondary} flex-1`}>
                {t("btn.cancel")}
              </button>
              <button onClick={save} className={`${btn.primary} flex-1`}>
                {t("btn.save")}
              </button>
            </div>
          </aside>
        )}
      </div>
    </Shell>
  );
}
