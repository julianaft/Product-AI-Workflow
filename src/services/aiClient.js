import {
  classifyInitiative as mockClassify,
  recommendDiscovery as mockRecommend,
  reviewDiscovery as mockReview,
  suggestDiscoveryField as mockSuggestField,
} from '../../shared/discoverySkill.js';
import { generatePrd as mockGeneratePrd } from '../../shared/prdSkill.js';
import {
  assertClassification,
  assertDiscoveryRecommendation,
  assertDiscoveryReview,
  assertPrd,
} from '../../shared/contracts.js';

/**
 * Adaptador unico para as skills.
 *
 * VITE_AI_MODE=http passa a usar o servidor em server/index.js, onde ficam as
 * credenciais e os prompts. Sem essa variavel o app roda inteiro com as skills
 * deterministicas, o que mantem o fluxo desenvolvivel sem chave de API.
 */
const MODE = import.meta.env.VITE_AI_MODE === 'http' ? 'http' : 'mock';
const LATENCY_MS = 350;

export function getAiMode() {
  return MODE;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callSkill({ endpoint, payload, mock, assert }) {
  let raw;

  if (MODE === 'http') {
    const response = await fetch(`/api/ai/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`A skill respondeu ${response.status}. ${detail}`.trim());
    }

    raw = await response.json();
  } else {
    await delay(LATENCY_MS);
    raw = mock(payload);
  }

  return assert ? assert(raw) : raw;
}

export function classifyInitiative(payload) {
  return callSkill({
    endpoint: 'classify-initiative',
    payload,
    mock: mockClassify,
    assert: assertClassification,
  });
}

export function recommendDiscovery(payload) {
  return callSkill({
    endpoint: 'recommend-discovery',
    payload,
    mock: mockRecommend,
    assert: assertDiscoveryRecommendation,
  });
}

export function suggestDiscoveryField(payload) {
  return callSkill({
    endpoint: 'suggest-discovery-field',
    payload,
    mock: mockSuggestField,
  });
}

export function reviewDiscovery(payload) {
  return callSkill({
    endpoint: 'review-discovery',
    payload,
    mock: mockReview,
    assert: assertDiscoveryReview,
  });
}

export function generatePrd(payload) {
  return callSkill({
    endpoint: 'generate-prd',
    payload,
    mock: mockGeneratePrd,
    assert: assertPrd,
  });
}
