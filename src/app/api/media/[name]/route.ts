import { getStore } from "@/server/store";

/** Public site photos uploaded from the staff panel. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-z0-9_-]+\.(jpe?g|png|webp)$/i.test(name)) return new Response("Non trovato", { status: 404 });
  const file = await getStore().readPublicFile(name);
  if (!file) return new Response("Non trovato", { status: 404 });
  return new Response(new Uint8Array(file.bytes), {
    headers: { "Content-Type": file.contentType, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
