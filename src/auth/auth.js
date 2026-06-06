const SESSION_KEY = "glasgate_session";

export const DEMO_CREDENTIALS = {
  email: "admin@glasgate.ai",
  password: "password",
};

export const DEMO_USER = {
  email: "admin@glasgate.ai",
  name: "Alex Kim",
  initials: "AK",
  workspace: "Acme Corp",
  plan: "Enterprise Plan",
};

export function login(email, password) {
  const normalized = String(email || "").trim().toLowerCase();
  if (
    normalized === DEMO_CREDENTIALS.email.toLowerCase() &&
    password === DEMO_CREDENTIALS.password
  ) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_USER));
    return { ok: true, user: DEMO_USER };
  }
  return { ok: false, error: "Invalid email or password." };
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSessionUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getSessionUser());
}

export function register(email, _password, company) {
  if (!email?.trim()) return { ok: false, error: "Email is required." };
  const user = {
    ...DEMO_USER,
    email: email.trim(),
    workspace: company?.trim() || "New Workspace",
    initials: email.trim().slice(0, 2).toUpperCase(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { ok: true, user };
}
