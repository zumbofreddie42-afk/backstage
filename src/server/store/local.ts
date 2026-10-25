import "server-only";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { seedContent } from "@/lib/content/seed";
import { siteContentSchema, type SiteContent } from "@/lib/content/schema";
import { COLLECTIONS, type CollectionName, type Collections } from "@/lib/domain";
import { demoData } from "./demo";
import type { FileBlob, Store } from "./types";

/**
 * Store for development and the preview. Keeps everything in memory and, when `persist` is on,
 * mirrors it to `.data/backstage.json` (files in `.data/public` and `.data/private`). On read-only
 * hosts (e.g. Vercel) writes fail silently and data lives only in memory for that instance: a real
 * database is needed before going live (see README).
 *
 * Bump SEED_VERSION when src/lib/content/seed.ts or the demo data change: the stored content is
 * reset to the new seed (private records are kept).
 */
export const SEED_VERSION = 4;

type Records = { [K in CollectionName]: Collections[K][] };
type FileShape = { seedVersion: number; content: SiteContent; records: Records };

export const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "backstage.json");
const PUBLIC_DIR = path.join(DATA_DIR, "public");
const PRIVATE_DIR = path.join(DATA_DIR, "private");

function isDemoRecord(r: { id: string; studentId?: string | null }): boolean {
  return r.id.includes("_demo_") || Boolean(r.studentId?.startsWith("stu_demo_"));
}

function emptyRecords(): Records {
  return Object.fromEntries(COLLECTIONS.map((c) => [c, []])) as unknown as Records;
}

export class LocalStore implements Store {
  private data: FileShape;
  private memoryFiles = new Map<string, FileBlob>();

  constructor(
    private readonly persist: boolean,
    private readonly withDemo: boolean,
  ) {
    this.data = this.load();
  }

  private fresh(): FileShape {
    return { seedVersion: SEED_VERSION, content: seedContent(), records: this.withDemo ? demoData() : emptyRecords() };
  }

  private load(): FileShape {
    if (!this.persist || !existsSync(DATA_FILE)) return this.fresh();
    try {
      const parsed = JSON.parse(readFileSync(DATA_FILE, "utf8")) as FileShape;
      if (parsed.seedVersion !== SEED_VERSION) {
        const fresh = this.fresh();
        const kept = Object.fromEntries(
          // Demo records (ids containing "_demo_") are replaced by the new ones; real records are kept.
          COLLECTIONS.map((c) => [c, [...(parsed.records?.[c] ?? []).filter((r) => !isDemoRecord(r)), ...fresh.records[c]]]),
        ) as unknown as Records;
        return { ...fresh, records: kept };
      }
      const records = { ...emptyRecords(), ...parsed.records };
      if (!this.withDemo) {
        records.accounts = records.accounts.filter((a) => !a.demo);
        records.students = records.students.filter((s) => !s.demo);
      }
      return { seedVersion: SEED_VERSION, content: siteContentSchema.parse(parsed.content), records };
    } catch (err) {
      console.error("[store] .data/backstage.json non leggibile, riparto dai dati iniziali", err);
      return this.fresh();
    }
  }

  private save() {
    if (!this.persist) return;
    try {
      mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch {
      // Read-only filesystem: keep working in memory.
    }
  }

  async getContent() {
    return structuredClone(this.data.content);
  }

  async updateContent(mutate: (content: SiteContent) => void) {
    const next = structuredClone(this.data.content);
    mutate(next);
    this.data.content = siteContentSchema.parse(next);
    this.save();
    return structuredClone(this.data.content);
  }

  async list<K extends CollectionName>(name: K, filter?: (item: Collections[K]) => boolean) {
    const items = this.data.records[name] as Collections[K][];
    return structuredClone(filter ? items.filter(filter) : items);
  }

  async get<K extends CollectionName>(name: K, id: string) {
    const item = (this.data.records[name] as Collections[K][]).find((x) => (x as { id: string }).id === id);
    return item ? structuredClone(item) : null;
  }

  async insert<K extends CollectionName>(name: K, item: Collections[K]) {
    (this.data.records[name] as Collections[K][]).push(structuredClone(item));
    this.save();
  }

  async update<K extends CollectionName>(name: K, id: string, patch: Partial<Collections[K]>) {
    const items = this.data.records[name] as Collections[K][];
    const i = items.findIndex((x) => (x as { id: string }).id === id);
    const current = items[i];
    if (!current) return null;
    const next = { ...current, ...structuredClone(patch), id } as Collections[K];
    items[i] = next;
    this.save();
    return structuredClone(next);
  }

  async remove<K extends CollectionName>(name: K, id: string) {
    const items = this.data.records[name] as Collections[K][];
    (this.data.records[name] as Collections[K][]) = items.filter((x) => (x as { id: string }).id !== id);
    this.save();
  }

  private writeFile(dir: string, name: string, blob: FileBlob) {
    this.memoryFiles.set(`${dir}/${name}`, blob);
    if (!this.persist) return;
    try {
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, name), blob.bytes);
      writeFileSync(path.join(dir, `${name}.type`), blob.contentType);
    } catch {
      // Memory only.
    }
  }

  private readFile(dir: string, name: string): FileBlob | null {
    const mem = this.memoryFiles.get(`${dir}/${name}`);
    if (mem) return mem;
    const file = path.join(dir, name);
    if (!this.persist || !existsSync(file)) return null;
    const typeFile = `${file}.type`;
    const contentType = existsSync(typeFile) ? readFileSync(typeFile, "utf8") : "application/octet-stream";
    return { bytes: readFileSync(file), contentType };
  }

  private dropFile(dir: string, name: string) {
    this.memoryFiles.delete(`${dir}/${name}`);
    if (!this.persist) return;
    for (const f of [name, `${name}.type`]) {
      try {
        unlinkSync(path.join(dir, f));
      } catch {
        // Already gone.
      }
    }
  }

  async savePublicFile(name: string, bytes: Uint8Array, contentType: string) {
    this.writeFile(PUBLIC_DIR, name, { bytes, contentType });
    return `/api/media/${name}`;
  }

  async readPublicFile(name: string) {
    return this.readFile(PUBLIC_DIR, name);
  }

  async deletePublicFile(url: string) {
    if (url.startsWith("/api/media/")) this.dropFile(PUBLIC_DIR, url.slice("/api/media/".length));
  }

  async savePrivateFile(id: string, bytes: Uint8Array, contentType: string) {
    this.writeFile(PRIVATE_DIR, id, { bytes, contentType });
  }

  async readPrivateFile(id: string) {
    return this.readFile(PRIVATE_DIR, id);
  }

  async deletePrivateFile(id: string) {
    this.dropFile(PRIVATE_DIR, id);
  }
}
