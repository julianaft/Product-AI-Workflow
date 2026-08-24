const LEGACY_STORAGE_KEY = 'pm-builder:journey';
const SESSION_KEY = 'pm-builder:mock-google-session';
const WORKSPACE_PREFIX = 'pm-builder:workspace:';

function workspaceKey(userId) {
  return `${WORKSPACE_PREFIX}${encodeURIComponent(String(userId ?? '').toLowerCase())}`;
}

/**
 * Persistencia local do MVP. Fica isolada num servico para que a troca por uma
 * API não exija tocar em componente nenhum.
 */
export function loadJourney() {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveJourney(journey) {
  try {
    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(journey));
    return true;
  } catch {
    return false;
  }
}

export function clearJourney() {
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Sem storage disponivel a jornada segue apenas em memoria.
  }
}

export function loadSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(profile) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Sem storage, a sessão mockada segue apenas em memória.
  }
}

export function loadWorkspace(userId) {
  try {
    const raw = window.localStorage.getItem(workspaceKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveWorkspace(userId, workspace) {
  try {
    window.localStorage.setItem(workspaceKey(userId), JSON.stringify(workspace));
    return true;
  } catch {
    return false;
  }
}
