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
      tribe: '',
      squad: '',
      owners: '',
      businessContext: '',
      technicalContext: '',
    },

    initiative: {
      name: '',
      description: '',
      problem: '',
      audience: '',
      expectedOutcome: '',
      constraints: '',
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
