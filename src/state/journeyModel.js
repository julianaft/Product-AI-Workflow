export function createJourney() {
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
    version: 1,
    activeStep: 1,
    maxRevealedStep: 1,

    product: {
      name: '',
      directorate: '',
      tribe: '',
      squad: '',
      owners: '',
      pm: '',
      pd: '',
      writers: '',
      tm: '',
      tl: '',
      businessContext: '',
      technicalContext: '',
    },

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
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
    version: 1,
    activeStep: 1,
    maxRevealedStep: 1,

    product: {
      name: '',
      directorate: '',
      tribe: '',
      squad: '',
      owners: '',
      pm: '',
      pd: '',
      writers: '',
      tm: '',
      tl: '',
      businessContext: '',
      technicalContext: '',
    },

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
      // Cada framework guarda os proprios campos, entao trocar de metodo
      // nao apaga o que ja foi escrito no anterior.
      fieldsByFramework: {},
      review: null,
      approved: false,
    },

    prd: {
      document: null,
      status: 'not-generated',
      approvedAt: null,
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
  const base = createJourney();
  if (!stored || typeof stored !== 'object') return base;

  return {
    ...base,
    ...stored,
    product: { ...base.product, ...(stored.product ?? {}) },
    initiative: { ...base.initiative, ...(stored.initiative ?? {}) },
    classification: { ...base.classification, ...(stored.classification ?? {}) },
    discovery: { ...base.discovery, ...(stored.discovery ?? {}) },
    prd: { ...base.prd, ...(stored.prd ?? {}) },
    links: Array.isArray(stored.links) ? stored.links : [],
  };
}
