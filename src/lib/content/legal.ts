import type { SiteContent } from "./schema";
import { t, type Locale } from "@/lib/i18n";

/**
 * Draft privacy and cookie texts describing what the site actually does. They must be completed with
 * the school's legal data and checked by an adviser before going live (see DA-CONFERMARE.md).
 */
export function privacySections(c: SiteContent, locale: Locale): { title: string; text: string }[] {
  const l = c.legal;
  if (locale === "en") {
    return [
      { title: "Data controller", text: `${l.owner}, ${l.registeredOffice}, VAT ${l.vat}. Privacy contact: ${l.privacyEmail}.` },
      {
        title: "What data we process and why",
        text: "Contact and placement-test requests: name, email, optional phone, age group or course of interest, your message and, if you choose, a language certificate file. We use them only to reply and to organise the placement test.\n\nStudent area: the data needed to follow the course (path, level, lessons and hours, progress, appointments, homework, payment due dates and their status, reminders, uploaded certificates). For students under 18 the account is managed with a parent or guardian.",
      },
      {
        title: "AI English Tutor",
        text: "Messages written in the tutor are sent to an artificial intelligence service provider ({{PROVIDER: Anthropic, PBC — to be confirmed in the data processing agreement}}) only to generate the answer. Email addresses and phone numbers are automatically removed before sending. Conversations are not saved by the website unless the student chooses to share one with the teacher. Do not write personal data in the tutor.",
      },
      { title: "Who can see the data", text: "Only authorised Backstage staff. Each student sees only their own data; a parent or guardian sees only the data of the students linked to them. Data is never published on the website." },
      { title: "Retention", text: "{{RETENTION PERIODS}}" },
      { title: "Your rights", text: `You can ask to access, correct or delete your data, or object to its processing, by writing to ${l.privacyEmail}. You can also lodge a complaint with the Italian Data Protection Authority (Garante per la protezione dei dati personali).` },
      ...(t(l.privacyExtra, locale) ? [{ title: "Further information", text: t(l.privacyExtra, locale) }] : []),
    ];
  }
  return [
    { title: "Titolare del trattamento", text: `${l.owner}, ${l.registeredOffice}, P. IVA ${l.vat}. Contatto privacy: ${l.privacyEmail}.` },
    {
      title: "Quali dati trattiamo e perché",
      text: "Richieste di contatto e di test d'ingresso: nome, email, telefono (facoltativo), fascia d'età o corso d'interesse, il tuo messaggio e, se lo scegli, il file di una certificazione linguistica. Li usiamo solo per risponderti e organizzare il test.\n\nArea studenti: i dati necessari a seguire il percorso (corso, livello, lezioni e ore, progressi, appuntamenti, compiti, scadenze di pagamento e relativo stato, promemoria, certificazioni caricate). Per gli studenti minorenni l'account è gestito insieme a un genitore o tutore.",
    },
    {
      title: "AI English Tutor",
      text: "I messaggi scritti nel tutor sono inviati a un fornitore di servizi di intelligenza artificiale ({{FORNITORE: Anthropic, PBC — da confermare nell'accordo di trattamento dati}}) solo per generare la risposta. Indirizzi email e numeri di telefono vengono rimossi automaticamente prima dell'invio. Il sito non salva le conversazioni, salvo quando lo studente sceglie di condividerne una con l'insegnante. Non scrivere dati personali nel tutor.",
    },
    { title: "Chi vede i dati", text: "Solo il personale autorizzato di Backstage. Ogni studente vede soltanto i propri dati; un genitore o tutore vede soltanto i dati degli studenti collegati al suo account. I dati non vengono mai pubblicati sul sito." },
    { title: "Conservazione", text: "{{TEMPI DI CONSERVAZIONE}}" },
    { title: "I tuoi diritti", text: `Puoi chiedere accesso, rettifica o cancellazione dei dati, oppure opporti al trattamento, scrivendo a ${l.privacyEmail}. Puoi anche proporre reclamo al Garante per la protezione dei dati personali.` },
    ...(t(l.privacyExtra, locale) ? [{ title: "Altre informazioni", text: t(l.privacyExtra, locale) }] : []),
  ];
}

export function cookieSections(locale: Locale): { title: string; text: string }[] {
  if (locale === "en") {
    return [
      { title: "Technical cookies only", text: "The site uses only the technical cookies needed to keep you signed in to the student area or the staff area (bs_user, bs_staff). They do not track you and need no consent." },
      { title: "No analytics or advertising cookies", text: "There are no analytics, profiling or advertising cookies. Links to Amazon or social networks open external sites with their own policies." },
    ];
  }
  return [
    { title: "Solo cookie tecnici", text: "Il sito usa soltanto i cookie tecnici necessari a mantenere l'accesso all'area studenti o all'area del personale (bs_user, bs_staff). Non ti tracciano e non richiedono consenso." },
    { title: "Nessun cookie di statistica o pubblicità", text: "Non ci sono cookie di statistica, profilazione o pubblicità. I link ad Amazon o ai social aprono siti esterni con le loro informative." },
  ];
}
