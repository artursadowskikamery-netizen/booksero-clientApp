import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { useTranslation } from "react-i18next";
import { queryClient } from "./lib/queryClient";
import Landing from "./pages/Landing";
import TenantSelect from "./pages/TenantSelect";
import SalonHome from "./pages/SalonHome";
import Booking from "./pages/Booking";
import Soon from "./pages/Soon";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/t/:tenantId" component={TenantSelect} />
        <Route path="/salon/:salonId/book" component={Booking} />
        <Route path="/salon/:salonId/soon" component={Soon} />
        <Route path="/salon/:salonId" component={SalonHome} />
        <Route component={NotFound} />
      </Switch>
    </QueryClientProvider>
  );
}

function NotFound() {
  const { t } = useTranslation();
  return <div className="p-6 text-muted">{t("common.pageNotFound")}</div>;
}
