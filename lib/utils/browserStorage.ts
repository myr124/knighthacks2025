export function deletePlanByKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(NAMESPACE + key);
  } catch (e) {
    console.error('Failed to delete named plan from storage:', e);
  }
}
// Simple browser storage helpers for emergency plan JSON
// Stores the latest plan in localStorage under a fixed key.

import type { EmergencyPlan } from '@/lib/utils/emergencyPlan';

const KEY = 'latestEmergencyPlan';
const NAMESPACE = 'emergencyPlan:'; // for named plans

export function saveLatestEmergencyPlan(plan: EmergencyPlan): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(plan);
    window.sessionStorage.setItem(KEY, serialized);
  } catch (e) {
    // Swallow storage errors to avoid blocking UX; caller can still proceed
    console.error('Failed to save plan to localStorage:', e);
  }
}

export function loadLatestEmergencyPlan(): EmergencyPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
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
    window.sessionStorage.setItem(NAMESPACE + key, serialized);
  } catch (e) {
    console.error('Failed to save named plan to storage:', e);
  }
}

export function loadPlanByKey(key: string): EmergencyPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(NAMESPACE + key);
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
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const k = window.sessionStorage.key(i);
    if (k && k.startsWith(NAMESPACE)) keys.push(k.substring(NAMESPACE.length));
  }
  return keys;
}

// ============================================
// Unified TTX Session Storage
// Stores config, TTX script JSON, and preview text together under a single session key
// ============================================

import type { ScenarioConfig } from '@/lib/utils/ttxGenerator';
import type { TTXScript } from '@/lib/utils/ttxGenerator';

const TTX_SESSION_NAMESPACE = 'ttxSession:';

export interface TTXSession {
  id: string; // unique session ID
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  config: ScenarioConfig; // scenario config
  script: TTXScript | null; // generated TTX JSON script
  previewText: string; // facilitator script preview text
}

// Save a complete TTX session (config + script + preview)
export function saveTTXSession(sessionId: string, session: TTXSession): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(session);
    window.sessionStorage.setItem(TTX_SESSION_NAMESPACE + sessionId, serialized);
  } catch (e) {
    console.error('Failed to save TTX session:', e);
  }
}

// Load a complete TTX session by ID
export function loadTTXSession(sessionId: string): TTXSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(TTX_SESSION_NAMESPACE + sessionId);
    if (!raw) return null;
    return JSON.parse(raw) as TTXSession;
  } catch (e) {
    console.error('Failed to load TTX session:', e);
    return null;
  }
}

// List all saved TTX session IDs
export function listTTXSessions(): string[] {
  if (typeof window === 'undefined') return [];
  const sessionIds: string[] = [];
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const k = window.sessionStorage.key(i);
    if (k && k.startsWith(TTX_SESSION_NAMESPACE)) {
      sessionIds.push(k.substring(TTX_SESSION_NAMESPACE.length));
    }
  }
  return sessionIds;
}

// Delete a TTX session by ID
export function deleteTTXSession(sessionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(TTX_SESSION_NAMESPACE + sessionId);
  } catch (e) {
    console.error('Failed to delete TTX session:', e);
  }
}
