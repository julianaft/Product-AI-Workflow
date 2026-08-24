import { createJourney, createProductSetup, mergeJourney } from './journeyModel.js';

function now() {
  return new Date().toISOString();
}

export function userIdFromEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

export function createWorkspace(profile, legacyJourney = null) {
  const legacy = legacyJourney ? mergeJourney(legacyJourney) : null;
  const setup = createProductSetup({
    ...(legacy?.product ?? {}),
    projectName:
      legacy?.product?.projectName || legacy?.product?.name || '',
    teamName:
      legacy?.product?.teamName || legacy?.product?.squad || '',
  });
  const initiatives = legacy
    ? [{ ...legacy, product: setup, activeStep: Math.max(2, legacy.activeStep) }]
    : [];

  return {
    version: 2,
    ownerId: userIdFromEmail(profile?.email),
    setup,
    setupCompletedAt: legacy ? now() : null,
    initiatives,
    activeInitiativeId: legacy?.id ?? null,
    createdAt: now(),
    updatedAt: now(),
  };
}

export function mergeWorkspace(stored, profile) {
  if (!stored || typeof stored !== 'object') return createWorkspace(profile);
  const base = createWorkspace(profile);
  const setup = createProductSetup(stored.setup);
  const initiatives = Array.isArray(stored.initiatives)
    ? stored.initiatives.map((initiative) => ({
        ...mergeJourney(initiative),
        product: setup,
      }))
    : [];

  return {
    ...base,
    ...stored,
    ownerId: userIdFromEmail(profile?.email),
    setup,
    initiatives,
    activeInitiativeId: initiatives.some(
      (initiative) => initiative.id === stored.activeInitiativeId,
    )
      ? stored.activeInitiativeId
      : null,
  };
}

export function setupIsComplete(setup = {}) {
  return Boolean(
    String(setup.projectName ?? '').trim() &&
      String(setup.name ?? '').trim() &&
      setup.businessContextSources?.length &&
      setup.repositories?.some((repository) => repository.selected),
  );
}

export function createInitiativeForWorkspace(workspace) {
  return createJourney(workspace?.setup);
}

export function activeJourney(workspace) {
  const stored = workspace?.initiatives?.find(
    (initiative) => initiative.id === workspace.activeInitiativeId,
  );
  if (!stored) return createJourney(workspace?.setup);
  return { ...mergeJourney(stored), product: createProductSetup(workspace.setup) };
}

