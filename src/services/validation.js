import { getRequiredFieldKeys } from '../../shared/frameworks.js';
import { discoveryFields } from '../state/journeyModel.js';

function blank(value) {
  return String(value ?? '').trim().length === 0;
}

const PRODUCT_RULES = [
  ['name', 'Informe o nome do produto.'],
  ['squad', 'Informe a squad responsavel.'],
  ['businessContext', 'Descreva o contexto de negocio.'],
];

const INITIATIVE_RULES = [
  ['name', 'Informe o nome da iniciativa.'],
  ['description', 'Descreva a iniciativa.'],
  ['problem', 'Descreva o problema percebido.'],
  ['audience', 'Informe quem e afetado.'],
  ['expectedOutcome', 'Informe o resultado esperado.'],
];

function applyRules(source, rules) {
  const errors = {};
  for (const [field, message] of rules) {
    if (blank(source[field])) {
      errors[field] = message;
    }
  }
  return errors;
}

/**
 * Regras que liberam o avanco de cada etapa.
 * Retorna erros por campo, para exibir junto ao input, e bloqueios gerais.
 */
export function validateStep(stepId, journey) {
  switch (stepId) {
    case 1: {
      const errors = applyRules(journey.product, PRODUCT_RULES);
      return { errors, blockers: [] };
    }

    case 2: {
      const errors = applyRules(journey.initiative, INITIATIVE_RULES);
      return { errors, blockers: [] };
    }

    case 3: {
      const blockers = [];
      if (!journey.classification.type) {
        blockers.push('Escolha entre iniciativa incremental ou fluxo novo.');
      }
      if (!journey.classification.confirmedAt) {
        blockers.push('Confirme a classificacao para seguir.');
      }
      return { errors: {}, blockers };
    }

    case 4: {
      const blockers = [];
      if (!journey.discovery.framework) {
        blockers.push('Selecione um framework de discovery.');
      }
      return { errors: {}, blockers };
    }

    case 5: {
      const errors = {};
      const fields = discoveryFields(journey);

      for (const key of getRequiredFieldKeys(journey.discovery.framework)) {
        if (blank(fields[key])) {
          errors[key] = 'Campo obrigatorio para gerar o PRD.';
        }
      }

      const blockers = [];
      if (!journey.discovery.approved) {
        blockers.push('Aprove o discovery para liberar a geracao do PRD.');
      }

      return { errors, blockers };
    }

    case 6: {
      const blockers = [];
      if (!journey.prd.document) {
        blockers.push('Gere o PRD.');
      }
      return { errors: {}, blockers };
    }

    default:
      return { errors: {}, blockers: [] };
  }
}

export function isStepComplete(stepId, journey) {
  const { errors, blockers } = validateStep(stepId, journey);
  return Object.keys(errors).length === 0 && blockers.length === 0;
}
