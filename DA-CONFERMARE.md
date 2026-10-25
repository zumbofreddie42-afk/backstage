# Backstage Online Languages — cosa manca prima di pubblicare

Il sito è in **anteprima** (`SITE_MODE` non impostato): i segnaposto `{{COSÌ}}` sono evidenziati in viola, gli account demo funzionano e i motori di ricerca non indicizzano nulla. Quasi tutto si completa dal pannello **/staff → Contenuti del sito** (la pagina mostra quanti segnaposto restano per ogni sezione).

## Dati forniti finora (brief del 25/10/2026)
- Nome: Backstage Online Languages; fondata e diretta da **Christina Back**, che è l'unica persona che lavora nella scuola e insegna in tutti i corsi (25/10/2026).
- I materiali dei corsi sono su **Google Classroom**; ogni studente ha le sue credenziali personali.
- Oltre 25 anni di esperienza nell'insegnamento dell'inglese.
- Quattro percorsi: Young learners 3–10, scuola media, scuola superiore, adulti 18+.
- Viaggi studio collegati a Trinity; test d'ingresso; assistente AI per i compiti.
- Logo (file ricevuto: 150×150 px).

## Da chiedere alla scuola
### Identità e grafica
- [ ] **Logo in alta risoluzione** (PNG con sfondo trasparente o SVG): quello ricevuto è 150×150 px e va bene solo per icone piccole.
- [ ] Foto autentiche (ritratto di Christina, lezioni, attività) con il **consenso delle persone ritratte** — per i minori serve il consenso dei genitori.

### Chi siamo (Christina Back)
- [ ] La sua storia, il suo approccio all'insegnamento, cosa fa ogni giorno nella scuola, il metodo di lavoro.
- [ ] Titoli o qualifiche **solo se** la scuola vuole indicarli (il sito ora non ne cita nessuno).

### Corsi e test
- [ ] Verificare i testi dei quattro percorsi (scritti in modo generico, senza promesse di risultati) e le fasce d'età di media/superiori (11–13, 14–18).
- [ ] Le lezioni sono online, in sede o entrambe? (oggi il sito non lo dice)
- [ ] Durata e modalità del test d'ingresso (segnaposto nel passaggio 3).
- [ ] Certificazioni: il sito dice solo che si può allegare quella già posseduta. Non dice che Backstage prepara a certificazioni: aggiungerlo solo se la scuola lo conferma.

### Viaggi studio Trinity
- [ ] Testo ufficiale sul collegamento con Trinity (quale Trinity, che tipo di accordo).
- [ ] Per ogni viaggio: nome, destinazione, date, attività, chi può partecipare e come iscriversi. Un viaggio con segnaposto non compare nel sito pubblicato.

### Risorse e libri
- [ ] Link ai materiali didattici da pubblicare (con età, livello, argomento).
- [ ] Link Amazon dei libri consigliati (**solo quelli forniti da Backstage**) e se sono link affiliati: in quel caso attivare l'informativa nel pannello.

### Testimonianze
- [ ] Solo recensioni autentiche con autorizzazione scritta a pubblicarle. Finché non ci sono la sezione non compare.

### Contatti e dati legali
- [ ] Email, telefono, numero WhatsApp, indirizzo (o «lezioni online»), orari di segreteria.
- [ ] **Link esatti di Instagram e Facebook della scuola** (richiesti il 25/10/2026: in rete non si trovano profili ufficiali «Backstage Online Languages»; su LinkedIn la scuola compare come «Backstage English»). Si inseriscono dal pannello → Contenuti → Contatti e social.
- [ ] Nome ufficiale da usare ovunque: «Backstage Online Languages» o «Backstage English»?
- [ ] Titolare/ragione sociale, partita IVA, sede legale, email per la privacy.
- [ ] Tempi di conservazione dei dati; far verificare **informativa privacy e cookie** a un consulente.
- [ ] Accordo di trattamento dati con Supabase (database), Vercel (hosting), il fornitore dell'AI (Anthropic) e il servizio email (Resend), se usati.

### Pagamenti e promemoria
- [ ] Come la scuola comunica i piani di pagamento (rate, scadenze, importi): si inseriscono a mano per ogni studente, il sito **non incassa**.
- [ ] Quanti giorni prima della scadenza inviare il promemoria (oggi 5) e se mandarlo anche via email.

### Google Classroom
- [ ] Per ogni studente: link della classe su Classroom (ed eventuale codice del corso), da inserire nella sua scheda nel pannello.

## Prima di passare a `SITE_MODE=live`
- [ ] Nessun segnaposto rimasto nelle sezioni pubbliche (pannello → Contenuti).
- [ ] Progetto Supabase creato e `supabase/schema.sql` eseguito; `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` su Vercel (vedi README, «Pubblicare su Vercel»).
- [ ] `ADMIN_PASSWORD` e `SESSION_SECRET` impostate su Vercel.
- [ ] `ANTHROPIC_API_KEY` per il tutor AI (altrimenti resta dimostrativo) e un limite di spesa sull'account.
- [ ] `RESEND_API_KEY` + `EMAIL_FROM` se si vogliono avvisi e promemoria via email; `CRON_SECRET` per i promemoria automatici.
- [ ] Dominio e `NEXT_PUBLIC_SITE_URL`.
