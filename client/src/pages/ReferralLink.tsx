import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { applyAccent } from "../lib/themes";
import { saveRef } from "../lib/referral";

// Krótki link polecenia /r/:code — rozwiązuje kod na sieć + kod polecającego,
// zapisuje ref i przenosi do wyboru salonu sieci (SPEC-krotki-link-polecenia).
export default function ReferralLink() {
  const [, params] = useRoute("/r/:code");
  const code = params?.code ?? "";
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [err, setErr] = useState(false);

  useEffect(() => {
    applyAccent(null);
    let cancelled = false;
    (async () => {
      try {
        const { tenantId, ref } = await api.resolveReferral(code);
        if (cancelled) return;
        if (ref) saveRef(ref);
        navigate(`/t/${tenantId}`);
      } catch {
        if (!cancelled) setErr(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, navigate]);

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 grid place-items-center text-center">
      {err ? (
        <div className="text-sm text-muted">
          {t("landing.notFound")}
          <button onClick={() => navigate("/")} className="btn-primary mt-4">
            {t("common.back")}
          </button>
        </div>
      ) : (
        <div className="text-muted text-sm">{t("common.loading")}</div>
      )}
    </div>
  );
}
