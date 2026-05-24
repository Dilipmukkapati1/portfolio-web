import { webEnv } from "@/lib/env";

const ACTIVE_HOUSEHOLD_KEY = "portfolio-active-household-id";
const HOUSEHOLD_REGISTRY_KEY = "portfolio-household-registry";

export const HOUSEHOLD_ID_CHANGED_EVENT = "portfolio-household-id-changed";

export function getActiveHouseholdId(): string {
  if (typeof window === "undefined") {
    return webEnv.defaultHouseholdId;
  }
  return localStorage.getItem(ACTIVE_HOUSEHOLD_KEY) ?? webEnv.defaultHouseholdId;
}

export function setActiveHouseholdId(householdId: string): void {
  const id = householdId.trim();
  if (!id) return;
  localStorage.setItem(ACTIVE_HOUSEHOLD_KEY, id);
  registerHouseholdId(id);
  window.dispatchEvent(new CustomEvent(HOUSEHOLD_ID_CHANGED_EVENT));
}

export function registerHouseholdId(householdId: string): void {
  const id = householdId.trim();
  if (!id) return;
  const registry = getHouseholdRegistry();
  if (!registry.includes(id)) {
    localStorage.setItem(
      HOUSEHOLD_REGISTRY_KEY,
      JSON.stringify([...registry, id])
    );
  }
}

export function getHouseholdRegistry(): string[] {
  if (typeof window === "undefined") return [webEnv.defaultHouseholdId];
  try {
    const raw = localStorage.getItem(HOUSEHOLD_REGISTRY_KEY);
    if (!raw) return [webEnv.defaultHouseholdId];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [webEnv.defaultHouseholdId];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [webEnv.defaultHouseholdId];
  }
}

export function removeFromHouseholdRegistry(householdId: string): void {
  const next = getHouseholdRegistry().filter((id) => id !== householdId);
  localStorage.setItem(HOUSEHOLD_REGISTRY_KEY, JSON.stringify(next));
}

export function syncHouseholdRegistry(householdIds: string[]): void {
  const merged = [...new Set([...getHouseholdRegistry(), ...householdIds])];
  localStorage.setItem(HOUSEHOLD_REGISTRY_KEY, JSON.stringify(merged));
}

export function removeHouseholdsFromRegistry(householdIds: string[]): void {
  const remove = new Set(householdIds);
  const next = getHouseholdRegistry().filter((id) => !remove.has(id));
  localStorage.setItem(HOUSEHOLD_REGISTRY_KEY, JSON.stringify(next));
}
