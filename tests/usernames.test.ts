import { describe, expect, it } from "vitest";
import { baseUsername, isClassroomUrl, matchesLogin, uniqueUsername, USERNAME_RE } from "@/lib/usernames";
import { getStore, resetStoreForTests } from "@/server/store";

describe("student credentials", () => {
  it("builds readable usernames from the display name", () => {
    expect(baseUsername("Giulia R.")).toBe("giulia.r");
    expect(baseUsername("Niccolò D'Agostino")).toBe("niccolo.d.agostino");
    expect(baseUsername("Leo R. (demo)")).toBe("leo.r");
    expect(baseUsername("Al")).toMatch(USERNAME_RE);
  });

  it("never reuses a username", () => {
    expect(uniqueUsername("Giulia R.", ["giulia.r", "giulia.r2"])).toBe("giulia.r3");
    expect(uniqueUsername("Marco", [])).toBe("marco");
  });

  it("logs in with username or email, ignoring case", () => {
    const child = { email: "", username: "leo.r" };
    expect(matchesLogin(child, " Leo.R ")).toBe(true);
    expect(matchesLogin(child, "")).toBe(false);
    const adult = { email: "anna@example.com", username: "anna.b" };
    expect(matchesLogin(adult, "ANNA@example.com")).toBe(true);
    expect(matchesLogin(adult, "anna.b")).toBe(true);
    expect(matchesLogin(adult, "anna")).toBe(false);
  });

  it("accepts only Google Classroom links", () => {
    expect(isClassroomUrl("https://classroom.google.com/c/NjM2ODk")).toBe(true);
    expect(isClassroomUrl("http://classroom.google.com/c/x")).toBe(false);
    expect(isClassroomUrl("https://classroom.google.com.evil.it/c/x")).toBe(false);
    expect(isClassroomUrl("javascript:alert(1)")).toBe(false);
  });

  it("every demo student has their own login and logins are unique", async () => {
    resetStoreForTests();
    const store = getStore();
    const [students, accounts] = await Promise.all([store.list("students"), store.list("accounts")]);
    for (const s of students) expect(accounts.some((a) => a.role === "student" && a.studentId === s.id), s.id).toBe(true);
    const names = accounts.map((a) => a.username);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(n).toMatch(USERNAME_RE);
  });
});
