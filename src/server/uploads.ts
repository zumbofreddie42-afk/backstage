import "server-only";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const SIGNATURES: { type: string; ext: string; check: (b: Uint8Array) => boolean }[] = [
  { type: "application/pdf", ext: "pdf", check: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
  { type: "image/jpeg", ext: "jpg", check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/png", ext: "png", check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: "image/webp", ext: "webp", check: (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
];

export type CheckedUpload = { bytes: Uint8Array; contentType: string; ext: string; name: string };

/**
 * Accepts PDF/JPG/PNG (and WebP for site photos) by looking at the file's first bytes, not at the
 * name or the browser-declared type. Returns null for missing files, "invalid" when not acceptable.
 */
export async function checkUpload(value: FormDataEntryValue | null, opts: { images?: boolean; pdf?: boolean } = {}): Promise<CheckedUpload | null | "invalid"> {
  if (!value || typeof value === "string" || value.size === 0) return null;
  if (value.size > MAX_UPLOAD_BYTES) return "invalid";
  const bytes = new Uint8Array(await value.arrayBuffer());
  const sig = SIGNATURES.find((s) => s.check(bytes));
  if (!sig) return "invalid";
  if (sig.ext === "pdf" && opts.pdf === false) return "invalid";
  if (sig.ext === "webp" && !opts.images) return "invalid";
  const name = value.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || `file.${sig.ext}`;
  return { bytes, contentType: sig.type, ext: sig.ext, name };
}
