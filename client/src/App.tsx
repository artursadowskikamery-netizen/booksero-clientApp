import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import Landing from "./pages/Landing";
import SalonHome from "./pages/SalonHome";
import Booking from "./pages/Booking";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/salon/:salonId/book" component={Booking} />
        <Route path="/salon/:salonId" component={SalonHome} />
        <Route>
          {() => <div className="p-6 text-muted">Nie znaleziono strony.</div>}
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}
