import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";

// app.booksero.com/<slug> → salon. Ten sam krótki adres, który salon ma na
// wizytówce (panel.booksero.com/<slug>), działa też w aplikacji — QR i linki
// na wizytówce/widgecie mogą celować wprost w salon bez UUID.
const SLUG_RE = /^[a-z0-9-]{3,60}$/;

export default function SlugRedirect() {
  const [, params] = useRoute("/:slug");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!SLUG_RE.test(slug)) {
      setFailed(true);
      return;
    }
    let alive = true;
    api
      .resolveSlug(slug)
      .then(({ salonId }) => {
        if (alive) navigate(`/salon/${salonId}`, { replace: true });
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [slug, navigate]);

  return (
    <div className="max-w-md mx-auto min-h-screen grid place-items-center p-6 text-center">
      {failed ? (
        <div>
          <p className="text-sm text-muted">{t("common.pageNotFound")}</p>
          <button className="btn-primary mt-4" onClick={() => navigate("/", { replace: true })}>
            BookSero
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted">{t("common.loading")}</p>
      )}
    </div>
  );
}
