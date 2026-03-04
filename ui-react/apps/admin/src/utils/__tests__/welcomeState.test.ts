import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { hasSeenWelcome, markWelcomeSeen } from "../welcomeState";

const STORAGE_KEY = "shellhub:welcomed_tenants";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("hasSeenWelcome", () => {
  it("returns false when localStorage is empty", () => {
    expect(hasSeenWelcome("tenant-abc")).toBe(false);
  });

  it("returns false when a different tenant is stored", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["tenant-other"]));
    expect(hasSeenWelcome("tenant-abc")).toBe(false);
  });

  it("returns true when the tenant is in the stored list", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["tenant-abc"]));
    expect(hasSeenWelcome("tenant-abc")).toBe(true);
  });

  it("returns true when the tenant is among multiple stored tenants", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(["tenant-x", "tenant-abc", "tenant-y"]),
    );
    expect(hasSeenWelcome("tenant-abc")).toBe(true);
  });

  it("returns false when stored value is not a JSON array (corrupt storage)", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    expect(hasSeenWelcome("tenant-abc")).toBe(false);
  });

  it("returns false when stored value is a JSON non-array (e.g. object)", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tenant: "tenant-abc" }));
    expect(hasSeenWelcome("tenant-abc")).toBe(false);
  });
});

describe("markWelcomeSeen", () => {
  it("adds the tenant to an empty storage", () => {
    markWelcomeSeen("tenant-abc");
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toContain("tenant-abc");
  });

  it("appends a new tenant to an existing list", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["tenant-x"]));
    markWelcomeSeen("tenant-abc");
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toEqual(["tenant-x", "tenant-abc"]);
  });

  it("is idempotent — does not duplicate an already-seen tenant", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["tenant-abc"]));
    markWelcomeSeen("tenant-abc");
    markWelcomeSeen("tenant-abc");
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored.filter((t: string) => t === "tenant-abc")).toHaveLength(1);
  });

  it("makes hasSeenWelcome return true for the marked tenant", () => {
    markWelcomeSeen("tenant-abc");
    expect(hasSeenWelcome("tenant-abc")).toBe(true);
  });

  it("does not affect other tenants", () => {
    markWelcomeSeen("tenant-abc");
    expect(hasSeenWelcome("tenant-other")).toBe(false);
  });

  it("silently handles corrupt existing storage by resetting to empty before adding", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    // Should not throw
    markWelcomeSeen("tenant-abc");
    // After corrupt storage, readTenants returns [] so a new array is created
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toContain("tenant-abc");
  });
});
