# Backstage Online Languages

Sito della scuola di inglese di Christina Back, in italiano e inglese, con area studenti riservata, vista per genitori e tutori, **AI English Tutor** per i compiti e pannello di gestione per Christina.

## Avvio in locale

```bash
npm install
npm run dev
```

- Sito: http://localhost:3000 (porta 3300 dall'anteprima di Claude) → `/it` o `/en`
- Area studenti: `/it/area` — in anteprima: `studente@demo.backstage`, `leo.r` (bambino senza email) o `genitore@demo.backstage`, password `demo-backstage` (dati **fittizi**)
- Pannello di Christina: `/staff` — in locale la password è `anteprima`

`npm run check` esegue TypeScript, ESLint, i test (Vitest) e la build: deve essere verde prima di ogni commit.

## Cosa c'è

| Parte | Dove | Note |
|---|---|---|
| Home, Chi siamo, Corsi, Test d'ingresso, Viaggi studio, Risorse, Contatti, Privacy, Cookie | `src/app/[lang]/…` | Testi modificabili dal pannello; interfaccia in `src/lib/i18n/it.ts` e `en.ts` |
| AI English Tutor | `/it/ai-tutor`, `/it/area/tutor`, API `src/app/api/tutor/route.ts` | Istruzioni di sicurezza in `src/lib/tutor/prompt.ts` |
| Area studenti e genitori | `src/app/[lang]/area` | Regole di accesso in `src/server/access.ts` |
| Pannello di Christina | `src/app/staff` | Studenti, accessi, lezioni, progressi, appuntamenti, compiti, pagamenti, promemoria, certificazioni, richieste, contenuti |
| Dati | `src/server/store` | Supabase se configurato (`supabase/schema.sql`), altrimenti archivio locale `.data/` (escluso da git) |

### AI English Tutor
- **Dimostrativo** senza `ANTHROPIC_API_KEY`: risposte di esempio preparate, segnalate come tali.
- **Attivo** con la chiave: usa Claude (`claude-opus-5-5`, cambiabile con `TUTOR_MODEL`), in streaming, con fallback automatico in caso di rifiuto. Per default l'AI vera è riservata a studenti e genitori con accesso (`TUTOR_ACCESS=public` per aprirla a tutti); i visitatori vedono la versione dimostrativa.
- Aiuto graduato (indizio → spiegazione → esempio), adattato a 4 fasce d'età e al livello, spiegazioni in italiano, inglese o misto.
- Non svolge il compito al posto dello studente, dichiara i propri limiti, non è una valutazione ufficiale.
- Privacy: email e numeri di telefono vengono tolti prima dell'invio; le conversazioni non vengono salvate, salvo quando lo studente le **condivide con l'insegnante** (le trova nel pannello, scheda dello studente, e può rispondere).
- Limiti: 60 messaggi/ora per account, 15–40 per visitatore.

### Privacy degli studenti
- La scuola è gestita solo da Christina Back: c'è un unico accesso al pannello (`ADMIN_PASSWORD`).
- **Ogni studente ha le sue credenziali**: quando Christina crea uno studente il sito genera subito nome utente (es. `giulia.r`) e password temporanea, da cambiare al primo accesso. L'email è facoltativa (i bambini spesso non ce l'hanno); si entra con nome utente o email. I genitori hanno un accesso separato.
- **Google Classroom**: tutti i materiali dei corsi sono su Classroom. Nella scheda dello studente Christina inserisce il link della classe (`https://classroom.google.com/c/…`) e, se vuole, il codice del corso; lo studente li trova in evidenza nella sua area.
- Uno studente vede solo i propri dati; un genitore/tutore solo gli studenti collegati; i file delle certificazioni passano da `/api/files/…` con controllo di accesso.
- I pagamenti non vengono elaborati dal sito: lo stato lo aggiorna solo Christina dal pannello.
- I promemoria compaiono nell'area riservata e, se attivato e configurato, via email (Resend). WhatsApp/SMS non sono collegati.

## Variabili d'ambiente

| Variabile | A cosa serve |
|---|---|
| `SITE_MODE=live` | Pubblicazione: nasconde i segnaposto, disattiva gli account demo, permette l'indicizzazione |
| `ADMIN_PASSWORD` | Password del pannello di Christina (obbligatoria in produzione) |
| `SESSION_SECRET` | Firma dei cookie di sessione (stringa lunga e casuale) |
| `ANTHROPIC_API_KEY` | Attiva il tutor AI |
| `TUTOR_MODEL`, `TUTOR_ACCESS` | Modello e accesso del tutor (vedi sopra) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Email di avviso e promemoria |
| `SCHOOL_NOTIFY_EMAIL` | Dove avvisare delle nuove richieste (altrimenti l'email dei contatti) |
| `CRON_SECRET` | Protegge `/api/cron/reminders` (Vercel Cron, tutti i giorni alle 7 UTC: `vercel.json`) |
| `NEXT_PUBLIC_SITE_URL` | Indirizzo pubblico del sito |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Database e file (obbligatori su Vercel). La chiave service_role è segreta: solo su Vercel, mai nel codice |

## Pubblicare su Vercel con Supabase

Si fa una volta sola, in quest'ordine.

**1. Supabase (database e file)**
1. Su [supabase.com](https://supabase.com) → *New project* (regione **Europe**, es. Frankfurt). Annota la password del database.
2. Menu *SQL Editor* → *New query* → incolla tutto il file `supabase/schema.sql` → *Run*. Crea tabelle, regole di sicurezza e i due spazi file privati.
3. *Project Settings → API*: copia **Project URL** e la chiave **service_role** (segreta).

**2. GitHub**
1. Crea un repository **privato** `backstage` (account `zumbofreddie42-afk`, come gli altri progetti).
2. Dalla cartella del progetto: `git remote add origin https://github.com/zumbofreddie42-afk/backstage.git` e poi `git push -u origin main` (dal terminale interattivo, per il login).

**3. Vercel**
1. *Add New → Project* → importa il repository `backstage` (Framework: Next.js, impostazioni predefinite).
2. Prima di *Deploy*, in *Environment Variables* aggiungi almeno:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (dal punto 1.3)
   - `ADMIN_PASSWORD` (password del pannello) e `SESSION_SECRET` (stringa casuale lunga, es. 40 caratteri)
   - `CRON_SECRET` (altra stringa casuale) per i promemoria automatici
   - facoltative: `ANTHROPIC_API_KEY`, `RESEND_API_KEY` + `EMAIL_FROM`, `SCHOOL_NOTIFY_EMAIL`, `NEXT_PUBLIC_SITE_URL`
3. *Deploy*. Poi apri `/staff` → *Riepilogo* → «Stato dei servizi»: deve dire **Database Supabase**.

Finché `SITE_MODE` non è impostata il sito resta in **anteprima**: non indicizzato, con i segnaposto evidenziati e gli account demo (che vengono salvati nel database). Con `SITE_MODE=live` (e un nuovo deploy) gli account e i dati demo vengono cancellati automaticamente.

### Note
- Ogni modifica salvata dal pannello aggiorna subito le pagine pubbliche.
- I file caricati (foto e certificazioni) arrivano al massimo a 4 MB, il limite di Vercel.
- Il limite di tentativi su accessi e moduli è per singola istanza del server: protegge dagli abusi casuali, non da attacchi mirati.
- Backup: Supabase li fa in automatico sui piani a pagamento; sul piano gratuito conviene esportare i dati ogni tanto (*Database → Backups* o `pg_dump`).

## Prima della pubblicazione definitiva (`SITE_MODE=live`)
1. Completare quanto elencato in `DA-CONFERMARE.md`.
2. Controllare che in *Contenuti del sito* non restino segnaposto.
3. Impostare `SITE_MODE=live` su Vercel e rifare il deploy.
