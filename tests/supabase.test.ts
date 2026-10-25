// Runs supabase/schema.sql in an in-process Postgres (PGlite) with stand-ins for Supabase's roles and
// storage schema, then drives the real SupabaseStore through the bs_* functions.
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { seedContent } from "@/lib/content/seed";
import type { FileBlob } from "@/server/store/types";
import { SupabaseStore, type FileBucket, type Rpc } from "@/server/store/supabase";

let db: PGlite;

const rpc: Rpc = async (fn, args) => {
  const keys = Object.keys(args);
  const sql = `select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as r`;
  const values = keys.map((k) => {
    const v = args[k];
    return v !== null && typeof v === "object" ? JSON.stringify(v) : v;
  });
  const res = await db.query<{ r: unknown }>(sql, values);
  return res.rows[0]?.r ?? null;
};

function memoryFiles(): FileBucket {
  const files = new Map<string, FileBlob>();
  return {
    async upload(bucket, name, bytes, contentType) {
      files.set(`${bucket}/${name}`, { bytes, contentType });
    },
    async download(bucket, name) {
      return files.get(`${bucket}/${name}`) ?? null;
    },
    async remove(bucket, name) {
      files.delete(`${bucket}/${name}`);
    },
  };
}

async function asRole(role: string, sql: string) {
  await db.exec(`set role ${role}`);
  try {
    return await db.query(sql);
  } finally {
    await db.exec("reset role");
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  `);
  await db.exec(readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8"));
  // Supabase grants table access to its API roles by default; the schema must still keep them out.
  await db.exec(`
    grant usage on schema public to anon, authenticated, service_role;
    grant all on all tables in schema public to service_role;
  `);
});

describe("Supabase schema", () => {
  it("can be run twice without errors", async () => {
    await expect(db.exec(readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8"))).resolves.not.toThrow();
  });

  it("creates two private storage buckets", async () => {
    const res = await db.query<{ id: string; public: boolean }>("select id, public from storage.buckets order by id");
    expect(res.rows).toEqual([
      { id: "media", public: false },
      { id: "private", public: false },
    ]);
  });

  it("keeps the public API keys out of the data and the functions", async () => {
    await db.query("insert into public.records (collection, id, data) values ('students', 'x1', '{}') on conflict do nothing");
    await expect(asRole("anon", "select * from public.records")).rejects.toThrow(/permission denied/);
    await expect(asRole("authenticated", "select * from public.site_content")).rejects.toThrow(/permission denied/);
    await expect(asRole("anon", "select public.bs_list('students')")).rejects.toThrow(/permission denied/);
    const ok = await asRole("service_role", "select public.bs_list('students') as r");
    expect(ok.rows).toHaveLength(1);
    await db.query("delete from public.records where id = 'x1'");
  });

  it("rejects unknown collections", async () => {
    await expect(rpc("bs_insert", { p_collection: "hacked", p_id: "1", p_data: {} })).rejects.toThrow();
  });
});

describe("SupabaseStore", () => {
  it("initialises the content and the demo data once", async () => {
    const store = new SupabaseStore(rpc, memoryFiles(), true);
    expect((await store.getContent()).home.years).toBe(seedContent().home.years);
    const students = await store.list("students");
    expect(students.map((s) => s.id)).toContain("stu_demo_giulia");
    // A second instance (e.g. another serverless function) does not duplicate anything.
    const again = new SupabaseStore(rpc, memoryFiles(), true);
    expect(await again.list("students")).toHaveLength(students.length);
  });

  it("inserts, patches, filters and deletes records", async () => {
    const store = new SupabaseStore(rpc, memoryFiles(), true);
    await store.insert("assignments", {
      id: "asg_t1",
      studentId: "stu_demo_leo",
      title: "Test",
      description: "",
      url: "",
      dueDate: "",
      doneAt: null,
      createdAt: new Date().toISOString(),
    });
    const done = await store.update("assignments", "asg_t1", { doneAt: "2026-11-01T10:00:00.000Z" });
    expect(done?.doneAt).toBe("2026-11-01T10:00:00.000Z");
    expect(done?.title).toBe("Test");
    const undone = await store.update("assignments", "asg_t1", { doneAt: null });
    expect(undone?.doneAt).toBeNull();
    expect((await store.list("assignments", (a) => a.studentId === "stu_demo_leo")).map((a) => a.id)).toContain("asg_t1");
    const row = await db.query<{ student_id: string }>("select student_id from public.records where id = 'asg_t1'");
    expect(row.rows[0]?.student_id).toBe("stu_demo_leo");
    await store.remove("assignments", "asg_t1");
    expect(await store.get("assignments", "asg_t1")).toBeNull();
    expect(await store.update("assignments", "missing", { title: "x" })).toBeNull();
  });

  it("validates content and does not lose concurrent saves", async () => {
    const a = new SupabaseStore(rpc, memoryFiles(), true);
    const b = new SupabaseStore(rpc, memoryFiles(), true);
    await Promise.all([
      a.updateContent((c) => {
        c.home.years = "30+";
      }),
      b.updateContent((c) => {
        c.contact.email = "info@example.com";
      }),
    ]);
    const content = await a.getContent();
    expect(content.home.years).toBe("30+");
    expect(content.contact.email).toBe("info@example.com");
    await expect(
      a.updateContent((c) => {
        (c.home as unknown as { years: number }).years = 1;
      }),
    ).rejects.toThrow();
  });

  it("removes demo data when the site is live", async () => {
    const live = new SupabaseStore(rpc, memoryFiles(), false);
    expect(await live.list("students", (s) => s.demo)).toHaveLength(0);
    expect(await live.list("accounts", (a) => a.demo)).toHaveLength(0);
    expect(await live.list("lessons", (l) => l.studentId.startsWith("stu_demo_"))).toHaveLength(0);
  });

  it("stores public and private files in separate buckets", async () => {
    const store = new SupabaseStore(rpc, memoryFiles(), false);
    const url = await store.savePublicFile("img_1.jpg", new Uint8Array([1]), "image/jpeg");
    expect(url).toBe("/api/media/img_1.jpg");
    await store.savePrivateFile("file_1", new Uint8Array([2]), "application/pdf");
    expect(await store.readPublicFile("file_1")).toBeNull();
    expect((await store.readPrivateFile("file_1"))?.contentType).toBe("application/pdf");
    await store.deletePublicFile(url);
    expect(await store.readPublicFile("img_1.jpg")).toBeNull();
  });
});
