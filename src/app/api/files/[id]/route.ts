import { canSeeStudent } from "@/server/access";
import { getCurrentAccount, getStaffSession } from "@/server/auth";
import { getStore } from "@/server/store";

/**
 * Private files (certificates). Staff can open any file; a student or guardian only files of the
 * students they can see. Files from the public placement form (studentId null) are staff-only.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const meta = await store.get("files", id);
  if (!meta) return new Response("Non trovato", { status: 404 });

  const staff = await getStaffSession();
  if (!staff) {
    const account = await getCurrentAccount();
    if (!account || !canSeeStudent(account, meta.studentId)) return new Response("Non trovato", { status: 404 });
  }
  const file = await store.readPrivateFile(id);
  if (!file) return new Response("Non trovato", { status: 404 });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": meta.contentType,
      "Content-Disposition": `inline; filename="${meta.name.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
