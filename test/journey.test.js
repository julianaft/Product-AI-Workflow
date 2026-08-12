import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createJourney, discoveryFields } from '../src/state/journeyModel.js';
import { journeyReducer } from '../src/state/journeyReducer.js';
import { isStepComplete, validateStep } from '../src/services/validation.js';

function reduce(state, ...actions) {
  return actions.reduce(journeyReducer, state);
}

test('trocar de framework preserva o conteudo do framework anterior', () => {
  const journey = reduce(
    createJourney(),
    { type: 'selectFramework', framework: 'opportunity-tree' },
    { type: 'updateDiscoveryField', field: 'outcome', value: 'Aumentar ticket medio' },
    { type: 'selectFramework', framework: 'csd' },
    { type: 'updateDiscoveryField', field: 'certainties', value: 'Dados de vendas do ultimo ciclo' },
  );

  assert.equal(discoveryFields(journey).certainties, 'Dados de vendas do ultimo ciclo');

  const back = journeyReducer(journey, { type: 'selectFramework', framework: 'opportunity-tree' });
  assert.equal(discoveryFields(back).outcome, 'Aumentar ticket medio');
});

test('editar o discovery derruba a aprovacao anterior', () => {
  const journey = reduce(
    createJourney(),
    { type: 'selectFramework', framework: 'csd' },
    { type: 'approveDiscovery' },
  );

  assert.equal(journey.discovery.approved, true);

  const edited = journeyReducer(journey, {
    type: 'updateDiscoveryField',
    field: 'doubts',
    value: 'Nova duvida',
  });

  assert.equal(edited.discovery.approved, false);
});

test('mudanca de insumo marca o PRD como desatualizado', () => {
  const journey = reduce(
    createJourney(),
    { type: 'setPrd', document: { title: 'PRD', sections: {} } },
    { type: 'approvePrd' },
  );

  assert.equal(journey.prd.status, 'approved');

  const changed = journeyReducer(journey, {
    type: 'updateInitiative',
    field: 'problem',
    value: 'Outro problema',
  });

  assert.equal(changed.prd.status, 'stale');
  assert.equal(changed.prd.approvedAt, null);
});

test('sugestao da skill nao sobrescreve texto escrito pelo PM', () => {
  const journey = reduce(
    createJourney(),
    { type: 'selectFramework', framework: 'opportunity-tree' },
    { type: 'updateDiscoveryField', field: 'outcome', value: 'Texto do PM' },
    {
      type: 'applySuggestedFields',
      framework: 'opportunity-tree',
      fields: { outcome: 'Texto da skill', solutions: 'Sugestao aceita' },
    },
  );

  const fields = discoveryFields(journey);
  assert.equal(fields.outcome, 'Texto do PM');
  assert.equal(fields.solutions, 'Sugestao aceita');
});

test('a navegacao nao ultrapassa a ultima etapa nem volta antes da primeira', () => {
  let journey = createJourney();
  for (let index = 0; index < 20; index += 1) {
    journey = journeyReducer(journey, { type: 'nextStep' });
  }
  assert.equal(journey.activeStep, 6);

  for (let index = 0; index < 20; index += 1) {
    journey = journeyReducer(journey, { type: 'previousStep' });
  }
  assert.equal(journey.activeStep, 1);
});

test('a etapa de contexto exige produto, squad e contexto de negocio', () => {
  const empty = createJourney();
  assert.equal(isStepComplete(1, empty), false);

  const filled = reduce(
    empty,
    { type: 'updateProduct', field: 'name', value: 'GCAM' },
    { type: 'updateProduct', field: 'squad', value: 'GCAM' },
    { type: 'updateProduct', field: 'businessContext', value: 'Cadastro manual de campanhas.' },
  );

  assert.equal(isStepComplete(1, filled), true);
});

test('o discovery so libera o PRD depois de aprovado', () => {
  const journey = reduce(
    createJourney(),
    { type: 'selectFramework', framework: 'csd' },
    { type: 'updateDiscoveryField', field: 'certainties', value: 'Dado observado' },
    { type: 'updateDiscoveryField', field: 'assumptions', value: 'Hipotese a validar' },
    { type: 'updateDiscoveryField', field: 'doubts', value: 'Pergunta em aberto' },
  );

  assert.deepEqual(validateStep(5, journey).errors, {});
  assert.equal(isStepComplete(5, journey), false);

  const approved = journeyReducer(journey, { type: 'approveDiscovery' });
  assert.equal(isStepComplete(5, approved), true);
});
