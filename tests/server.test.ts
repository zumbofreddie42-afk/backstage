import { beforeEach, describe, expect, it } from "vitest";
import type { Account } from "@/lib/domain";
import { canSeeStudent, dashboardData, pickStudent, visibleStudentIds } from "@/server/access";
import { decodeToken, encodeToken, staffRoleForPassword } from "@/server/auth";
import { hashPassword, temporaryPassword, verifyPassword } from "@/server/passwords";
import { getStore, resetStoreForTests } from "@/server/store";
import { DEMO_PASSWORD } from "@/server/store/demo";

const account = (patch: Partial<Account>): Account => ({
  id: "acc",
  role: "student",
  name: "Test",
  email: "t@example.com",
  passwordHash: "",
  mustChangePassword: false,
  active: true,
  studentId: null,
  guardianOf: [],
  locale: "it",
  demo: false,
  createdAt: "",
  lastLoginAt: null,
  ...patch,
});

beforeEach(() => resetStoreForTests());

describe("student privacy", () => {
  it("a student sees only their own profile", () => {
    const a = account({ role: "student", studentId: "s1", guardianOf: ["s2"] });
    expect(visibleStudentIds(a)).toEqual(["s1"]);
    expect(canSeeStudent(a, "s2")).toBe(false);
    expect(canSeeStudent(a, null)).toBe(false);
  });

  it("a guardian sees only linked students", () => {
    const g = account({ role: "guardian", guardianOf: ["s1", "s2"] });
    expect(canSeeStudent(g, "s1")).toBe(true);
    expect(canSeeStudent(g, "s3")).toBe(false);
  });

  it("a deactivated account sees nothing", () => {
    expect(visibleStudentIds(account({ studentId: "s1", active: false }))).toEqual([]);
  });

  it("a guardian cannot open a student who is not theirs, even by asking for the id", async () => {
    const accounts = await getStore().list("accounts");
    const parent = accounts.find((a) => a.role === "guardian")!;
    const { student } = await pickStudent(parent, "stu_demo_marco");
    expect(student?.id).not.toBe("stu_demo_marco");
    expect(parent.guardianOf).toContain(student?.id);
  });

  it("dashboard data contains only the chosen student's records", async () => {
    const data = await dashboardData("stu_demo_giulia");
    const all = [...data.lessons, ...data.progress, ...data.appointments, ...data.assignments, ...data.payments, ...data.shares];
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((r) => r.studentId === "stu_demo_giulia")).toBe(true);
  });
});

describe("passwords and sessions", () => {
  it("hashes and verifies passwords", () => {
    const h = hashPassword("una password lunga");
    expect(verifyPassword("una password lunga", h)).toBe(true);
    expect(verifyPassword("sbagliata", h)).toBe(false);
    expect(temporaryPassword()).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
  });

  it("demo accounts use the demo password", async () => {
    const [demo] = await getStore().list("accounts", (a) => a.demo);
    expect(verifyPassword(DEMO_PASSWORD, demo!.passwordHash)).toBe(true);
  });

  it("rejects tampered or expired session tokens", () => {
    const token = encodeToken({ kind: "user", accountId: "acc_1", exp: Date.now() + 60_000 });
    expect(decodeToken(token)).toMatchObject({ kind: "user", accountId: "acc_1" });
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ kind: "staff", role: "admin", exp: Date.now() + 60_000 })).toString("base64url");
    expect(decodeToken(`${forged}.${sig}`)).toBeNull();
    expect(decodeToken(`${payload}.x${sig}`)).toBeNull();
    expect(decodeToken(encodeToken({ kind: "user", accountId: "a", exp: Date.now() - 1 }))).toBeNull();
  });

  it("staff roles come only from the configured passwords", () => {
    expect(staffRoleForPassword("anteprima")).toBe("admin");
    expect(staffRoleForPassword("altro")).toBeNull();
  });
});

describe("store", () => {
  it("validates content updates", async () => {
    const store = getStore();
    await expect(
      store.updateContent((c) => {
        (c.home as unknown as { years: number }).years = 42;
      }),
    ).rejects.toThrow();
    const updated = await store.updateContent((c) => {
      c.home.years = "30+";
    });
    expect(updated.home.years).toBe("30+");
  });

  it("keeps private files separate from public ones", async () => {
    const store = getStore();
    await store.savePrivateFile("file_x", new Uint8Array([1, 2, 3]), "application/pdf");
    expect(await store.readPublicFile("file_x")).toBeNull();
    expect((await store.readPrivateFile("file_x"))?.contentType).toBe("application/pdf");
  });
});
