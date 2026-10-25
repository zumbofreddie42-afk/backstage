import { isPlaceholder, type SiteContent } from "@/lib/content/schema";

type Contact = SiteContent["contact"];

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** wa.me link from the WhatsApp number set by the school (null when not provided). */
export function whatsappHref(number: string): string | null {
  if (isPlaceholder(number)) return null;
  const digits = number.replace(/\D/g, "").replace(/^00/, "");
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

const SOCIALS: { key: keyof Contact; name: string }[] = [
  { key: "instagram", name: "Instagram" },
  { key: "youtube", name: "YouTube" },
  { key: "tiktok", name: "TikTok" },
  { key: "linkedin", name: "LinkedIn" },
];

/** Only official profiles entered by the school (https links). */
export function socialLinks(contact: Contact): { name: string; url: string }[] {
  return SOCIALS.map((s) => ({ name: s.name, url: String(contact[s.key] ?? "") })).filter((s) => /^https:\/\//.test(s.url));
}
