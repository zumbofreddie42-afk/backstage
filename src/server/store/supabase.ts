import "server-only";
import { createClient } from "@supabase/supabase-js";
import { seedContent } from "@/lib/content/seed";
import { siteContentSchema, type SiteContent } from "@/lib/content/schema";
import { COLLECTIONS, type CollectionName, type Collections } from "@/lib/domain";
import { demoData } from "./demo";
import type { FileBlob, Store } from "./types";

/** Calls one of the bs_* SQL functions of supabase/schema.sql. */
export type Rpc = (fn: string, args: Record<string, unknown>) => Promise<unknown>;

/** The two private Storage buckets ("media" for site photos, "private" for certificates). */
export type FileBucket = {
  upload(bucket: string, name: string, bytes: Uint8Array, contentType: string): Promise<void>;
  download(bucket: string, name: string): Promise<FileBlob | null>;
  remove(bucket: string, name: string): Promise<void>;
};

const MEDIA = "media";
const PRIVATE = "private";
const CONTENT_RETRIES = 3;

function contentTypeFor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "application/octet-stream";
}

/**
 * Production store on Supabase (schema in supabase/schema.sql). Only the server talks to the database,
 * with the service-role key, and only through the bs_* SQL functions; RLS stays closed to the public key.
 * In preview the fictional demo records are added once; in live mode they are removed.
 */
export class SupabaseStore implements Store {
  private ready: Promise<void> | null = null;

  constructor(
    private readonly rpc: Rpc,
    private readonly files: FileBucket,
    private readonly withDemo: boolean,
  ) {}

  static fromEnv(url: string, serviceRoleKey: string, withDemo: boolean): SupabaseStore {
    const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const rpc: Rpc = async (fn, args) => {
      const { data, error } = await db.rpc(fn, args);
      if (error) throw new Error(`[supabase] ${fn}: ${error.message}`);
      return data;
    };
    const files: FileBucket = {
      async upload(bucket, name, bytes, contentType) {
        const { error } = await db.storage.from(bucket).upload(name, bytes, { contentType, upsert: true });
        if (error) throw new Error(`[supabase] storage ${bucket}: ${error.message}`);
      },
      async download(bucket, name) {
        const { data, error } = await db.storage.from(bucket).download(name);
        if (error || !data) return null;
        return { bytes: new Uint8Array(await data.arrayBuffer()), contentType: data.type || contentTypeFor(name) };
      },
      async remove(bucket, name) {
        await db.storage.from(bucket).remove([name]);
      },
    };
    return new SupabaseStore(rpc, files, withDemo);
  }

  private ensureReady(): Promise<void> {
    this.ready ??= this.init().catch((err) => {
      this.ready = null; // retry on the next request
      throw err;
    });
    return this.ready;
  }

  private async init() {
    await this.rpc("bs_content_init", { p_data: seedContent() });
    if (!this.withDemo) {
      await this.rpc("bs_purge_demo", {});
      return;
    }
    if (await this.rpc("bs_get", { p_collection: "accounts", p_id: "acc_demo_student" })) return;
    const demo = demoData();
    for (const name of COLLECTIONS) {
      for (const item of demo[name] as { id: string }[]) {
        await this.rpc("bs_insert", { p_collection: name, p_id: item.id, p_data: item });
      }
    }
  }

  private async readContent(): Promise<{ data: SiteContent; version: number }> {
    const row = (await this.rpc("bs_content_get", {})) as { data: unknown; version: number } | null;
    if (!row) throw new Error("[supabase] site_content mancante");
    return { data: siteContentSchema.parse(row.data), version: row.version };
  }

  async getContent() {
    await this.ensureReady();
    return (await this.readContent()).data;
  }

  async updateContent(mutate: (content: SiteContent) => void) {
    await this.ensureReady();
    for (let attempt = 0; attempt < CONTENT_RETRIES; attempt++) {
      const { data, version } = await this.readContent();
      mutate(data);
      const next = siteContentSchema.parse(data);
      if (await this.rpc("bs_content_put", { p_expected: version, p_data: next })) return next;
      // Someone else saved in the meantime: re-read and apply the change again.
    }
    throw new Error("[supabase] contenuti modificati da un altro salvataggio: riprova");
  }

  async list<K extends CollectionName>(name: K, filter?: (item: Collections[K]) => boolean) {
    await this.ensureReady();
    const items = ((await this.rpc("bs_list", { p_collection: name })) ?? []) as Collections[K][];
    return filter ? items.filter(filter) : items;
  }

  async get<K extends CollectionName>(name: K, id: string) {
    await this.ensureReady();
    return ((await this.rpc("bs_get", { p_collection: name, p_id: id })) ?? null) as Collections[K] | null;
  }

  async insert<K extends CollectionName>(name: K, item: Collections[K]) {
    await this.ensureReady();
    await this.rpc("bs_insert", { p_collection: name, p_id: (item as { id: string }).id, p_data: item });
  }

  async update<K extends CollectionName>(name: K, id: string, patch: Partial<Collections[K]>) {
    await this.ensureReady();
    // JSON drops `undefined`; explicit nulls (e.g. doneAt: null) are kept and overwrite the old value.
    return ((await this.rpc("bs_patch", { p_collection: name, p_id: id, p_patch: patch })) ?? null) as Collections[K] | null;
  }

  async remove<K extends CollectionName>(name: K, id: string) {
    await this.ensureReady();
    await this.rpc("bs_delete", { p_collection: name, p_id: id });
  }

  async savePublicFile(name: string, bytes: Uint8Array, contentType: string) {
    await this.files.upload(MEDIA, name, bytes, contentType);
    return `/api/media/${name}`;
  }

  async readPublicFile(name: string) {
    return this.files.download(MEDIA, name);
  }

  async deletePublicFile(url: string) {
    if (url.startsWith("/api/media/")) await this.files.remove(MEDIA, url.slice("/api/media/".length));
  }

  async savePrivateFile(id: string, bytes: Uint8Array, contentType: string) {
    await this.files.upload(PRIVATE, id, bytes, contentType);
  }

  async readPrivateFile(id: string) {
    return this.files.download(PRIVATE, id);
  }

  async deletePrivateFile(id: string) {
    await this.files.remove(PRIVATE, id);
  }
}
