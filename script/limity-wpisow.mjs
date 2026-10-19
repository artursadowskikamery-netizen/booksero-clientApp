#!/usr/bin/env node
// Limity tekstów kart sklepowych w docs/store/BOOKTAGO-WPISY.md (krok 2 Booktago).
//
//   node script/limity-wpisow.mjs           → tabela na ekran, kod 1 przy przekroczeniu
//   node script/limity-wpisow.mjs --zapisz  → to samo + tabela wpisana do pliku
//                                             (między znacznikami TABELA-ZGODNOSCI)
//
// Sprawdza też: komplet języków aplikacji (SUPPORTED_LANGS z client/src/lib/i18n.ts),
// nazwę „Booktago” w polach nazwy, pisownię marki i brak starej nazwy w pliku.
// Nie jest częścią builda ani publikacji — uruchamiany ręcznie po zmianie tekstów.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLIK = join(ROOT, "docs", "store", "BOOKTAGO-WPISY.md");
const START = "<!-- TABELA-ZGODNOSCI:START -->";
const KONIEC = "<!-- TABELA-ZGODNOSCI:END -->";

// [pole w pliku, skrót w tabeli, limit znaków, limit bajtów UTF-8 albo null]
const POLA = [
  ["Play — nazwa aplikacji", "Play nazwa", 30, null],
  ["Play — krótki opis", "Play krótki", 80, null],
  ["Play — pełny opis (= App Store — opis)", "Opis (Play/ASC)", 4000, null],
  ["App Store — nazwa", "ASC nazwa", 30, null],
  ["App Store — podtytuł", "ASC podtytuł", 30, null],
  ["App Store — słowa kluczowe", "ASC słowa kl.", 100, 100],
  ["Co nowego (Play i App Store)", "Co nowego", 500, null],
];

const znaki = (s) => [...s].length;
const bajty = (s) => Buffer.byteLength(s, "utf8");

let md = readFileSync(PLIK, "utf8");
const i18n = readFileSync(join(ROOT, "client", "src", "lib", "i18n.ts"), "utf8");
const langs = [...(/SUPPORTED_LANGS = \[([^\]]*)\]/.exec(i18n)?.[1] ?? "").matchAll(/"([a-z]{2})"/g)].map((m) => m[1]);

const bledy = [];
if (langs.length !== 16) bledy.push(`SUPPORTED_LANGS: oczekiwano 16 języków, jest ${langs.length}`);

const bezTabeli = md.includes(START) ? md.slice(0, md.indexOf(START)) : md;
if (/booksero/i.test(bezTabeli)) bledy.push("plik zawiera starą nazwę (booksero)");
for (const m of bezTabeli.matchAll(/book\s?tago/gi)) {
  const dalej = bezTabeli.slice(m.index + m[0].length, m.index + m[0].length + 4);
  // małą literą wolno tylko w adresach (booktago.com, booktago.app)
  // i w identyfikatorach (gałąź claude/booktago-krok2, nazwy plików booktago-…)
  const ok = m[0] === "Booktago" || (m[0] === "booktago" && /^(\.com|\.app|-)/.test(dalej));
  if (!ok) bledy.push(`zła pisownia marki: „${m[0]}${dalej}”`);
}

const sekcje = new Map();
for (const blok of bezTabeli.split(/\n## /).slice(1)) {
  const kod = /\[([a-z]{2})\]/.exec(blok.split("\n", 1)[0])?.[1];
  if (!kod) continue;
  const pola = new Map();
  for (const p of blok.split(/\n### /).slice(1)) {
    const nl = p.indexOf("\n");
    const tekst = p.slice(nl + 1).replace(/\n---\s*$/, "").trim();
    pola.set(p.slice(0, nl).trim(), tekst);
  }
  sekcje.set(kod, pola);
}

for (const l of langs) if (!sekcje.has(l)) bledy.push(`brak sekcji języka [${l}]`);
for (const k of sekcje.keys()) if (!langs.includes(k)) bledy.push(`sekcja [${k}] spoza SUPPORTED_LANGS`);

const wiersze = [];
for (const l of langs) {
  const pola = sekcje.get(l);
  if (!pola) continue;
  const kom = [l];
  let wszystkoOk = true;
  for (const [pole, , lim, limB] of POLA) {
    const t = pola.get(pole);
    if (t === undefined || t === "") {
      bledy.push(`[${l}] brak pola „${pole}”`);
      kom.push("BRAK");
      wszystkoOk = false;
      continue;
    }
    const z = znaki(t);
    const b = bajty(t);
    let ok = z <= lim && (limB === null || b <= limB);
    if (/nazwa/.test(pole) && t !== "Booktago") {
      bledy.push(`[${l}] „${pole}” = „${t}”, oczekiwano „Booktago”`);
      ok = false;
    }
    if (/słowa kluczowe/.test(pole) && /,\s/.test(t)) {
      bledy.push(`[${l}] słowa kluczowe: spacja po przecinku (marnuje limit)`);
      ok = false;
    }
    if (!ok) {
      wszystkoOk = false;
      bledy.push(`[${l}] „${pole}”: ${z} zn.${limB ? ` / ${b} B` : ""} > limit ${lim}`);
    }
    kom.push(limB ? `${z} zn. / ${b} B` : String(z));
  }
  kom.push(wszystkoOk ? "TAK" : "**NIE**");
  wiersze.push(kom);
}

const naglowek = ["Język", ...POLA.map(([, s, lim, limB]) => `${s} (≤ ${lim}${limB ? ` zn. i ${limB} B` : ""})`), "Zgodne"];
const tabela = [
  `| ${naglowek.join(" | ")} |`,
  `|${naglowek.map(() => "---").join("|")}|`,
  ...wiersze.map((w) => `| ${w.join(" | ")} |`),
].join("\n");

console.log(tabela);
if (process.argv.includes("--zapisz")) {
  const blok = `${START}\n${tabela}\n${KONIEC}`;
  md = md.includes(START)
    ? md.slice(0, md.indexOf(START)) + blok + md.slice(md.indexOf(KONIEC) + KONIEC.length)
    : `${md.trimEnd()}\n\n---\n\n## Tabela zgodności z limitami\n\nWygenerowana: \`node script/limity-wpisow.mjs --zapisz\`. Liczba znaków = punkty kodowe Unicode (łamanie wiersza w pełnym opisie liczy się jako znak).\n\n${blok}\n`;
  writeFileSync(PLIK, md);
  console.log(`\nZapisano tabelę w ${PLIK}`);
}
if (bledy.length) {
  console.error(`\nBŁĘDY (${bledy.length}):\n- ${bledy.join("\n- ")}`);
  process.exit(1);
}
console.log(`\nOK: ${wiersze.length} języków, wszystkie pola w limitach.`);
