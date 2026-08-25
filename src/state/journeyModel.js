export function createProductSetup(overrides = {}) {
  return {
    projectName: '',
    name: '',
    directorate: '',
    tribe: '',
    squad: '',
    teamName: '',
    owners: '',
    pm: '',
    pd: '',
    writers: '',
    tm: '',
    tl: '',
    businessContext: '',
    technicalContext: '',
    businessContextSources: [],
    githubOwner: '',
    repositories: [],
    businessmapBoardUrl: '',
    businessmapApiKey: '',
    ...overrides,
  };
}

export function createJourney(product = {}) {
  const createdAt = new Date().toISOString();
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
    version: 1,
    createdAt,
    updatedAt: createdAt,
    activeStep: 2,
    maxRevealedStep: 2,

    product: createProductSetup(product),

    initiative: {
      name: '',
      okrCode: '',
      description: '',
      problem: '',
      audience: '',
      expectedOutcome: '',
      constraints: '',
      stakeholders: '',
    },

    classification: {
      suggestion: null,
      type: null,
      confirmedAt: null,
    },

    discovery: {
      recommendation: null,
      framework: null,
      // Cada framework guarda os próprios campos, então trocar de método
      // não apaga o que já foi escrito no anterior.
      fieldsByFramework: {},
      review: null,
      approved: false,
      evidenceSources: [],
      evidenceAppliedSourceIds: [],
      evidenceAppliedAt: null,
    },

    prd: {
      document: null,
      status: 'not-generated',
      approvedAt: null,
      chat: [],
      answers: [],
    },

    businessmap: {
      card: null,
      stale: false,
    },

    links: [],
  };
}

export function discoveryFields(journey) {
  const framework = journey.discovery.framework;
  if (!framework) return {};
  return journey.discovery.fieldsByFramework[framework] ?? {};
}

export function mergeJourney(stored) {
  const base = createJourney(stored?.product);
  if (!stored || typeof stored !== 'object') return base;
  const storedSources = Array.isArray(stored.product?.businessContextSources)
    ? stored.product.businessContextSources
    : [];
  const businessContextSources =
    storedSources.length > 0
      ? storedSources
      : stored.product?.businessContext?.trim()
        ? [
            {
              id: 'legacy-business-context',
              type: 'file',
              title: 'Contexto migrado da jornada anterior',
              fileName: 'contexto-migrado.txt',
              content: stored.product.businessContext.trim(),
            },
          ]
        : [];

  return {
    ...base,
    ...stored,
    activeStep: Math.max(2, Number(stored.activeStep ?? 2)),
    maxRevealedStep: Math.max(2, Number(stored.maxRevealedStep ?? 2)),
    product: {
      ...base.product,
      ...(stored.product ?? {}),
      businessContextSources,
      repositories: Array.isArray(stored.product?.repositories)
        ? stored.product.repositories
        : [],
    },
    initiative: { ...base.initiative, ...(stored.initiative ?? {}) },
    classification: { ...base.classification, ...(stored.classification ?? {}) },
    discovery: {
      ...base.discovery,
      ...(stored.discovery ?? {}),
      evidenceSources: Array.isArray(stored.discovery?.evidenceSources)
        ? stored.discovery.evidenceSources
        : [],
      evidenceAppliedSourceIds: Array.isArray(
        stored.discovery?.evidenceAppliedSourceIds,
      )
        ? stored.discovery.evidenceAppliedSourceIds
        : [],
    },
    prd: {
      ...base.prd,
      ...(stored.prd ?? {}),
      chat: Array.isArray(stored.prd?.chat) ? stored.prd.chat : [],
      answers: Array.isArray(stored.prd?.answers) ? stored.prd.answers : [],
    },
    businessmap: {
      ...base.businessmap,
      ...(stored.businessmap ?? {}),
    },
    links: Array.isArray(stored.links) ? stored.links : [],
  };
}
