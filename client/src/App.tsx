import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
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
        <Route>
          {() => <div className="p-6 text-muted">Nie znaleziono strony.</div>}
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}
