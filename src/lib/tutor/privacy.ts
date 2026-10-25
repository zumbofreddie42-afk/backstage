const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Phone-like sequences: optional +, at least 8 digits allowing spaces, dots, dashes, parentheses.
const PHONE_RE = /(?:\+|00)?\d[\d\s.\-()]{6,}\d/g;

function looksLikePhone(match: string): boolean {
  return match.replace(/\D/g, "").length >= 8;
}

/** Removes emails and phone numbers before a message leaves the browser/server. */
export function redactPersonalData(text: string): { text: string; redacted: boolean } {
  let redacted = false;
  let out = text.replace(EMAIL_RE, () => {
    redacted = true;
    return "[email rimossa]";
  });
  out = out.replace(PHONE_RE, (m) => {
    if (!looksLikePhone(m)) return m;
    redacted = true;
    return "[numero rimosso]";
  });
  return { text: out, redacted };
}

export const MAX_MESSAGE_CHARS = 4000;
export const MAX_TURNS = 24;
