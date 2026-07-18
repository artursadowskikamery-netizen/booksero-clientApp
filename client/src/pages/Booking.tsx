import { useMemo, useState } from "react";
import { useRoute, useSearch, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { ChevronLeft, Users, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import type { BookingResult, StaffMember } from "@shared/types";

type Step = "service" | "staff" | "time" | "details";

const ANY = "any";
const DAYS_AHEAD = 14;

export default function Booking() {
  const [, params] = useRoute("/salon/:salonId/book");
  const salonId = params?.salonId ?? "";
  const search = useSearch();
  const couple = new URLSearchParams(search).get("couple") === "1";
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("service");
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

  const bookM = useMutation({
    mutationFn: () =>
      api.book(salonId, {
        serviceId, staffId, date, time, clientName, clientPhone, clientEmail,
        ...(couple ? { partySize: 2, serviceId2: serviceId, staffId2, secondClientName } : {}),
      }),
    onSuccess: setResult,
  });

  const salon = salonQ.data;
  const currency = salon?.salon.currency ?? "";
  const settings = salon?.settings;
  const service = servicesQ.data?.find((s) => s.id === serviceId);
  const days = useMemo(() => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(new Date(), i)), []);

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
            {format(new Date(result.startAt), "d MMM, HH:mm")} · {t("booking.code")}{" "}
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
        <div className="divide-y divide-line">
          {(servicesQ.data ?? []).map((s) => (
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
      )}

      {step === "staff" && (
        <>
          <StaffPicker label={couple ? t("booking.specialist1") : undefined} list={staffQ.data} value={staffId} onPick={setStaffId} />
          {couple && <StaffPicker label={t("booking.specialist2")} list={staffQ.data} value={staffId2} onPick={setStaffId2} />}
          <button className="btn-primary mt-3" disabled={!staffId || (couple && !staffId2)} onClick={() => setStep("time")}>
            {t("common.next")}
          </button>
        </>
      )}

      {step === "time" && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted mt-1 mb-2">{t("booking.chooseDay")}</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((d) => {
              const iso = format(d, "yyyy-MM-dd");
              return (
                <button
                  key={iso}
                  onClick={() => { setDate(iso); setTime(""); }}
                  className={`shrink-0 flex flex-col items-center rounded-xl border px-3 py-2 min-w-[46px] ${date === iso ? "bg-brand text-brand-contrast border-brand" : "bg-surface border-line"}`}
                >
                  <span className="text-[10px] uppercase opacity-80">{format(d, "EEE")}</span>
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

          <button className="btn-primary mt-4" disabled={!time} onClick={() => setStep("details")}>{t("common.next")}</button>
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

          {bookM.isError && <div className="text-sm text-red-600 mt-2">{(bookM.error as Error).message}</div>}
          <button
            className="btn-primary mt-3"
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
        </>
      )}
    </Shell>
  );
}

function prevStep(s: Step): Step {
  return s === "details" ? "time" : s === "time" ? "staff" : "service";
}

function Shell({ title, onBack, children }: { title: string; onBack?: () => void; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="max-w-md mx-auto p-4">
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
