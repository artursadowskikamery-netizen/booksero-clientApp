// Polityka prywatności pod PUBLICZNYM adresem — wymóg Google Play (Sklep →
// Polityka prywatności oraz formularz „Bezpieczeństwo danych"). Treść żyje
// w docs/store/POLITYKA-PRYWATNOSCI.md (jedno źródło: to samo, co czyta
// prawnik), a tu jest tylko zamiana Markdownu na prostą stronę HTML.
// Czytamy z dysku przy każdym żądaniu — plik zmienia się raz na kwartał,
// a dzięki temu poprawka treści nie wymaga nowej wersji aplikacji, tylko
// Republishu.
import { readFileSync } from "fs";
import { join } from "path";

const PLIK = join(process.cwd(), "docs", "store", "POLITYKA-PRYWATNOSCI.md");

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Wewnątrz akapitu: **pogrubienie**, `kod`, [tekst](adres). Reszta dosłownie.
function inline(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
}

// Minimalny Markdown → HTML: nagłówki #/##, listy „- ", akapity, kursywa
// całej linii (_…_). Cytaty „> " są POMIJANE — to notatki robocze dla nas,
// nie treść dla klientki.
export function markdownToHtml(md: string): string {
  const out: string[] = [];
  let para: string[] = [];
  let lista: string[] = [];
  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushLista = () => {
    if (lista.length) out.push(`<ul>${lista.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`);
    lista = [];
  };
  let wCytacie = false;
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (line.startsWith(">")) { wCytacie = true; flushPara(); flushLista(); continue; }
    if (wCytacie && line.trim() === "") { wCytacie = false; continue; }
    if (wCytacie) continue;
    if (line.trim() === "") { flushPara(); flushLista(); continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) { flushPara(); flushLista(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    const li = /^\s*[-*]\s+(.*)$/.exec(line);
    if (li) { flushPara(); lista.push(li[1]); continue; }
    if (lista.length && /^\s{2,}\S/.test(raw)) { lista[lista.length - 1] += " " + line.trim(); continue; }
    const em = /^_(.+)_$/.exec(line.trim());
    if (em) { flushPara(); flushLista(); out.push(`<p><em>${inline(em[1])}</em></p>`); continue; }
    flushLista();
    para.push(line.trim());
  }
  flushPara();
  flushLista();
  return out.join("\n");
}

export function privacyPage(): string {
  let md = "";
  try {
    md = readFileSync(PLIK, "utf8");
  } catch {
    md = "# Polityka prywatności\n\nDokument jest chwilowo niedostępny. Napisz: developer@viviestetic.eu";
  }
  const body = markdownToHtml(md);
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Polityka prywatności — BookSero</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; padding: 24px 16px 48px; font: 16px/1.55 -apple-system, "Segoe UI", Roboto, sans-serif; background: #0A0C0D; color: #E6E8EA; }
  main { max-width: 720px; margin: 0 auto; }
  h1 { font-size: 26px; line-height: 1.2; margin: 0 0 8px; }
  h2 { font-size: 18px; margin: 28px 0 8px; }
  p, li { color: #C7CBD0; }
  a { color: #4DA3FF; }
  strong { color: #FFFFFF; }
  code { background: #1A1D20; padding: 1px 5px; border-radius: 4px; font-size: 14px; }
  ul { padding-left: 20px; }
  footer { margin-top: 40px; font-size: 13px; color: #8A9098; }
</style>
</head>
<body>
<main>
${body}
<footer>BookSero · <a href="/">app.booksero.com</a></footer>
</main>
</body>
</html>`;
}
