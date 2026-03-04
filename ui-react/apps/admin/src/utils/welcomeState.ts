const STORAGE_KEY = "shellhub:welcomed_tenants";

function readTenants(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Returns true if the welcome wizard has already been shown for this tenant. */
export function hasSeenWelcome(tenantId: string): boolean {
  return readTenants().includes(tenantId);
}

/** Marks the welcome wizard as shown for this tenant. Idempotent. */
export function markWelcomeSeen(tenantId: string): void {
  try {
    const tenants = readTenants();
    if (tenants.includes(tenantId)) return;
    tenants.push(tenantId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
  } catch {
    // localStorage may be full or unavailable — fail silently
  }
}
