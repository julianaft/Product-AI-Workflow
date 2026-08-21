import { TOTAL_STEPS } from '../data/steps.js';
import { createJourney, mergeJourney } from './journeyModel.js';

function clampStep(step) {
  return Math.min(Math.max(step, 1), TOTAL_STEPS);
}

function withStep(state, step) {
  const next = clampStep(step);
  return {
    ...state,
    activeStep: next,
    maxRevealedStep: Math.max(state.maxRevealedStep, next),
  };
}

/**
 * Sempre que o insumo de uma etapa muda, o que foi derivado depois dela
 * deixa de ser confiavel. Estas funcoes invalidam o trecho seguinte da jornada
 * em vez de deixar um PRD apontando para um discovery que nao existe mais.
 */
function invalidatePrd(state) {
  if (state.prd.status === 'not-generated') return state.prd;
  return { ...state.prd, status: 'stale', approvedAt: null };
}

function invalidateDiscoveryApproval(state) {
  if (!state.discovery.approved) return state.discovery;
  return { ...state.discovery, approved: false };
}

export function journeyReducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return mergeJourney(action.journey);

    case 'reset':
      return createJourney();

    case 'goToStep':
      return withStep(state, action.step);

    case 'nextStep':
      return withStep(state, state.activeStep + 1);

    case 'previousStep':
      return { ...state, activeStep: clampStep(state.activeStep - 1) };

    case 'updateProduct':
      return {
        ...state,
        product: { ...state.product, [action.field]: action.value },
        prd: invalidatePrd(state),
      };

    case 'updateInitiative':
      return {
        ...state,
        initiative: { ...state.initiative, [action.field]: action.value },
        classification: { ...state.classification, suggestion: null },
        prd: invalidatePrd(state),
      };

    case 'setClassificationSuggestion':
      return {
        ...state,
        classification: {
          ...state.classification,
          suggestion: action.suggestion,
          type: state.classification.type ?? action.suggestion.type,
        },
      };

    case 'setClassificationType':
      return {
        ...state,
        classification: { ...state.classification, type: action.value, confirmedAt: null },
        discovery: { ...state.discovery, recommendation: null },
      };

    case 'confirmClassification':
      return {
        ...state,
        classification: { ...state.classification, confirmedAt: new Date().toISOString() },
      };

    case 'setDiscoveryRecommendation':
      return {
        ...state,
        discovery: { ...state.discovery, recommendation: action.recommendation },
      };

    case 'selectFramework': {
      const existing = state.discovery.fieldsByFramework[action.framework];
      return {
        ...state,
        discovery: {
          ...invalidateDiscoveryApproval(state),
          framework: action.framework,
          fieldsByFramework: {
            ...state.discovery.fieldsByFramework,
            [action.framework]: existing ?? {},
          },
          review: null,
        },
        prd: invalidatePrd(state),
      };
    }

    case 'applySuggestedFields': {
      const framework = action.framework ?? state.discovery.framework;
      if (!framework) return state;

      const current = state.discovery.fieldsByFramework[framework] ?? {};
      const merged = { ...current };

      // Sugestao nunca sobrescreve texto escrito pelo PM.
      for (const [key, value] of Object.entries(action.fields ?? {})) {
        if (!String(current[key] ?? '').trim()) {
          merged[key] = value;
        }
      }

      return {
        ...state,
        discovery: {
          ...state.discovery,
          fieldsByFramework: { ...state.discovery.fieldsByFramework, [framework]: merged },
        },
      };
    }

    case 'updateDiscoveryField': {
      const framework = state.discovery.framework;
      if (!framework) return state;

      const current = state.discovery.fieldsByFramework[framework] ?? {};

      return {
        ...state,
        discovery: {
          ...invalidateDiscoveryApproval(state),
          fieldsByFramework: {
            ...state.discovery.fieldsByFramework,
            [framework]: { ...current, [action.field]: action.value },
          },
        },
        prd: invalidatePrd(state),
      };
    }

    case 'setDiscoveryReview':
      return { ...state, discovery: { ...state.discovery, review: action.review } };

    case 'approveDiscovery':
      return { ...state, discovery: { ...state.discovery, approved: true } };

    case 'setPrd':
      return {
        ...state,
        prd: { document: action.document, status: 'draft', approvedAt: null },
      };

    case 'updatePrdSection':
      if (!state.prd.document) return state;
      return {
        ...state,
        prd: {
          ...state.prd,
          status: 'draft',
          document: {
            ...state.prd.document,
            sections: { ...state.prd.document.sections, [action.section]: action.value },
          },
        },
      };

    case 'approvePrd':
      if (!state.prd.document) return state;
      return {
        ...state,
        prd: { ...state.prd, status: 'approved', approvedAt: new Date().toISOString() },
      };

    case 'reopenPrd':
      return { ...state, prd: { ...state.prd, status: 'draft', approvedAt: null } };

    case 'addLink':
      return { ...state, links: [...state.links, action.link] };

    case 'removeLink':
      return { ...state, links: state.links.filter((link) => link.id !== action.id) };

    default:
      return state;
  }
}
