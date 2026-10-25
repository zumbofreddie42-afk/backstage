# Backstage Languages — istruzioni per Claude

Sito per un cliente del titolare di OneLink (principiante): rispondigli **in italiano**, in modo semplice e breve. Progetto separato da OneLink (i dati del cliente non vanno nel repository OneLink).

## Regole di contenuto
- **Christina Back è l'unica persona che lavora nella scuola** (titolare e insegnante di tutti i corsi): niente «personale», «staff» o «insegnanti» al plurale nei testi; un solo accesso al pannello.
- Ogni studente ha credenziali proprie (nome utente obbligatorio, email facoltativa); i materiali dei corsi sono su Google Classroom (link per studente).
- Nome ufficiale: **Backstage Languages** (non «Online Languages», non «Backstage English»).
- Social: solo Instagram https://www.instagram.com/backstage_languages/ — **niente Facebook**.
- Testi pubblici in italiano **e** inglese (stessa struttura: `src/lib/i18n/it.ts` ed `en.ts`, verificata da un test); si dà del "tu". Codice, test e commenti in inglese.
- **Non inventare** recensioni, titoli o qualifiche di Christina Back, certificazioni, partner, località, date, prezzi, recapiti, social o dati legali: usa segnaposto `{{COSÌ}}`. Fatti forniti: vedi `src/lib/content/seed.ts` e `DA-CONFERMARE.md`.
- Nessun prezzo nel sito pubblico: si invita a contattare la scuola. Il sito non elabora pagamenti; lo stato lo cambia solo l'amministrazione.
- Non dire che Backstage rilascia o prepara a certificazioni specifiche senza conferma.
- Libri: solo link Amazon forniti dalla scuola; informativa affiliazione attivabile dal pannello.
- Grafica: viola #5a33cc e magenta del logo su bianco (token in `src/app/globals.css`), titoli Plus Jakarta Sans, testo Inter, Fredoka solo per le parti dei bambini. Logo originale non modificato; cerchi e «B» solo come richiami grafici. Contrasto AA.
- AI tutor: non fa i compiti al posto dello studente, dichiara i limiti, niente dati personali, non è una valutazione ufficiale. Indica sempre se è dimostrativo o attivo.

## Come lavorare
- `npm run check` (tsc, eslint, vitest, build) verde prima di ogni commit. Commit piccoli in italiano.
- Anteprima: configurazione «backstage» nel `.claude/launch.json` di OneLink (porta 3300).
- Se cambi i dati iniziali o demo aumenta `SEED_VERSION` in `src/server/store/local.ts`.
- Privacy: ogni accesso ai dati degli studenti passa da `src/server/access.ts`.
- Dati: Supabase in produzione (`supabase/schema.sql`, solo funzioni `bs_*` con chiave service_role; test con PGlite in `tests/supabase.test.ts`), archivio locale `.data/` in sviluppo. Se cambi lo schema, deve restare rieseguibile senza perdere dati.
