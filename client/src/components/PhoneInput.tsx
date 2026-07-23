import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { parsePhoneNumberFromString, AsYouType, getExampleNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import examplesJson from "libphonenumber-js/examples.mobile.json";
import { phoneCountries, countryCallingCode, countryFlagEmoji, asCountryCode } from "@shared/phone";

// SPEC-telefony-e164 (aplikacja kliencka): pole telefonu z WYBOREM KRAJU
// (flaga + prefiks) + numer krajowy. Komponent emituje zawsze pełny numer
// międzynarodowy "+<kierunkowy><numer>" (E.164) — do serwera nigdy nie idzie
// numer bez kraju ani surowy wpis. Wpis z "+" przełącza kraj automatycznie.
// Logika 1:1 z wzorca Booksero (client/src/components/ui/phone-input.tsx),
// styl dopasowany do BookSero (natywny <select> zamiast shadcn).
interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (isValid: boolean) => void;
  defaultCountry?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

function getPlaceholder(country: CountryCode): string {
  try {
    const example = getExampleNumber(country, examplesJson as any);
    if (example) return example.formatNational();
  } catch {}
  return "606 123 456";
}

// Kraj z numeru zapisanego jako "+…" (do przełączenia selecta).
export function detectCountryFromPhone(phone: string | null | undefined): CountryCode {
  if (!phone) return "PL";
  const clean = phone.replace(/[\s\-().]/g, "");
  const parsed = parsePhoneNumberFromString(clean.startsWith("+") ? clean : "+" + clean);
  return (parsed?.country as CountryCode) || "PL";
}

// Lista krajów raz na moduł: kod ISO + prefiks + flaga, posortowana po kodzie.
const COUNTRY_OPTIONS = phoneCountries()
  .map((c) => ({ code: c, calling: countryCallingCode(c), flag: countryFlagEmoji(c) }))
  .sort((a, b) => a.code.localeCompare(b.code));

export function PhoneInput({
  value,
  onChange,
  onValidChange,
  defaultCountry = "PL",
  disabled,
  autoFocus,
  className,
}: PhoneInputProps) {
  const { t } = useTranslation();
  const [touched, setTouched] = useState(false);
  // Kraj: z wartości (jeśli ma rozpoznawalny kierunkowy), inaczej domyślny (lokalizacja).
  const [country, setCountry] = useState<CountryCode>(() =>
    value ? detectCountryFromPhone(value) : asCountryCode(defaultCountry),
  );

  // Część krajowa do wyświetlenia — wartość przechowujemy zawsze jako "+…".
  const displayValue = useMemo(() => {
    if (!value) return "";
    const parsed = parsePhoneNumberFromString(value);
    if (parsed) return new AsYouType(parsed.country || country).input(String(parsed.nationalNumber));
    const cc = "+" + countryCallingCode(country);
    const rest = value.startsWith(cc) ? value.slice(cc.length) : value.replace(/^\+/, "");
    return new AsYouType(country).input(rest);
  }, [value, country]);

  const placeholder = useMemo(() => getPlaceholder(country), [country]);

  const emit = useCallback(
    (raw: string, c: CountryCode) => {
      const cleaned = raw.replace(/[\s\-().]/g, "");
      let next = "";
      if (!cleaned) {
        next = "";
      } else if (cleaned.startsWith("+")) {
        next = cleaned;
        const parsed = parsePhoneNumberFromString(cleaned);
        if (parsed?.country) setCountry(parsed.country as CountryCode);
      } else {
        const digits = cleaned.replace(/\D/g, "");
        const parsed = parsePhoneNumberFromString(digits, c);
        // Poprawny numer krajowy → pełne E.164 (obcina np. zero wiodące DE/UK);
        // w trakcie pisania → prefiks + cyfry (walidacja zaświeci się po wyjściu).
        next = parsed && parsed.isValid() ? parsed.number : digits ? "+" + countryCallingCode(c) + digits : "";
      }
      onChange(next);
      if (onValidChange) {
        const p = next ? parsePhoneNumberFromString(next) : null;
        onValidChange(!!p?.isValid());
      }
    },
    [onChange, onValidChange],
  );

  const handleCountryChange = useCallback(
    (c: string) => {
      const code = c as CountryCode;
      setCountry(code);
      // Przełączenie kraju przelicza dotychczasowe cyfry na nowy prefiks.
      const parsed = value ? parsePhoneNumberFromString(value) : null;
      const national = parsed ? String(parsed.nationalNumber) : value.replace(/^\+\d*/, "").replace(/\D/g, "");
      if (national) emit(national, code);
      else onValidChange?.(false);
    },
    [value, emit, onValidChange],
  );

  const phone = value ? parsePhoneNumberFromString(value) : null;
  const isValid = !!phone?.isValid();
  const hasError = touched && !isValid && value.length > 0;

  // Zgłaszaj poprawność także dla wartości ustawionej z zewnątrz (np. Rezerwacja
  // autouzupełnia numer zalogowanego klienta) — inaczej przycisk zostałby
  // zablokowany mimo poprawnego numeru. onValidChange to stabilny setter stanu.
  useEffect(() => {
    onValidChange?.(isValid);
  }, [value, isValid, onValidChange]);

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <select
          value={country}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          aria-label={t("common.phoneCountry")}
          className="shrink-0 max-w-[120px] rounded-xl border border-line bg-surface-2 px-2 py-3 text-sm outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
        >
          {COUNTRY_OPTIONS.map((o) => (
            <option key={o.code} value={o.code}>
              {o.flag} {o.code} +{o.calling}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={displayValue}
          onChange={(e) => emit(e.target.value, country)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-brand disabled:opacity-60 ${
            hasError ? "border-red-400 focus:ring-red-400" : "border-line"
          } ${className || ""}`}
        />
      </div>
      {hasError && <p className="text-xs text-red-400">{t("common.invalidPhone")}</p>}
    </div>
  );
}

export default PhoneInput;
