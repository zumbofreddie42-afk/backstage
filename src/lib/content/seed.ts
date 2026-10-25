import type { SiteContent } from "./schema";

/**
 * Starting content. Facts provided by the school (2026-10-25 brief): name "Backstage Online Languages",
 * founded and run by Christina Back, over 25 years of experience in teaching English, four age paths,
 * study trips linked to Trinity, AI homework assistant. Everything else is a {{PLACEHOLDER}} that the
 * school fills in from the staff panel (see DA-CONFERMARE.md). Bump SEED_VERSION in
 * src/server/store/local.ts when this file changes.
 */
export function seedContent(): SiteContent {
  return {
    home: {
      heroTitle: {
        it: "L'inglese apre nuove possibilità. Inizia il tuo percorso con Backstage.",
        en: "English opens up new possibilities. Start your journey with Backstage.",
      },
      heroText: {
        it: "Corsi di inglese per bambini, ragazzi e adulti, con un percorso pensato per ogni età e per i tuoi obiettivi.",
        en: "English courses for children, teenagers and adults, with a path designed for every age and for your goals.",
      },
      intro: {
        it: "Backstage Online Languages è la scuola di inglese fondata e diretta da Christina Back. Con oltre 25 anni di esperienza nell'insegnamento dell'inglese, accompagniamo bambini, ragazzi e adulti in percorsi su misura, con attenzione alla persona e ai suoi obiettivi.",
        en: "Backstage Online Languages is the English school founded and run by Christina Back. With over 25 years of experience in teaching English, we guide children, teenagers and adults through tailored paths, paying attention to each person and their goals.",
      },
      years: "25+",
    },
    about: {
      story: {
        it: "{{LA STORIA DI CHRISTINA BACK: come è nata la sua passione per l'insegnamento e come è nata Backstage}}",
        en: "{{CHRISTINA BACK'S STORY: how her passion for teaching began and how Backstage was born}}",
      },
      approach: {
        it: "{{IL SUO APPROCCIO ALL'INSEGNAMENTO, con parole sue}}",
        en: "{{HER APPROACH TO TEACHING, in her own words}}",
      },
      role: {
        it: "Christina Back ha fondato Backstage, la dirige ed è l'insegnante di tutti i corsi: segue personalmente ogni studente. {{ALTRO SU COSA FA OGNI GIORNO NELLA SCUOLA}}",
        en: "Christina Back founded Backstage, runs it and teaches every course: she follows each student personally. {{MORE ON WHAT SHE DOES EVERY DAY AT THE SCHOOL}}",
      },
      method: {
        it: "Backstage porta in ogni percorso oltre 25 anni di esperienza nell'insegnamento dell'inglese. {{IL METODO DI LAVORO: come sono organizzate le lezioni, come si seguono i progressi, il rapporto con studenti e famiglie}}",
        en: "Backstage brings over 25 years of experience in teaching English to every path. {{THE WORKING METHOD: how lessons are organised, how progress is followed, the relationship with students and families}}",
      },
      portrait: {
        id: "portrait",
        url: "",
        alt: { it: "Ritratto di Christina Back", en: "Portrait of Christina Back" },
        caption: { it: "", en: "" },
      },
      photos: [],
    },
    courses: [
      {
        id: "young",
        title: { it: "Young learners", en: "Young learners" },
        ages: { it: "3–10 anni", en: "Ages 3–10" },
        summary: {
          it: "Il primo incontro con l'inglese passa dal gioco: canzoni, storie e attività pratiche per abituarsi ai suoni della lingua e usarla con naturalezza.",
          en: "A first encounter with English through play: songs, stories and hands-on activities to get used to the sounds of the language and use it naturally.",
        },
        activities: {
          it: "Attività coinvolgenti e adatte all'età, con tempi brevi e tanta partecipazione: ascolto, giochi, filastrocche, primi vocaboli e semplici frasi di tutti i giorni.",
          en: "Engaging, age-appropriate activities with short sessions and plenty of participation: listening, games, rhymes, first words and simple everyday phrases.",
        },
        goals: {
          it: "Familiarizzare con la lingua, sviluppare l'ascolto e la curiosità, e prendere confidenza con l'inglese in modo sereno.",
          en: "Getting familiar with the language, developing listening skills and curiosity, and growing confident with English in a relaxed way.",
        },
      },
      {
        id: "middle",
        title: { it: "Scuola media", en: "Middle school" },
        ages: { it: "11–13 anni", en: "Ages 11–13" },
        summary: {
          it: "Percorsi per consolidare le basi e acquistare sicurezza quando si parla e si scrive in inglese.",
          en: "Paths to consolidate the basics and gain confidence when speaking and writing in English.",
        },
        activities: {
          it: "Ripasso e consolidamento della grammatica, ampliamento del lessico, esercizi di comprensione e momenti di conversazione guidata, con attenzione al programma scolastico.",
          en: "Grammar review and consolidation, vocabulary building, comprehension exercises and guided conversation, keeping the school curriculum in mind.",
        },
        goals: {
          it: "Rafforzare le basi, imparare a esprimersi con più sicurezza e affrontare con metodo i compiti di inglese.",
          en: "Strengthening the basics, learning to express yourself more confidently and approaching English homework with a method.",
        },
      },
      {
        id: "high",
        title: { it: "Scuola superiore", en: "Secondary school" },
        ages: { it: "14–18 anni", en: "Ages 14–18" },
        summary: {
          it: "Corsi per rafforzare le competenze linguistiche e prepararsi ai propri obiettivi scolastici o personali.",
          en: "Courses to strengthen language skills and prepare for school or personal goals.",
        },
        activities: {
          it: "Approfondimento di grammatica e lessico, lettura e analisi di testi, scrittura, ascolto e conversazione, con un lavoro mirato sui punti da migliorare.",
          en: "In-depth grammar and vocabulary, reading and analysing texts, writing, listening and conversation, with targeted work on the areas to improve.",
        },
        goals: {
          it: "Consolidare le quattro abilità linguistiche e lavorare verso gli obiettivi scolastici o personali di ogni studente.",
          en: "Consolidating the four language skills and working towards each student's school or personal goals.",
        },
      },
      {
        id: "adults",
        title: { it: "Adulti", en: "Adults" },
        ages: { it: "Dai 18 anni", en: "18 and over" },
        summary: {
          it: "Percorsi flessibili per chi vuole usare l'inglese per lavoro, studio o piacere personale.",
          en: "Flexible paths for anyone who wants to use English for work, study or personal enjoyment.",
        },
        activities: {
          it: "Lezioni costruite sui tuoi obiettivi: conversazione, lessico specifico, scrittura, ripasso della grammatica e preparazione a situazioni concrete.",
          en: "Lessons built around your goals: conversation, specific vocabulary, writing, grammar review and preparation for real-life situations.",
        },
        goals: {
          it: "Migliorare l'inglese in base alle tue esigenze personali, di studio o professionali, con tempi compatibili con i tuoi impegni.",
          en: "Improving your English according to your personal, study or professional needs, at a pace that fits your schedule.",
        },
      },
    ],
    placement: {
      steps: [
        {
          it: "Compili il modulo di richiesta qui sotto o ci contatti.",
          en: "Fill in the request form below or contact us.",
        },
        {
          it: "Concordiamo insieme giorno e modalità del test.",
          en: "We agree on the day and format of the test together.",
        },
        {
          it: "Svolgi il test d'ingresso. {{DURATA E MODALITÀ DEL TEST}}",
          en: "You take the placement test. {{TEST LENGTH AND FORMAT}}",
        },
        {
          it: "Ti indichiamo il livello di partenza e il percorso più adatto.",
          en: "We tell you your starting level and the most suitable path.",
        },
      ],
      note: {
        it: "Il test serve solo a individuare il livello di partenza: non è una certificazione.",
        en: "The test is only used to find your starting level: it is not a certificate.",
      },
    },
    trips: {
      intro: {
        it: "I viaggi studio sono un'occasione per vivere l'inglese ogni giorno. Qui trovi le informazioni comunicate dalla scuola su destinazioni, date, attività e modalità di partecipazione.",
        en: "Study trips are a chance to live English every day. Here you will find the information shared by the school about destinations, dates, activities and how to take part.",
      },
      trinityNote: {
        it: "{{IN CHE MODO I VIAGGI STUDIO SONO COLLEGATI A TRINITY (testo ufficiale fornito dalla scuola)}}",
        en: "{{HOW THE STUDY TRIPS ARE LINKED TO TRINITY (official text provided by the school)}}",
      },
      items: [
        {
          id: "trip-1",
          published: true,
          title: { it: "{{NOME DEL VIAGGIO STUDIO}}", en: "{{STUDY TRIP NAME}}" },
          destination: { it: "{{DESTINAZIONE}}", en: "{{DESTINATION}}" },
          dates: { it: "{{DATE}}", en: "{{DATES}}" },
          activities: { it: "{{ATTIVITÀ PREVISTE}}", en: "{{PLANNED ACTIVITIES}}" },
          participation: {
            it: "{{CHI PUÒ PARTECIPARE E COME ISCRIVERSI}}",
            en: "{{WHO CAN TAKE PART AND HOW TO SIGN UP}}",
          },
        },
      ],
    },
    resources: [],
    books: [],
    amazon: {
      affiliate: false,
      disclosure: {
        it: "In qualità di Affiliato Amazon, Backstage riceve un guadagno dagli acquisti idonei.",
        en: "As an Amazon Associate, Backstage earns from qualifying purchases.",
      },
    },
    testimonials: [],
    contact: {
      email: "{{EMAIL}}",
      phone: "{{TELEFONO}}",
      whatsapp: "",
      address: { it: "{{INDIRIZZO O \"Lezioni online\"}}", en: "{{ADDRESS OR \"Online lessons\"}}" },
      hours: { it: "{{ORARI DI SEGRETERIA}}", en: "{{OFFICE HOURS}}" },
      instagram: "",
      facebook: "",
      youtube: "",
      tiktok: "",
      linkedin: "",
    },
    legal: {
      owner: "{{TITOLARE / RAGIONE SOCIALE}}",
      vat: "{{PARTITA IVA}}",
      registeredOffice: "{{SEDE LEGALE}}",
      privacyEmail: "{{EMAIL PER LA PRIVACY}}",
      privacyExtra: { it: "", en: "" },
    },
    reminders: {
      paymentDaysBefore: 5,
      lessonHoursBefore: 24,
      autoPayment: true,
      autoLesson: false,
      emailChannel: false,
      notifyGuardians: true,
      notifyStudents: true,
    },
  };
}
