import type { User } from "@/types";

// ---------------------------------------------------------------------------
// Tiny localStorage-backed auth. Assignment scope only — no real security.
// ---------------------------------------------------------------------------

const USERS_KEY = "sos_users";
const SESSION_KEY = "sos_session";

function readUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: User;
}

export function signUp(email: string, password: string, name?: string): AuthResult {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  const users = readUsers();
  if (users.some((u) => u.email === normalized)) {
    return { ok: false, error: "An account with that email already exists." };
  }

  const user: User = {
    email: normalized,
    password,
    name: name?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  setSession(normalized);
  return { ok: true, user };
}

export function logIn(email: string, password: string): AuthResult {
  const normalized = email.trim().toLowerCase();
  const user = readUsers().find((u) => u.email === normalized);
  if (!user || user.password !== password) {
    return { ok: false, error: "Incorrect email or password." };
  }
  setSession(normalized);
  return { ok: true, user };
}

export function logOut(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("sos:auth"));
}

function setSession(email: string): void {
  localStorage.setItem(SESSION_KEY, email);
  window.dispatchEvent(new Event("sos:auth"));
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const email = localStorage.getItem(SESSION_KEY);
  if (!email) return null;
  return readUsers().find((u) => u.email === email) ?? null;
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}
