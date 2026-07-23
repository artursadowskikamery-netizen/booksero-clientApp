import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { useTranslation } from "react-i18next";
import { queryClient } from "./lib/queryClient";
import { isLoggedIn } from "./lib/auth";
import { pushSupported, ensurePushSubscribed, sendInstallSignalOnce } from "./lib/push";
import Landing from "./pages/Landing";
import TenantSelect from "./pages/TenantSelect";
import SalonHome from "./pages/SalonHome";
import Booking from "./pages/Booking";
import Soon from "./pages/Soon";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Visits from "./pages/Visits";
import Rewards from "./pages/Rewards";
import ReferralLink from "./pages/ReferralLink";
import SlugRedirect from "./pages/SlugRedirect";

// Przy starcie (zalogowany klient): raz wyślij sygnał instalacji (standalone)
// i po cichu odśwież subskrypcję push, jeśli zgoda już jest (upsert — idempotentne).
function PushBootstrap() {
  useEffect(() => {
    if (!isLoggedIn()) return;
    sendInstallSignalOnce();
    if (pushSupported() && Notification.permission === "granted") {
      ensurePushSubscribed().catch(() => {});
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PushBootstrap />
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/r/:code" component={ReferralLink} />
        <Route path="/t/:tenantId" component={TenantSelect} />
        <Route path="/salon/:salonId/book" component={Booking} />
        <Route path="/salon/:salonId/soon" component={Soon} />
        <Route path="/salon/:salonId/login" component={Login} />
        <Route path="/salon/:salonId/profile" component={Profile} />
        <Route path="/salon/:salonId/visits" component={Visits} />
        <Route path="/salon/:salonId/rewards" component={Rewards} />
        <Route path="/salon/:salonId" component={SalonHome} />
        {/* Krótki adres salonu (ten sam slug co wizytówka) — MUSI być tuż przed
            NotFound, żeby nie przechwycił tras /r /t /salon powyżej. */}
        <Route path="/:slug" component={SlugRedirect} />
        <Route component={NotFound} />
      </Switch>
    </QueryClientProvider>
  );
}

function NotFound() {
  const { t } = useTranslation();
  return <div className="p-6 text-muted">{t("common.pageNotFound")}</div>;
}
