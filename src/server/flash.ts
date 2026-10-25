import "server-only";
import { cookies } from "next/headers";

export async function readFlash(): Promise<string | null> {
  return (await cookies()).get("bs_flash")?.value ?? null;
}
