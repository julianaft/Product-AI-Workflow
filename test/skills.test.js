import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  classifyInitiative,
  recommendDiscovery,
  reviewDiscovery,
} from '../shared/discoverySkill.js';
import { PRD_SECTION_KEYS, generatePrd, prdToMarkdown } from '../shared/prdSkill.js';
import { assertPrd, assertDiscoveryRecommendation } from '../shared/contracts.js';

const product = {
  name: 'GCAM',
  squad: 'GCAM',
  businessContext: 'Campanhas do canal VD sao cadastradas manualmente no GCAM.',
};

const incrementalInitiative = {
  name: 'Lucro Extra Progressivo',
  description: 'Expandir a mecanica atual de comissao com novas faixas.',
  problem: 'A revendedora nao ve quanto falta para a proxima faixa durante o pedido.',
  audience: 'Revendedoras do canal VD',
  expectedOutcome: 'Aumentar 15% o ticket medio no trimestre',
};

test('iniciativa que expande base existente e classificada como incremental', () => {
  const result = classifyInitiative({ product, initiative: incrementalInitiative });

  assert.equal(result.type, 'incremental');
  assert.equal(result.needsConfirmation, true);
  assert.ok(result.confidence > 0 && result.confidence <= 1);
});

test('iniciativa inedita e classificada como novo fluxo', () => {
  const result = classifyInitiative({
    product,
    initiative: {
      name: 'Portal do consultor',
      description: 'Construir uma nova plataforma do zero para uma nova area de negocio.',
    },
  });

  assert.equal(result.type, 'new');
});

test('fluxo novo recebe double diamond e a resposta respeita o contrato', () => {
  const result = recommendDiscovery({
    product,
    initiative: incrementalInitiative,
    initiativeType: 'new',
  });

  assert.equal(result.recommendedFramework, 'double-diamond');
  assert.doesNotThrow(() => assertDiscoveryRecommendation(result));
});

test('iniciativa incremental com objetivo claro recebe arvore de oportunidades', () => {
  const result = recommendDiscovery({
    product,
    initiative: incrementalInitiative,
    initiativeType: 'incremental',
  });

  assert.equal(result.recommendedFramework, 'opportunity-tree');
});

test('revisao aponta campo obrigatorio vazio e bloqueia o PRD', () => {
  const result = reviewDiscovery({
    frameworkId: 'opportunity-tree',
    fields: { outcome: 'Aumentar o ticket medio em 15% no trimestre com dados de vendas.' },
    initiative: incrementalInitiative,
  });

  assert.equal(result.readyForPrd, false);
  assert.ok(result.gaps.length > 0);
});

test('certeza escrita como hipotese vira contradicao na matriz CSD', () => {
  const result = reviewDiscovery({
    frameworkId: 'csd',
    fields: {
      certainties: 'Acreditamos que a revendedora talvez queira mais comissao.',
      assumptions: 'A falta de estimulo visual reduz o upsell nas faixas intermediarias.',
      doubts: 'Qual percentual de comissao extra mantem a margem saudavel?',
    },
  });

  assert.ok(result.contradictions.length > 0);
});

test('PRD gerado traz todas as secoes previstas no contrato', () => {
  const prd = generatePrd({
    productContext: product,
    initiative: incrementalInitiative,
    initiativeClassification: { type: 'incremental' },
    discovery: {
      framework: 'opportunity-tree',
      approved: true,
      fields: {
        outcome: 'Aumentar 15% o ticket medio.',
        opportunities: 'Sem visibilidade da proxima faixa no fechamento do pedido.',
        solutions: 'Regua de progresso no carrinho com calculo automatico.',
        experiments: 'Teste A/B com 10% da base.',
      },
    },
  });

  assert.doesNotThrow(() => assertPrd(prd));
  for (const key of PRD_SECTION_KEYS) {
    assert.equal(typeof prd.sections[key], 'string');
  }
});

test('secao sem insumo vira pergunta em aberto em vez de texto inventado', () => {
  const prd = generatePrd({
    productContext: { name: 'GCAM' },
    initiative: { name: 'Iniciativa sem detalhes' },
    discovery: { framework: 'opportunity-tree', fields: {} },
  });

  assert.ok(prd.openQuestions.length > 0);
  assert.ok(prd.sections.problem.includes('Nao informado'));
});

test('exportacao em markdown inclui titulo e secoes', () => {
  const prd = generatePrd({
    productContext: product,
    initiative: incrementalInitiative,
    discovery: { framework: 'opportunity-tree', fields: { outcome: 'Ticket medio maior.' } },
  });

  const markdown = prdToMarkdown(prd);

  assert.ok(markdown.startsWith('# Lucro Extra Progressivo'));
  assert.ok(markdown.includes('## Metricas de impacto'));
  assert.ok(markdown.includes('## Criterios de aceite'));
});

test('PRD detalha hipoteses no formato Hn e pede AS IS / TO BE quando falta numero', () => {
  const prd = generatePrd({
    productContext: product,
    initiative: {
      ...incrementalInitiative,
      okrCode: 'C17IN1120',
    },
    discovery: {
      framework: 'csd',
      approved: true,
      fields: {
        certainties: 'Cadastro ainda e manual.',
        assumptions: 'A digitacao dos campos descritivos gera retrabalho.',
        doubts: 'Qual recorte de mecanica entra na primeira entrega?',
      },
    },
  });

  assert.match(prd.sections.hypotheses, /H1:/);
  assert.match(prd.sections.hypotheses, /Dor:/);
  assert.match(prd.sections.impactMetrics, /AS IS/);
  assert.equal(prd.metadata.okrCode, 'C17IN1120');
});

test('varias solucoes no discovery viram blocos separados no PRD', () => {
  const prd = generatePrd({
    productContext: product,
    initiative: incrementalInitiative,
    discovery: {
      framework: 'opportunity-tree',
      fields: {
        outcome: 'Reduzir horas de cadastro manual.',
        opportunities: 'Cadastro unitario nao cabe na janela da rodada.',
        solutions:
          'Solucao 1: IA para campos descritivos\nSugestao de nome, descricao e texto legal.\nSolucao 2: Subida massiva\nUpload da planilha e planejamento em lote.',
        experiments: 'Piloto em uma rodada.',
      },
    },
  });

  assert.match(prd.sections.solutions, /Solucao 1/);
  assert.match(prd.sections.solutions, /Solucao 2/);
  assert.match(prd.sections.solutions, /Jornada AS IS/);
  assert.match(prd.sections.acceptanceCriteria, /CA1:/);
});
