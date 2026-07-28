import { useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { loadLastSalon } from "../lib/lastSalon";

// Cel kliknięcia w powiadomienie BEZ odnośnika: service worker nie ma dostępu
// do localStorage, więc otwiera /push-open, a my stąd przenosimy klienta do
// SKRZYNKI ostatnio odwiedzanego salonu (nie na ekran „znajdź salon").
export default function PushOpen() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const salonId = loadLastSalon();
    navigate(salonId ? `/salon/${salonId}/notifications` : "/", { replace: true });
  }, [navigate]);

  return (
    <div className="max-w-md mx-auto min-h-screen grid place-items-center p-6">
      <p className="text-sm text-muted">{t("common.loading")}</p>
    </div>
  );
}
