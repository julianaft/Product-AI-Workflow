const STORAGE_KEY = 'pm-builder:journey';

/**
 * Persistencia local do MVP. Fica isolada num servico para que a troca por uma
 * API nao exija tocar em componente nenhum.
 */
export function loadJourney() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveJourney(journey) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(journey));
    return true;
  } catch {
    return false;
  }
}

export function clearJourney() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sem storage disponivel a jornada segue apenas em memoria.
  }
}
