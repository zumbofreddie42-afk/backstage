import { AGE_BANDS, LEVELS, type SiteContent } from "./schema";

/**
 * Declarative description of the staff content editor. Each section lists its fields by path inside
 * SiteContent; list sections describe the fields of one item. The same definitions drive the forms
 * (src/app/staff/(panel)/contenuti) and the generic save action, so nothing outside these paths can
 * be written from the panel.
 */
export type FieldKind = "l" | "l-long" | "text" | "url" | "email" | "bool" | "number" | "select";
export type FieldDef = { key: string; label: string; kind: FieldKind; hint?: string; options?: { value: string; label: string }[] };
export type ListDef = { path: string; title: string; itemLabel: string; fields: FieldDef[]; fixed?: boolean; newItem?: () => unknown };
export type SectionDef = { key: string; title: string; description: string; fields: FieldDef[]; lists: ListDef[]; photos?: boolean };

const ageOptions = [{ value: "all", label: "Tutte le età" }, ...AGE_BANDS.map((v) => ({ value: v, label: { young: "Young learners 3–10", middle: "Scuola media", high: "Scuola superiore", adults: "Adulti 18+" }[v] }))];
const levelOptions = [{ value: "", label: "Tutti i livelli" }, ...LEVELS.map((v) => ({ value: v, label: v }))];
const L = (it = "", en = "") => ({ it, en });
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 10)}`;

export const SECTIONS: SectionDef[] = [
  {
    key: "home",
    title: "Home page",
    description: "Titolo principale, presentazione e anni di esperienza.",
    fields: [
      { key: "home.heroTitle", label: "Titolo principale", kind: "l" },
      { key: "home.heroText", label: "Testo sotto il titolo", kind: "l-long" },
      { key: "home.intro", label: "Presentazione della scuola", kind: "l-long" },
      { key: "home.years", label: "Anni di esperienza (es. 25+)", kind: "text" },
    ],
    lists: [],
  },
  {
    key: "about",
    title: "Chi siamo · Christina Back",
    description: "Storia, approccio, ruolo e metodo. Carica qui le foto autentiche fornite dalla scuola.",
    fields: [
      { key: "about.story", label: "La sua storia", kind: "l-long" },
      { key: "about.approach", label: "Il suo approccio all'insegnamento", kind: "l-long" },
      { key: "about.role", label: "Cosa fa a Backstage", kind: "l-long" },
      { key: "about.method", label: "Il metodo Backstage", kind: "l-long" },
      { key: "about.portrait.alt", label: "Ritratto: descrizione per chi non vede l'immagine", kind: "l" },
      { key: "about.portrait.caption", label: "Ritratto: didascalia (facoltativa)", kind: "l" },
    ],
    lists: [
      {
        path: "about.photos",
        title: "Foto",
        itemLabel: "Foto",
        fields: [
          { key: "alt", label: "Descrizione per chi non vede l'immagine", kind: "l" },
          { key: "caption", label: "Didascalia (facoltativa)", kind: "l" },
        ],
      },
    ],
    photos: true,
  },
  {
    key: "courses",
    title: "Corsi",
    description: "I quattro percorsi per fascia d'età. Non inserire prezzi: il sito invita a contattare la scuola.",
    fields: [],
    lists: [
      {
        path: "courses",
        title: "Percorsi",
        itemLabel: "Percorso",
        fixed: true,
        fields: [
          { key: "title", label: "Nome", kind: "l" },
          { key: "ages", label: "Età", kind: "l" },
          { key: "summary", label: "In breve", kind: "l-long" },
          { key: "activities", label: "Cosa si fa", kind: "l-long" },
          { key: "goals", label: "Obiettivi", kind: "l-long" },
        ],
      },
    ],
  },
  {
    key: "placement",
    title: "Test d'ingresso",
    description: "I passaggi per fissare il test e la nota finale.",
    fields: [{ key: "placement.note", label: "Nota", kind: "l-long" }],
    lists: [{ path: "placement.steps", title: "Passaggi", itemLabel: "Passaggio", fields: [{ key: "", label: "Testo", kind: "l" }], newItem: () => L() }],
  },
  {
    key: "trips",
    title: "Viaggi studio Trinity",
    description: "Solo dati ufficiali: destinazioni, date, attività e modalità di partecipazione. Un viaggio con segnaposto non compare nel sito pubblicato.",
    fields: [
      { key: "trips.intro", label: "Introduzione", kind: "l-long" },
      { key: "trips.trinityNote", label: "Collegamento con Trinity (testo ufficiale)", kind: "l-long" },
    ],
    lists: [
      {
        path: "trips.items",
        title: "Viaggi",
        itemLabel: "Viaggio",
        fields: [
          { key: "published", label: "Pubblicato", kind: "bool" },
          { key: "title", label: "Nome", kind: "l" },
          { key: "destination", label: "Destinazione", kind: "l" },
          { key: "dates", label: "Date", kind: "l" },
          { key: "activities", label: "Attività", kind: "l-long" },
          { key: "participation", label: "Come partecipare", kind: "l-long" },
        ],
        newItem: () => ({ id: uid("trip"), published: false, title: L(), destination: L(), dates: L(), activities: L(), participation: L() }),
      },
    ],
  },
  {
    key: "resources",
    title: "Risorse",
    description: "Collegamenti a materiali didattici, organizzati per età, livello e argomento.",
    fields: [],
    lists: [
      {
        path: "resources",
        title: "Risorse",
        itemLabel: "Risorsa",
        fields: [
          { key: "published", label: "Pubblicata", kind: "bool" },
          { key: "title", label: "Titolo", kind: "l" },
          { key: "description", label: "Descrizione", kind: "l-long" },
          { key: "url", label: "Link (https://…)", kind: "url" },
          { key: "ageBand", label: "Età", kind: "select", options: ageOptions },
          { key: "level", label: "Livello", kind: "select", options: levelOptions },
          { key: "topic", label: "Argomento (es. Grammatica)", kind: "l" },
        ],
        newItem: () => ({ id: uid("res"), published: false, title: L(), description: L(), url: "", ageBand: "all", level: "", topic: L() }),
      },
    ],
  },
  {
    key: "books",
    title: "Libri consigliati",
    description: "Usa solo i link Amazon forniti da Backstage. Se sono link affiliati attiva l'informativa.",
    fields: [
      { key: "amazon.affiliate", label: "I link Amazon sono affiliati (mostra l'informativa)", kind: "bool" },
      { key: "amazon.disclosure", label: "Testo dell'informativa", kind: "l" },
    ],
    lists: [
      {
        path: "books",
        title: "Libri",
        itemLabel: "Libro",
        fields: [
          { key: "published", label: "Pubblicato", kind: "bool" },
          { key: "title", label: "Titolo", kind: "text" },
          { key: "author", label: "Autore", kind: "text" },
          { key: "amazonUrl", label: "Link Amazon fornito da Backstage", kind: "url" },
          { key: "ageBand", label: "Età", kind: "select", options: ageOptions },
          { key: "level", label: "Livello", kind: "select", options: levelOptions },
          { key: "note", label: "Nota (facoltativa)", kind: "l" },
        ],
        newItem: () => ({ id: uid("book"), published: false, title: "", author: "", amazonUrl: "", ageBand: "all", level: "", note: L() }),
      },
    ],
  },
  {
    key: "testimonials",
    title: "Testimonianze",
    description: "Solo testimonianze autentiche, con il consenso della persona. Compaiono in home solo se «autentica» e «pubblicata» sono attive.",
    fields: [],
    lists: [
      {
        path: "testimonials",
        title: "Testimonianze",
        itemLabel: "Testimonianza",
        fields: [
          { key: "authentic", label: "Autentica e autorizzata alla pubblicazione", kind: "bool" },
          { key: "published", label: "Pubblicata", kind: "bool" },
          { key: "quote", label: "Testo", kind: "l-long" },
          { key: "author", label: "Firma (es. «Anna, mamma di Luca»)", kind: "text" },
        ],
        newItem: () => ({ id: uid("tst"), published: false, authentic: false, quote: L(), author: "" }),
      },
    ],
  },
  {
    key: "contact",
    title: "Contatti e social",
    description: "Solo recapiti e profili ufficiali. Lascia vuoto ciò che non c'è.",
    fields: [
      { key: "contact.email", label: "Email", kind: "email" },
      { key: "contact.phone", label: "Telefono", kind: "text" },
      { key: "contact.whatsapp", label: "Numero WhatsApp (con prefisso, es. +39…)", kind: "text" },
      { key: "contact.address", label: "Indirizzo (o «Lezioni online»)", kind: "l" },
      { key: "contact.hours", label: "Orari", kind: "l" },
      { key: "contact.instagram", label: "Instagram (https://…)", kind: "url" },
      { key: "contact.facebook", label: "Facebook (https://…)", kind: "url" },
      { key: "contact.youtube", label: "YouTube (https://…)", kind: "url" },
      { key: "contact.tiktok", label: "TikTok (https://…)", kind: "url" },
      { key: "contact.linkedin", label: "LinkedIn (https://…)", kind: "url" },
    ],
    lists: [],
  },
  {
    key: "legal",
    title: "Dati legali e privacy",
    description: "Dati del titolare per il piè di pagina e l'informativa privacy (da far verificare a un consulente).",
    fields: [
      { key: "legal.owner", label: "Titolare / ragione sociale", kind: "text" },
      { key: "legal.vat", label: "Partita IVA", kind: "text" },
      { key: "legal.registeredOffice", label: "Sede legale", kind: "text" },
      { key: "legal.privacyEmail", label: "Email per la privacy", kind: "text" },
      { key: "legal.privacyExtra", label: "Informazioni aggiuntive per l'informativa", kind: "l-long" },
    ],
    lists: [],
  },
];

export function getSection(key: string): SectionDef | undefined {
  return SECTIONS.find((s) => s.key === key);
}

type Container = Record<string, unknown> | unknown[];

function step(obj: Container, key: string): unknown {
  return Array.isArray(obj) ? obj[Number(key)] : obj[key];
}

export function getByPath(root: unknown, path: string): unknown {
  if (!path) return root;
  return path.split(".").reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? step(acc as Container, key) : undefined), root);
}

/** Sets an existing path only (never creates new keys), so a crafted form cannot add fields. */
export function setByPath(root: unknown, path: string, value: unknown): boolean {
  const keys = path.split(".");
  const last = keys.pop()!;
  const parent = getByPath(root, keys.join("."));
  if (!parent || typeof parent !== "object") return false;
  const container = parent as Container;
  if (Array.isArray(container)) {
    const i = Number(last);
    if (!Number.isInteger(i) || i < 0 || i >= container.length) return false;
    container[i] = value;
    return true;
  }
  if (!(last in container)) return false;
  container[last] = value;
  return true;
}

export function joinPath(...parts: (string | number)[]): string {
  return parts.filter((p) => p !== "").join(".");
}

export type FieldValue = string | boolean | number | { it: string; en: string };

/** Reads one field's value from submitted form data (bilingual fields use `<name>.it` / `<name>.en`). */
export function readField(field: FieldDef, name: string, get: (key: string) => string | null): FieldValue {
  switch (field.kind) {
    case "l":
    case "l-long":
      return { it: (get(`${name}.it`) ?? "").trim(), en: (get(`${name}.en`) ?? "").trim() };
    case "bool":
      return get(name) === "on";
    case "number":
      return Number(get(name) ?? 0) || 0;
    case "url": {
      const v = (get(name) ?? "").trim();
      return /^https?:\/\/\S+$/i.test(v) ? v : "";
    }
    case "select": {
      const v = get(name) ?? "";
      return field.options?.some((o) => o.value === v) ? v : (field.options?.[0]?.value ?? "");
    }
    default:
      return (get(name) ?? "").trim();
  }
}

export function listOf(content: SiteContent, path: string): unknown[] {
  const v = getByPath(content, path);
  return Array.isArray(v) ? v : [];
}

/** Counts {{placeholders}} left in a value (strings, nested objects, arrays). */
export function countPlaceholders(value: unknown): number {
  if (typeof value === "string") return (value.match(/\{\{[^}]+\}\}/g) ?? []).length;
  if (Array.isArray(value)) return value.reduce<number>((n, v) => n + countPlaceholders(v), 0);
  if (value && typeof value === "object") return Object.values(value).reduce<number>((n, v) => n + countPlaceholders(v), 0);
  return 0;
}
