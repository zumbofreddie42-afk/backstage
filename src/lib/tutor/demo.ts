import type { TutorSettings } from "./prompt";

/**
 * Scripted answers for demo mode (no AI connected). They show the tutor's style: a hint first,
 * then an explanation, then an example, and never the finished homework. Always labelled as samples.
 */
type Reply = { it: string; en: string };

const R = {
  presentPerfect: {
    it: "Ottima scelta! Partiamo da una domanda: secondo te, la frase «I have visited London» parla di *quando* sei andato a Londra, oppure del fatto che *nella tua vita* ci sei stato?\n\n**Indizio:** guarda se nella frase c'è un momento preciso del passato (come *yesterday* o *in 2020*).\n\nProva a rispondere e poi andiamo avanti insieme con la regola.",
    en: "Great choice! Let's start with a question: does the sentence \"I have visited London\" tell us *when* you went, or that you went *at some point in your life*?\n\n**Hint:** check whether the sentence has a specific time in the past (like *yesterday* or *in 2020*).\n\nTry to answer, then we'll look at the rule together.",
  },
  checkText: {
    it: "Certo! Incolla il tuo testo qui. Non lo riscriverò tutto io: ti indicherò gli errori uno o due alla volta, ti dirò di che tipo sono (ad esempio *tempo verbale* o *preposizione*) e proverai tu a correggerli.\n\nEsempio di come lavoreremo: in «She go to school every day» c'è un errore sul **verbo**. Riesci a trovarlo? (Pensa alla terza persona singolare.)",
    en: "Sure! Paste your text here. I won't rewrite it for you: I'll point out one or two mistakes at a time, tell you what kind they are (for example *verb tense* or *preposition*) and you'll try to fix them.\n\nHere's how we'll work: in \"She go to school every day\" there's a mistake with the **verb**. Can you find it? (Think about the third person singular.)",
  },
  practiceYoung: {
    it: "Giochiamo con i colori! 🎨 (Fallo insieme a un adulto.)\n\n1. Di che colore è il sole? *The sun is ...*\n2. Di che colore è l'erba? *The grass is ...*\n3. Di che colore è il mare? *The sea is ...*\n\nScrivi le tue risposte e le guardiamo insieme!",
    en: "Let's play with colours! 🎨 (Do it with an adult.)\n\n1. What colour is the sun? *The sun is ...*\n2. What colour is the grass? *The grass is ...*\n3. What colour is the sea? *The sea is ...*\n\nWrite your answers and we'll check them together!",
  },
  practice: {
    it: "Facciamo un breve esercizio di vocaboli. Completa con la parola giusta tra: *borrow, lend, rent*.\n\n1. Can I ___ your pen for a minute?\n2. My brother never wants to ___ me his bike.\n3. We are going to ___ a flat by the sea this summer.\n\nScrivi le tue risposte: ti darò un riscontro frase per frase, spiegandoti il perché.",
    en: "Let's do a short vocabulary exercise. Fill in the gaps with *borrow, lend* or *rent*.\n\n1. Can I ___ your pen for a minute?\n2. My brother never wants to ___ me his bike.\n3. We are going to ___ a flat by the sea this summer.\n\nWrite your answers: I'll give you feedback on each sentence and explain why.",
  },
  exercise: {
    it: "Volentieri! Incolla la consegna dell'esercizio (senza nomi o dati personali).\n\nPrima di tutto, proviamo a capirla insieme: **quale azione ti chiede** la consegna? (Ad esempio: completare, abbinare, trasformare, scrivere.) Dimmelo con parole tue e poi affrontiamo il primo punto.",
    en: "Happy to help! Paste the exercise instructions (without names or personal details).\n\nFirst, let's understand them together: **what action** are the instructions asking for? (For example: complete, match, transform, write.) Tell me in your own words, then we'll tackle the first item.",
  },
  hint: {
    it: "Ecco un indizio: rileggi la frase e cerca le **parole chiave** che indicano il tempo (per esempio *already, yet, since, ago*). Ti aiutano a scegliere il tempo verbale giusto. Che cosa noti?",
    en: "Here's a hint: read the sentence again and look for **time words** (for example *already, yet, since, ago*). They help you choose the right tense. What do you notice?",
  },
  explain: {
    it: "Proviamo in modo più semplice. Il **present perfect** (*have/has* + participio) si usa quando non importa *quando* è successa una cosa, ma che sia successa: *I have seen this film.*\nIl **past simple** si usa quando diciamo *quando*: *I saw this film yesterday.*\n\nSe hai dubbi su un caso particolare, chiedi conferma al tuo insegnante.",
    en: "Let's make it simpler. We use the **present perfect** (*have/has* + past participle) when *when* it happened doesn't matter, only that it happened: *I have seen this film.*\nWe use the **past simple** when we say *when*: *I saw this film yesterday.*\n\nIf you're unsure about a specific case, check with your teacher.",
  },
  example: {
    it: "Ecco un esempio simile (non è la soluzione del tuo esercizio):\n\n*Have you ever eaten sushi?* → **Yes, I have eaten sushi twice.**\n*When did you eat it?* → **I ate it last week.**\n\nVedi la differenza? Ora prova tu con il primo punto del tuo esercizio.",
    en: "Here's a similar example (not the answer to your exercise):\n\n*Have you ever eaten sushi?* → **Yes, I have eaten sushi twice.**\n*When did you eat it?* → **I ate it last week.**\n\nCan you see the difference? Now try the first item of your exercise.",
  },
  fallback: {
    it: "Bella domanda! Per aiutarti al meglio, dimmi: si tratta di **grammatica, vocaboli, pronuncia, lettura o scrittura**? Se è un esercizio, incolla la consegna e partiamo da un indizio, così ci arrivi da solo.",
    en: "Good question! To help you best, tell me: is it about **grammar, vocabulary, pronunciation, reading or writing**? If it's an exercise, paste the instructions and we'll start with a hint, so you can get there yourself.",
  },
} satisfies Record<string, Reply>;

export function demoReply(message: string, settings: TutorSettings): string {
  const m = message.toLowerCase();
  let reply: Reply;
  if (/indizio|hint/.test(m)) reply = R.hint;
  else if (/esempio|example/.test(m)) reply = R.example;
  else if (/più semplice|meglio|non ho capito|simpl|didn.t understand/.test(m)) reply = R.explain;
  else if (/present perfect/.test(m)) reply = R.presentPerfect;
  else if (/controlla|correggi|check|correct/.test(m)) reply = R.checkText;
  else if (/esercit|practi[sc]e|parole del mio livello|words at my level/.test(m))
    reply = settings.ageBand === "young" ? R.practiceYoung : R.practice;
  else if (/esercizio|consegna|exercise|instructions/.test(m)) reply = R.exercise;
  else reply = R.fallback;
  return settings.explainIn === "it" ? reply.it : reply.en;
}
