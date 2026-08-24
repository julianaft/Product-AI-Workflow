import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createJourney, discoveryFields, mergeJourney } from '../src/state/journeyModel.js';
import { journeyReducer } from '../src/state/journeyReducer.js';
import { isStepComplete, validateStep } from '../src/services/validation.js';

function reduce(state, ...actions) {
  return actions.reduce(journeyReducer, state);
}

test('jornada antiga no storage ganha os campos novos do modelo de PRD', () => {
  const merged = mergeJourney({
    product: { name: 'GCAM', squad: 'GCAM', businessContext: 'Contexto anterior.' },
    initiative: { name: 'Input Output' },
  });

  assert.equal(merged.product.name, 'GCAM');
  assert.equal(merged.product.directorate, '');
  assert.equal(merged.initiative.okrCode, '');
  assert.equal(merged.initiative.stakeholders, '');
  assert.equal(merged.product.businessContextSources[0].content, 'Contexto anterior.');
});


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

test('sugestão da skill não sobrescreve texto escrito pelo PM', () => {
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

test('a navegação não ultrapassa a última etapa nem volta antes da primeira', () => {
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

test('a etapa de contexto exige produto, fonte de negócio e repositório selecionado', () => {
  const empty = createJourney();
  assert.equal(isStepComplete(1, empty), false);

  const filled = reduce(
    empty,
    { type: 'updateProduct', field: 'name', value: 'GCAM' },
    {
      type: 'updateProduct',
      field: 'businessContextSources',
      value: [{ id: 'source-1', type: 'file', title: 'contexto.txt', content: 'Contexto' }],
    },
    {
      type: 'updateProduct',
      field: 'repositories',
      value: [
        {
          id: 1,
          fullName: 'empresa/produto',
          url: 'https://github.com/empresa/produto',
          selected: true,
        },
      ],
    },
  );

  assert.equal(isStepComplete(1, filled), true);
});

test('revisão do PRD pelo chat preserva o histórico e atualiza o documento', () => {
  const journey = reduce(
    createJourney(),
    { type: 'setPrd', document: { title: 'PRD', sections: {}, revision: 1 } },
    { type: 'appendPrdChat', message: { id: 'u1', role: 'user', content: 'Inclua o código OKR I-9.' } },
    {
      type: 'applyPrdRevision',
      document: { title: 'PRD', sections: {}, revision: 2 },
      answers: [{ question: 'OKR', answer: 'I-9', sectionKey: 'okrInitiative' }],
      message: { id: 'a1', role: 'assistant', content: 'Versão 2 gerada.', revision: 2 },
    },
  );

  assert.equal(journey.prd.document.revision, 2);
  assert.equal(journey.prd.chat.length, 2);
  assert.equal(journey.prd.answers[0].answer, 'I-9');
  assert.equal(journey.prd.status, 'draft');
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
