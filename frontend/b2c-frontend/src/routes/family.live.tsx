import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FamilyNav } from "@/components/soteria/FamilyNav";
import { PrivacyPill } from "@/components/soteria/PrivacyPill";

// The backend (FastAPI) serves the live camera as an MJPEG stream. We can't
// hardcode "localhost" because that resolves to the *viewing device* — when
// the trusted contact opens this page on their phone, "localhost" is their
// phone, not the backend host. Instead we derive the host from
// window.location.hostname so the page always points back at whatever
// machine served the dashboard. Override with VITE_BACKEND_URL if the
// backend lives elsewhere.
const BACKEND_PORT = 8000;

export const Route = createFileRoute("/family/live")({
  head: () => ({
    meta: [
      { title: "Soteria — Live feed" },
      {
        name: "description",
        content:
          "Live on-device camera feed for Margaret with real-time fall detection overlays.",
      },
    ],
  }),
  component: FamilyLive,
});

function FamilyLive() {
  const [offline, setOffline] = useState(false);
  // Resolved on the client only: SSR can't know the browser's hostname, and
  // hardcoding one would break either localhost dev or LAN-from-phone access.
  // Until the URL is set, the <img> isn't rendered — no broken-image icon.
  const [videoUrl, setVideoUrl] = useState<string>("");

  useEffect(() => {
    const override = (import.meta as { env?: { VITE_BACKEND_URL?: string } }).env?.VITE_BACKEND_URL;
    if (override) {
      setVideoUrl(`${override.replace(/\/$/, "")}/video`);
      return;
    }
    setVideoUrl(`${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}/video`);
  }, []);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex justify-center">
      <div className="w-full max-w-md flex flex-col pb-24">
        <header className="flex flex-col items-center pt-xl pb-md px-margin-mobile border-b border-outline-variant bg-surface-dim">
          <div className="flex items-center justify-between w-full mb-md">
            <div className="w-8" />
            <div className="text-center flex-1">
              <h1 className="text-headline-md font-bold tracking-tight">Live Feed</h1>
              <p className="text-body-md text-on-surface-variant mt-xs">
                Margaret · Lounge camera
              </p>
            </div>
            <div className="w-8" />
          </div>
          <PrivacyPill label="On-device — raw video never leaves the home" />
        </header>

        <main className="flex-1 px-margin-mobile py-lg flex flex-col gap-lg">
          <section className="rounded-xl overflow-hidden bg-surface-container border border-outline-variant/50">
            <div className="aspect-video relative bg-black flex items-center justify-center">
              {!offline && videoUrl ? (
                <img
                  src={videoUrl}
                  alt="Live camera feed"
                  className="w-full h-full object-contain"
                  onError={() => setOffline(true)}
                />
              ) : !offline ? (
                <div className="text-on-surface-variant text-body-md">Connecting…</div>
              ) : (
                <div className="flex flex-col items-center gap-sm text-on-surface-variant px-lg text-center">
                  <span className="material-symbols-outlined" style={{ fontSize: 48 }}>
                    videocam_off
                  </span>
                  <p className="text-body-md">
                    Camera feed unavailable. Start the backend on this machine:
                  </p>
                  <code className="text-label-caps bg-surface-container-high rounded px-sm py-xs">
                    uvicorn app.main:app --port 8000
                  </code>
                  <button
                    onClick={() => setOffline(false)}
                    className="mt-sm text-label-caps uppercase text-tertiary-fixed-dim underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!offline && (
                <div
                  className="absolute top-sm left-sm rounded-full flex items-center gap-xs px-sm py-xs z-20"
                  style={{ backgroundColor: "#3A1212", color: "#FF6B6B" }}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span className="text-privacy-pill uppercase">Live</span>
                </div>
              )}
            </div>
            <div className="p-sm bg-surface-container border-t border-outline-variant/50">
              <p className="text-label-caps uppercase text-on-surface-variant text-center">
                Pose keypoints + fall confidence are computed locally
              </p>
            </div>
          </section>
        </main>

        <FamilyNav active="/family/live" />
      </div>
    </div>
  );
}
