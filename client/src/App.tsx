import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { useTranslation } from "react-i18next";
import { queryClient } from "./lib/queryClient";
import { isLoggedIn, listSessions, sessionToken } from "./lib/auth";
import { autoRejoinPush, sendInstallSignalOnce } from "./lib/push";
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
import Notifications from "./pages/Notifications";
import PushOpen from "./pages/PushOpen";
import SlugRedirect from "./pages/SlugRedirect";
import InstallBanner from "./components/InstallBanner";
import SalonAccent from "./components/SalonAccent";

// Przy starcie (zalogowany klient): raz wyślij sygnał instalacji (standalone)
// i dorejestruj to urządzenie, jeśli KONTO ma powiadomienia włączone (R4) —
// autoRejoinPush sam sprawdza status konta, zgodę i lokalną subskrypcję.
function PushBootstrap() {
  useEffect(() => {
    if (!isLoggedIn()) return;
    // Stempel „ma aplikację" w każdej firmie, w której jest sesja na tym
    // urządzeniu (raz na firmę; endpoint idempotentny).
    sendInstallSignalOnce();
    for (const s of listSessions()) void sendInstallSignalOnce(s.tenantId, sessionToken(s.tenantId));
    autoRejoinPush();
  }, []);
  // Push przy OTWARTEJ aplikacji: service worker daje znać (postMessage)
  // i chmurka na dzwonku odświeża się natychmiast.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMsg = (e: MessageEvent) => {
      if ((e.data as { type?: string } | null)?.type === "booksero-push") {
        queryClient.invalidateQueries({ queryKey: ["notifUnread"] });
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PushBootstrap />
      {/* Kolor lokalizacji dla WSZYSTKICH ekranów /salon/… — jeden właściciel */}
      <SalonAccent />
      <InstallBanner />
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
        <Route path="/salon/:salonId/notifications" component={Notifications} />
        <Route path="/push-open" component={PushOpen} />
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
