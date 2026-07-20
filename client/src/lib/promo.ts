import type { Promotion } from "@shared/types";

// Etykieta wielkości rabatu: "-20%" albo "-30 PLN".
export function promoDiscountLabel(p: Promotion, currency: string): string {
  return p.discountType === "percent" ? `-${p.discountValue}%` : `-${p.discountValue} ${currency}`;
}

// Skrócone nazwy dni (1=pon..7=nd) w języku interfejsu — przez Intl, bez
// zaszywania 7×16 tłumaczeń. Baza: 2024-01-01 to poniedziałek.
export function promoDaysLabel(daysOfWeek: number[], lang: string): string {
  if (!daysOfWeek || daysOfWeek.length === 0) return "";
  const fmt = new Intl.DateTimeFormat(lang, { weekday: "short" });
  return [...daysOfWeek]
    .sort((a, b) => a - b)
    .map((d) => fmt.format(new Date(2024, 0, 1 + ((d - 1) % 7))))
    .join(", ");
}

// Pełna, zwięzła linia promocji, np. "Happy hours · -20% · pon, śr · 11:00–14:00".
export function promoLine(p: Promotion, currency: string, lang: string): string {
  const days = promoDaysLabel(p.daysOfWeek, lang);
  return [p.name, promoDiscountLabel(p, currency), days, `${p.timeFrom}–${p.timeTo}`]
    .filter(Boolean)
    .join(" · ");
}
