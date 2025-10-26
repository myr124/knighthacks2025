// Simple browser storage helpers for emergency plan JSON
// Stores plans in localStorage for persistence across browser sessions.

import type { EmergencyPlan } from '@/lib/utils/emergencyPlan';

const KEY = 'latestEmergencyPlan';
const NAMESPACE = 'emergencyPlan:'; // for named plans

export function saveLatestEmergencyPlan(plan: EmergencyPlan): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(plan);
    window.localStorage.setItem(KEY, serialized);
  } catch (e) {
    // Swallow storage errors to avoid blocking UX; caller can still proceed
    console.error('Failed to save plan to localStorage:', e);
  }
}

export function loadLatestEmergencyPlan(): EmergencyPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EmergencyPlan;
  } catch (e) {
    console.error('Failed to load plan from localStorage:', e);
    return null;
  }
}

// Save a plan under a user-provided key (e.g., title). Caller should ensure key uniqueness.
export function savePlanByKey(key: string, plan: EmergencyPlan): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(plan);
    window.localStorage.setItem(NAMESPACE + key, serialized);
    console.log('✅ Saved plan with key:', NAMESPACE + key);
  } catch (e) {
    console.error('Failed to save named plan to storage:', e);
  }
}

export function loadPlanByKey(key: string): EmergencyPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(NAMESPACE + key);
    if (!raw) return null;
    return JSON.parse(raw) as EmergencyPlan;
  } catch (e) {
    console.error('Failed to load named plan from storage:', e);
    return null;
  }
}

export function listSavedPlanKeys(): string[] {
  if (typeof window === 'undefined') return [];
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(NAMESPACE)) {
      keys.push(k.substring(NAMESPACE.length));
    }
  }
  console.log('📋 Listed saved plan keys:', keys);
  return keys;
}
