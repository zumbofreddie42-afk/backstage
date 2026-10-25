# Backstage Online Languages

Sito della scuola di inglese di Christina Back, in italiano e inglese, con area studenti riservata, vista per genitori e tutori, **AI English Tutor** per i compiti e pannello di gestione per il personale.

## Avvio in locale

```bash
npm install
npm run dev
```

- Sito: http://localhost:3000 (porta 3300 dall'anteprima di Claude) → `/it` o `/en`
- Area studenti: `/it/area` — in anteprima: `studente@demo.backstage` o `genitore@demo.backstage`, password `demo-backstage` (dati **fittizi**)
- Pannello del personale: `/staff` — in locale la password è `anteprima`

`npm run check` esegue TypeScript, ESLint, i test (Vitest) e la build: deve essere verde prima di ogni commit.

## Cosa c'è

| Parte | Dove | Note |
|---|---|---|
| Home, Chi siamo, Corsi, Test d'ingresso, Viaggi studio, Risorse, Contatti, Privacy, Cookie | `src/app/[lang]/…` | Testi modificabili dal pannello; interfaccia in `src/lib/i18n/it.ts` e `en.ts` |
| AI English Tutor | `/it/ai-tutor`, `/it/area/tutor`, API `src/app/api/tutor/route.ts` | Istruzioni di sicurezza in `src/lib/tutor/prompt.ts` |
| Area studenti e genitori | `src/app/[lang]/area` | Regole di accesso in `src/server/access.ts` |
| Pannello del personale | `src/app/staff` | Studenti, accessi, lezioni, progressi, appuntamenti, compiti, pagamenti, promemoria, certificazioni, richieste, contenuti |
| Dati | `src/server/store` | Oggi archivio locale (`.data/`, escluso da git) |

### AI English Tutor
- **Dimostrativo** senza `ANTHROPIC_API_KEY`: risposte di esempio preparate, segnalate come tali.
- **Attivo** con la chiave: usa Claude (`claude-opus-5-5`, cambiabile con `TUTOR_MODEL`), in streaming, con fallback automatico in caso di rifiuto. Per default l'AI vera è riservata a studenti e genitori con accesso (`TUTOR_ACCESS=public` per aprirla a tutti); i visitatori vedono la versione dimostrativa.
- Aiuto graduato (indizio → spiegazione → esempio), adattato a 4 fasce d'età e al livello, spiegazioni in italiano, inglese o misto.
- Non svolge il compito al posto dello studente, dichiara i propri limiti, non è una valutazione ufficiale.
- Privacy: email e numeri di telefono vengono tolti prima dell'invio; le conversazioni non vengono salvate, salvo quando lo studente le **condivide con l'insegnante** (le trova nel pannello, scheda dello studente, e può rispondere).
- Limiti: 60 messaggi/ora per account, 15–40 per visitatore.

### Privacy degli studenti
- Gli account li crea solo il personale (password temporanea da cambiare al primo accesso).
- Uno studente vede solo i propri dati; un genitore/tutore solo gli studenti collegati; i file delle certificazioni passano da `/api/files/…` con controllo di accesso.
- I pagamenti non vengono elaborati dal sito: lo stato lo aggiorna solo l'amministrazione (`ADMIN_PASSWORD`). Il ruolo insegnante (`TEACHER_PASSWORD`) non vede i pagamenti e non modifica i contenuti.
- I promemoria compaiono nell'area riservata e, se attivato e configurato, via email (Resend). WhatsApp/SMS non sono collegati.

## Variabili d'ambiente

| Variabile | A cosa serve |
|---|---|
| `SITE_MODE=live` | Pubblicazione: nasconde i segnaposto, disattiva gli account demo, permette l'indicizzazione |
| `ADMIN_PASSWORD` | Accesso amministrazione al pannello (obbligatoria in produzione) |
| `TEACHER_PASSWORD` | Accesso insegnante (facoltativo) |
| `SESSION_SECRET` | Firma dei cookie di sessione (stringa lunga e casuale) |
| `ANTHROPIC_API_KEY` | Attiva il tutor AI |
| `TUTOR_MODEL`, `TUTOR_ACCESS` | Modello e accesso del tutor (vedi sopra) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Email di avviso e promemoria |
| `SCHOOL_NOTIFY_EMAIL` | Dove avvisare delle nuove richieste (altrimenti l'email dei contatti) |
| `CRON_SECRET` | Protegge `/api/cron/reminders` (Vercel Cron, tutti i giorni alle 7 UTC: `vercel.json`) |
| `NEXT_PUBLIC_SITE_URL` | Indirizzo pubblico del sito |

## Prima della pubblicazione
1. Completare quanto elencato in `DA-CONFERMARE.md`.
2. **Database**: l'archivio attuale tiene i dati in memoria e in `.data/` — va bene in locale, ma su Vercel i dati non restano salvati. Serve collegare un database (es. Supabase, come per gli altri progetti) implementando l'interfaccia `Store` in `src/server/store/types.ts`, con file privati per le certificazioni.
3. Impostare le variabili d'ambiente e poi `SITE_MODE=live`.
