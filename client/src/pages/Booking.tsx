import { useEffect, useMemo, useState } from "react";
import { useRoute, useSearch, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { ChevronLeft, Users, Check, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { isLoggedIn, isLoggedInFor } from "../lib/auth";
import type { BookingResult, StaffMember } from "@shared/types";

type Step = "service" | "staff" | "time" | "details";

const ANY = "any";
const DAYS_AHEAD = 14;

export default function Booking() {
  const [, params] = useRoute("/salon/:salonId/book");
  const salonId = params?.salonId ?? "";
  const search = useSearch();
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const [couple, setCouple] = useState(new URLSearchParams(search).get("couple") === "1");

  const [step, setStep] = useState<Step>("service");
  const [svcQuery, setSvcQuery] = useState("");
  const [catId, setCatId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [staffId2, setStaffId2] = useState(ANY);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [clientName, setName] = useState("");
  const [secondClientName, setName2] = useState("");
  const [clientPhone, setPhone] = useState("");
  const [clientEmail, setEmail] = useState("");
  const [result, setResult] = useState<BookingResult | null>(null);

  const salonQ = useQuery({ queryKey: ["salon", salonId], queryFn: () => api.salon(salonId), enabled: !!salonId });
  const servicesQ = useQuery({ queryKey: ["services", salonId], queryFn: () => api.services(salonId), enabled: !!salonId });
  const categoriesQ = useQuery({ queryKey: ["categories", salonId], queryFn: () => api.categories(salonId), enabled: !!salonId });
  const staffQ = useQuery({
    queryKey: ["staff", salonId, serviceId],
    queryFn: () => api.staff(salonId, serviceId),
    enabled: !!salonId && !!serviceId && step === "staff",
  });
  const availQ = useQuery({
    queryKey: ["avail", salonId, serviceId, staffId, staffId2, date, couple],
    queryFn: () =>
      api.availability(salonId, {
        staffId, serviceId, date,
        ...(couple ? { serviceId2: serviceId, staffId2 } : {}),
      }),
    enabled: !!salonId && !!serviceId && !!staffId && !!date && step === "time",
  });

  const qc = useQueryClient();
  const bookM = useMutation({
    mutationFn: () =>
      api.book(salonId, {
        serviceId, staffId, date, time, clientName, clientPhone, clientEmail,
        ...(couple ? { partySize: 2, serviceId2: serviceId, staffId2, secondClientName } : {}),
      }),
    onSuccess: (r) => {
      setResult(r);
      // Nowa wizyta ma się od razu pojawić na liście "Wizyty".
      qc.invalidateQueries({ queryKey: ["clientAppointments"] });
    },
  });

  const salon = salonQ.data;
  const currency = salon?.salon.currency ?? "";
  const settings = salon?.settings;

  // Rezerwacja tylko dla zalogowanych (SPEC-auto-rejestracja).
  const tenantId = salon?.salon.tenantId ?? null;
  const gated = !!salon && !!tenantId && !isLoggedInFor(tenantId);
  useEffect(() => {
    if (gated) navigate(`/salon/${salonId}/login`);
  }, [gated, salonId, navigate]);

  // Zalogowany klient: imię i telefon wpisują się same (dane z konta).
  const meQ = useQuery({ queryKey: ["me"], queryFn: () => api.clientMe(), enabled: isLoggedIn() });
  useEffect(() => {
    const me = meQ.data;
    if (!me) return;
    setName((v) => v || me.name);
    setPhone((v) => v || me.phone);
  }, [meQ.data]);

  const service = servicesQ.data?.find((s) => s.id === serviceId);
  const days = useMemo(() => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(new Date(), i)), []);

  // Wyszukiwarka usług: bez rozróżniania wielkości liter i znaków diakrytycznych
  // ("masaz" znajdzie "Masaż"). Do tego filtr po kategorii salonu.
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
  const categories = useMemo(
    () => (categoriesQ.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [categoriesQ.data],
  );
  const showCategories = categories.length >= 2 && (servicesQ.data ?? []).some((s) => s.categoryId);
  const filteredServices = useMemo(() => {
    const q = norm(svcQuery.trim());
    return (servicesQ.data ?? []).filter(
      (s) => (!catId || s.categoryId === catId) && (!q || norm(s.name).includes(q)),
    );
  }, [servicesQ.data, svcQuery, catId]);

  if (gated) return null;

  if (result) {
    return (
      <Shell title={t("booking.done")}>
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <div className="w-14 h-14 rounded-full bg-brand text-brand-contrast grid place-items-center">
            <Check size={28} />
          </div>
          <div className="font-bold text-lg">{result.message}</div>
          <div className="text-sm text-muted">{result.service} · {result.staffName}</div>
          <div className="text-sm">
            {new Intl.DateTimeFormat(i18n.language, {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            }).format(new Date(result.startAt))} · {t("booking.code")}{" "}
            <span className="font-mono font-bold">{result.bookingCode}</span>
          </div>
          {result.prepaymentRequired && (
            <div className="text-sm mt-2 rounded-xl bg-surface-2 p-3">
              {t("booking.prepaymentNote", { amount: result.prepaymentAmount, currency })}
            </div>
          )}
          <button className="btn-primary mt-3" onClick={() => navigate(`/salon/${salonId}`)}>
            {t("booking.backToSalon")}
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title={couple ? t("common.bookCouple") : t("common.book")}
      onBack={step === "service" ? () => navigate(`/salon/${salonId}`) : () => setStep(prevStep(step))}
    >
      <Steps step={step} />

      {step === "service" && (
        <>
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">{t("booking.forHowMany")}</div>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setCouple(false)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${!couple ? "bg-brand text-brand-contrast border-brand" : "bg-surface border-line"}`}
          >
            {t("booking.onePerson")}
          </button>
          <button
            onClick={() => setCouple(true)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${couple ? "bg-brand text-brand-contrast border-brand" : "bg-surface border-line"}`}
          >
            {t("booking.coupleShort")}
          </button>
        </div>
        {/* Wyszukiwarka usług — przy długim cenniku klient wpisuje kilka liter */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={svcQuery}
            onChange={(e) => setSvcQuery(e.target.value)}
            placeholder={t("booking.searchService")}
            className="w-full rounded-xl border border-line bg-surface-2 pl-9 pr-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand"
            aria-label={t("booking.searchService")}
          />
        </div>

        {/* Kategorie usług (jeśli salon je ma) */}
        {showCategories && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-2 scrollbar-none">
            <button
              onClick={() => setCatId("")}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold ${!catId ? "bg-brand text-brand-contrast border-brand" : "bg-surface border-line"}`}
            >
              {t("booking.allCategories")}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCatId(catId === c.id ? "" : c.id)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold ${catId === c.id ? "bg-brand text-brand-contrast border-brand" : "bg-surface border-line"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {filteredServices.length === 0 && (servicesQ.data?.length ?? 0) > 0 && (
          <div className="text-sm text-muted py-3">{t("booking.noServicesFound")}</div>
        )}
        <div className="divide-y divide-line">
          {filteredServices.map((s) => (
            <button
              key={s.id}
              onClick={() => { setServiceId(s.id); setStaffId(""); setStep("staff"); }}
              className={`w-full flex items-center text-left py-3 ${serviceId === s.id ? "text-brand" : ""}`}
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{s.name}</div>
                <div className="text-xs text-muted">{s.durationMinutes} min</div>
              </div>
              <div className="font-bold text-sm text-brand whitespace-nowrap">{s.price} {currency}</div>
            </button>
          ))}
        </div>
        </>
      )}

      {step === "staff" && (
        <>
          <StaffPicker label={couple ? t("booking.specialist1") : undefined} list={staffQ.data} value={staffId} onPick={setStaffId} />
          {couple && <StaffPicker label={t("booking.specialist2")} list={staffQ.data} value={staffId2} onPick={setStaffId2} />}
          <Footer>
            <button className="btn-primary" disabled={!staffId || (couple && !staffId2)} onClick={() => setStep("time")}>
              {t("common.next")}
            </button>
          </Footer>
        </>
      )}

      {step === "time" && (
        <>
          {service && (
            <div className="rounded-xl border border-line bg-surface p-3 flex items-center gap-3 mb-3">
              <span className="w-9 h-9 rounded-xl bg-surface-2 text-brand grid place-items-center shrink-0">
                <Users size={16} />
              </span>
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">{service.name} · {service.durationMinutes} min</div>
                <div className="text-xs text-muted">
                  {(staffId === "any"
                    ? t("booking.anyStaff")
                    : (() => { const m = staffQ.data?.find((x) => x.id === staffId); return m ? (m.displayName || `${m.firstName} ${m.lastName ?? ""}`.trim()) : ""; })()
                  )} · {service.price} {currency}
                </div>
              </div>
            </div>
          )}
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted mt-1 mb-2">{t("booking.chooseDay")}</div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {days.map((d) => {
              const iso = format(d, "yyyy-MM-dd");
              const wd = new Intl.DateTimeFormat(i18n.language, { weekday: "short" }).format(d);
              return (
                <button
                  key={iso}
                  onClick={() => { setDate(iso); setTime(""); }}
                  className={`shrink-0 flex flex-col items-center rounded-xl border px-3 py-2 min-w-[48px] ${date === iso ? "bg-brand text-brand-contrast border-brand" : "bg-surface border-line"}`}
                >
                  <span className="text-[10px] uppercase opacity-80">{wd}</span>
                  <span className="font-extrabold">{format(d, "d")}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-bold uppercase tracking-wider text-muted mt-4 mb-2">{t("booking.freeHours")}</div>
          {!date && <div className="text-sm text-muted">{t("booking.chooseDayFirst")}</div>}
          {date && availQ.isLoading && <div className="text-sm text-muted">{t("common.loading")}</div>}
          {date && availQ.isError && <div className="text-sm text-red-600">{(availQ.error as Error).message}</div>}
          {date && availQ.data && availQ.data.length === 0 && <div className="text-sm text-muted">{t("booking.noSlots")}</div>}
          <div className="flex flex-wrap gap-2">
            {(availQ.data ?? []).map((slot) => (
              <button
                key={slot.time}
                onClick={() => setTime(slot.time)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums ${time === slot.time ? "bg-brand text-brand-contrast border-brand" : "bg-surface border-line"}`}
              >
                {slot.time}
              </button>
            ))}
          </div>

          <Footer>
            <button className="btn-primary" disabled={!time} onClick={() => setStep("details")}>{t("common.next")}</button>
          </Footer>
        </>
      )}

      {step === "details" && (
        <>
          <Field label={t("booking.name")} value={clientName} onChange={setName} />
          {couple && <Field label={t("booking.name2")} value={secondClientName} onChange={setName2} />}
          <Field label={`${t("booking.phone")}${settings?.requirePhone ? " *" : ""}`} value={clientPhone} onChange={setPhone} type="tel" />
          {settings?.requireEmail && <Field label={`${t("booking.email")} *`} value={clientEmail} onChange={setEmail} type="email" />}

          {service && (
            <div className="rounded-xl bg-surface-2 p-3 mt-3 text-sm">
              <Summary k={t("booking.stepService")} v={`${service.name} · ${service.durationMinutes} min`} />
              <Summary k={t("booking.stepTime")} v={`${date} · ${time}`} />
              <Summary k={t("booking.price")} v={`${service.price} ${currency}${couple ? ` ${t("booking.perPerson")}` : ""}`} />
            </div>
          )}

          {bookM.isError && <div className="text-sm text-red-500 mt-2">{(bookM.error as Error).message}</div>}
          <Footer>
          <button
            className="btn-primary"
            disabled={
              !clientName ||
              (couple && !secondClientName) ||
              (settings?.requirePhone && !clientPhone) ||
              (settings?.requireEmail && !clientEmail) ||
              bookM.isPending
            }
            onClick={() => bookM.mutate()}
          >
            {bookM.isPending ? t("common.loading") : t("booking.confirm")}
          </button>
          </Footer>
        </>
      )}
    </Shell>
  );
}

function prevStep(s: Step): Step {
  return s === "details" ? "time" : s === "time" ? "staff" : "service";
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-20">
      <div className="max-w-md mx-auto p-4 bg-bg border-t border-line">{children}</div>
    </div>
  );
}

function Shell({ title, onBack, children }: { title: string; onBack?: () => void; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="max-w-md mx-auto min-h-screen p-4 pb-28">
      <header className="flex items-center gap-2 py-2">
        {onBack && (
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-line grid place-items-center text-ink-2" aria-label={t("common.back")}>
            <ChevronLeft size={18} />
          </button>
        )}
        <div className="font-bold">{title}</div>
      </header>
      {children}
    </div>
  );
}

function Steps({ step }: { step: Step }) {
  const { t } = useTranslation();
  const order: Step[] = ["service", "staff", "time", "details"];
  const labels: Record<Step, string> = {
    service: t("booking.stepService"), staff: t("booking.stepStaff"),
    time: t("booking.stepTime"), details: t("booking.stepDetails"),
  };
  const idx = order.indexOf(step);
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted mb-3">
      {order.map((s, i) => (
        <span key={s} className={i === idx ? "text-brand font-bold" : i < idx ? "text-ink-2" : ""}>
          {labels[s]}{i < order.length - 1 ? " ·" : ""}
        </span>
      ))}
    </div>
  );
}

function StaffPicker({ label, list, value, onPick }: { label?: string; list?: StaffMember[]; value: string; onPick: (id: string) => void }) {
  const { t } = useTranslation();
  const options = [
    { id: ANY, name: t("booking.anyStaff") },
    ...(list ?? []).map((s) => ({ id: s.id, name: s.displayName || `${s.firstName} ${s.lastName ?? ""}`.trim() })),
  ];
  return (
    <div className="mb-2">
      {label && (
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted mt-1 mb-2 flex items-center gap-1">
          <Users size={12} /> {label}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onPick(o.id)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${value === o.id ? "bg-brand text-brand-contrast border-brand" : "bg-surface border-line"}`}
          >
            {o.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block mb-2">
      <span className="text-[11px] font-bold text-ink-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
      />
    </label>
  );
}

function Summary({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted">{k}</span>
      <span className="font-semibold text-right">{v}</span>
    </div>
  );
}
