import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import jsQR from "jsqr";

// Pełnoekranowy skaner QR (aparat tylny). Dekodowanie przez jsQR na canvasie —
// działa wszędzie, także na iOS, gdzie natywny BarcodeDetector nie istnieje.
// Wymaga HTTPS (dostęp do aparatu) — wersja publikowana je ma.
export default function QrScanner({
  onResult,
  onClose,
}: {
  onResult: (text: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const tick = () => {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState >= video.HAVE_ENOUGH_DATA && ctx) {
        // Skanujemy pomniejszoną klatkę — szybciej, a QR i tak się dekoduje.
        const w = 480;
        const h = Math.round((video.videoHeight / Math.max(video.videoWidth, 1)) * w) || 480;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);
        const img = ctx.getImageData(0, 0, w, h);
        const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
        if (code?.data) {
          stopped = true;
          stream?.getTracks().forEach((t) => t.stop());
          onResult(code.data);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          video.play().catch(() => {});
        }
        raf = requestAnimationFrame(tick);
      })
      .catch(() => setDenied(true));

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="text-white font-bold">{t("landing.qr")}</div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-white/10 text-white grid place-items-center"
          aria-label={t("common.back")}
        >
          <X size={18} />
        </button>
      </div>

      {!denied ? (
        <div className="relative flex-1 overflow-hidden">
          <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          {/* Ramka celownika */}
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="w-60 h-60 rounded-2xl border-2 border-white/80" />
          </div>
          <p className="absolute bottom-8 inset-x-0 text-center text-white/90 text-sm px-6">
            {t("qr.hint")}
          </p>
        </div>
      ) : (
        <div className="flex-1 grid place-items-center p-8">
          <p className="text-white/90 text-sm text-center">{t("qr.denied")}</p>
        </div>
      )}
    </div>
  );
}
