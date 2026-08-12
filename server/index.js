import { createServer } from 'node:http';
import {
  classifyInitiative,
  recommendDiscovery,
  reviewDiscovery,
  suggestDiscoveryField,
} from '../shared/discoverySkill.js';
import { generatePrd } from '../shared/prdSkill.js';
import {
  assertClassification,
  assertDiscoveryRecommendation,
  assertDiscoveryReview,
  assertPrd,
} from '../shared/contracts.js';
import { isProviderConfigured, runPrompt } from './provider.js';
import { DISCOVERY_PROMPT, PRD_PROMPT } from './prompts.js';

const PORT = Number(process.env.PORT ?? 8787);
const MAX_BODY_BYTES = 512 * 1024;

/**
 * Servidor das skills.
 *
 * Aqui ficam as credenciais e os prompts; o React nunca fala com o provedor de
 * IA diretamente. Sem provedor configurado, cada rota cai na implementacao
 * deterministica, entao o servidor sobe e responde mesmo sem chave de API.
 */
const ROUTES = {
  'classify-initiative': {
    prompt: () => DISCOVERY_PROMPT,
    fallback: classifyInitiative,
    assert: assertClassification,
  },
  'recommend-discovery': {
    prompt: () => DISCOVERY_PROMPT,
    fallback: recommendDiscovery,
    assert: assertDiscoveryRecommendation,
  },
  'suggest-discovery-field': {
    prompt: () => DISCOVERY_PROMPT,
    fallback: suggestDiscoveryField,
    assert: null,
  },
  'review-discovery': {
    prompt: () => DISCOVERY_PROMPT,
    fallback: reviewDiscovery,
    assert: assertDiscoveryReview,
  },
  'generate-prd': {
    prompt: () => PRD_PROMPT,
    fallback: generatePrd,
    assert: assertPrd,
  },
};

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Payload grande demais.'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('JSON invalido no corpo da requisicao.'));
      }
    });

    request.on('error', reject);
  });
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  response.end(body);
}

async function handleSkill(route, payload) {
  if (isProviderConfigured()) {
    const result = await runPrompt({ system: route.prompt(), payload });
    return route.assert ? route.assert(result) : result;
  }

  const result = route.fallback(payload);
  return route.assert ? route.assert(result) : result;
}

const server = createServer(async (request, response) => {
  if (request.method !== 'POST' || !request.url?.startsWith('/api/ai/')) {
    sendJson(response, 404, { error: 'Rota nao encontrada.' });
    return;
  }

  const name = request.url.replace('/api/ai/', '').split('?')[0];
  const route = ROUTES[name];

  if (!route) {
    sendJson(response, 404, { error: `Skill "${name}" nao existe.` });
    return;
  }

  try {
    const payload = await readBody(request);
    const result = await handleSkill(route, payload);
    sendJson(response, 200, result);
  } catch (error) {
    // O detalhe do erro fica no log do servidor; o cliente recebe o essencial.
    console.error(`[skill:${name}]`, error);
    sendJson(response, 502, { error: error.message ?? 'Falha ao executar a skill.' });
  }
});

server.listen(PORT, () => {
  const mode = isProviderConfigured() ? 'provedor de IA' : 'fallback deterministico';
  console.log(`Skills disponiveis em http://localhost:${PORT}/api/ai (${mode})`);
});
