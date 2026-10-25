import "server-only";
import { getSiteMode, getStoreKind } from "@/server/config";
import { LocalStore } from "./local";
import { SupabaseStore } from "./supabase";
import type { Store } from "./types";

export type { Store } from "./types";

// One instance per server process (Next.js may load this module from several bundles).
const globalForStore = globalThis as unknown as { __backstageStore?: Store };

export function getStore(): Store {
  if (!globalForStore.__backstageStore) {
    const kind = getStoreKind();
    const withDemo = getSiteMode() === "preview";
    globalForStore.__backstageStore =
      kind === "supabase"
        ? SupabaseStore.fromEnv(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, withDemo)
        : new LocalStore(kind === "local", withDemo);
  }
  return globalForStore.__backstageStore;
}

/** Tests only. */
export function resetStoreForTests() {
  globalForStore.__backstageStore = undefined;
}
