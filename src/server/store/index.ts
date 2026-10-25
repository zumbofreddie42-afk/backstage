import "server-only";
import { getSiteMode, getStoreKind } from "@/server/config";
import { LocalStore } from "./local";
import type { Store } from "./types";

export type { Store } from "./types";

// One instance per server process (Next.js may load this module from several bundles).
const globalForStore = globalThis as unknown as { __backstageStore?: Store };

export function getStore(): Store {
  if (!globalForStore.__backstageStore) {
    globalForStore.__backstageStore = new LocalStore(getStoreKind() === "local", getSiteMode() === "preview");
  }
  return globalForStore.__backstageStore;
}

/** Tests only. */
export function resetStoreForTests() {
  globalForStore.__backstageStore = undefined;
}
