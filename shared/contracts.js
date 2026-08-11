/**
 * Validacao dos contratos entre a jornada e as skills.
 *
 * A interface nunca confia na resposta da skill: uma resposta fora do formato
 * vira erro tratado na tela em vez de quebrar a renderizacao. Isso vale tanto
 * para o modo mock quanto para uma futura resposta de LLM.
 */

import { FRAMEWORK_IDS } from './frameworks.js';
import { PRD_SECTION_KEYS } from './prdSkill.js';

class ContractError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ContractError';
  }
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ContractError(`${label}: resposta nao e um objeto.`);
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ContractError(`${label}: campo de texto ausente ou vazio.`);
  }
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new ContractError(`${label}: era esperada uma lista.`);
  }
}

export function assertClassification(value) {
  requireObject(value, 'classificacao');
  if (value.type !== 'incremental' && value.type !== 'new') {
    throw new ContractError('classificacao: type deve ser "incremental" ou "new".');
  }
  requireString(value.reason, 'classificacao.reason');
  return value;
}

export function assertDiscoveryRecommendation(value) {
  requireObject(value, 'recomendacao de discovery');
  if (!FRAMEWORK_IDS.includes(value.recommendedFramework)) {
    throw new ContractError(
      `recomendacao de discovery: framework "${value.recommendedFramework}" e desconhecido.`,
    );
  }
  requireString(value.reason, 'recomendacao.reason');
  requireArray(value.alternatives ?? [], 'recomendacao.alternatives');
  requireArray(value.questions ?? [], 'recomendacao.questions');
  return value;
}

export function assertDiscoveryReview(value) {
  requireObject(value, 'revisao de discovery');
  requireArray(value.gaps ?? [], 'revisao.gaps');
  requireArray(value.questions ?? [], 'revisao.questions');
  return value;
}

export function assertPrd(value) {
  requireObject(value, 'PRD');
  requireString(value.title, 'PRD.title');
  requireObject(value.sections, 'PRD.sections');

  const missing = PRD_SECTION_KEYS.filter((key) => typeof value.sections[key] !== 'string');
  if (missing.length > 0) {
    throw new ContractError(`PRD: secoes ausentes ou invalidas — ${missing.join(', ')}.`);
  }

  requireArray(value.openQuestions ?? [], 'PRD.openQuestions');
  return value;
}

export { ContractError };
