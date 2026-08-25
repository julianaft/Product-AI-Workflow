import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createJourney, discoveryFields, mergeJourney } from '../src/state/journeyModel.js';
import { journeyReducer } from '../src/state/journeyReducer.js';
import { isStepComplete, validateStep } from '../src/services/validation.js';
import {
  initiativeStatus,
  newestFirst,
} from '../src/services/initiativeStatus.js';
import {
  activeJourney,
  createWorkspace,
  setupIsComplete,
} from '../src/state/workspaceModel.js';

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
  assert.equal(merged.product.businessmapBoardUrl, '');
  assert.equal(merged.product.businessmapApiKey, '');
  assert.equal(merged.businessmap.stale, false);
  assert.deepEqual(merged.discovery.evidenceSources, []);
  assert.deepEqual(merged.discovery.evidenceAppliedSourceIds, []);
  assert.equal(merged.initiative.okrCode, '');
  assert.equal(merged.initiative.stakeholders, '');
  assert.equal(merged.product.businessContextSources[0].content, 'Contexto anterior.');
});

test('nova iniciativa registra datas para a ordenação do painel', () => {
  const journey = createJourney();
  assert.ok(Date.parse(journey.createdAt));
  assert.equal(journey.createdAt, journey.updatedAt);
});

test('painel ordena por atividade recente e usa status semântico', () => {
  const finalizada = {
    id: 'finalizada',
    updatedAt: '2026-08-25T12:00:00.000Z',
    prd: { document: { title: 'PRD gerado' } },
  };
  const revisao = {
    id: 'revisao',
    updatedAt: '2026-08-25T11:00:00.000Z',
    discovery: { review: { gaps: [] } },
  };
  const discovery = {
    id: 'discovery',
    updatedAt: '2026-08-25T10:00:00.000Z',
    discovery: { framework: 'csd' },
  };

  assert.deepEqual(
    newestFirst([discovery, revisao, finalizada]).map(({ id }) => id),
    ['finalizada', 'revisao', 'discovery'],
  );
  assert.equal(initiativeStatus(finalizada).label, 'Finalizada');
  assert.equal(initiativeStatus(revisao).label, 'Em revisão');
  assert.equal(initiativeStatus(discovery).label, 'Em discovery');
  assert.equal(
    initiativeStatus({ discovery: { approved: true } }).label,
    'Em PRD',
  );
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

test('a navegação da iniciativa vai da primeira etapa até o Businessmap', () => {
  let journey = createJourney();
  for (let index = 0; index < 20; index += 1) {
    journey = journeyReducer(journey, { type: 'nextStep' });
  }
  assert.equal(journey.activeStep, 7);

  for (let index = 0; index < 20; index += 1) {
    journey = journeyReducer(journey, { type: 'previousStep' });
  }
  assert.equal(journey.activeStep, 2);
});

test('a etapa de contexto exige produto, fonte de negócio e repositório selecionado', () => {
  const empty = createJourney();
  assert.equal(isStepComplete(1, empty), false);

  const filled = reduce(
    empty,
    { type: 'updateProduct', field: 'projectName', value: 'Projeto GCAM' },
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

test('configuração parcial do Businessmap bloqueia o setup', () => {
  const journey = createJourney({
    projectName: 'Projeto GCAM',
    name: 'GCAM',
    businessContextSources: [{ id: 'fonte' }],
    repositories: [{ id: 1, selected: true }],
    businessmapBoardUrl:
      'https://grupoboticario.kanbanize.com/ctrl_board/379',
  });

  assert.equal(isStepComplete(1, journey), false);
  assert.equal(
    validateStep(1, journey).errors.businessmapApiKey,
    'Informe a chave de API.',
  );
});

test('alterar a integração do Businessmap não desatualiza o PRD', () => {
  const approved = reduce(
    createJourney(),
    { type: 'setPrd', document: { title: 'PRD', sections: {} } },
    { type: 'approvePrd' },
  );
  const updated = journeyReducer(approved, {
    type: 'updateProduct',
    field: 'businessmapBoardUrl',
    value: 'https://grupoboticario.kanbanize.com/ctrl_board/379',
  });

  assert.equal(updated.prd.status, 'approved');
});

test('alterar o PRD marca a Story já criada como desatualizada', () => {
  const withCard = reduce(
    createJourney(),
    {
      type: 'setPrd',
      document: { title: 'PRD', sections: { context: 'Contexto original' } },
    },
    { type: 'approvePrd' },
    {
      type: 'setBusinessmapCard',
      card: { cardId: 123, title: 'Story original' },
    },
  );
  assert.equal(withCard.businessmap.stale, false);

  const changed = journeyReducer(withCard, {
    type: 'updatePrdSection',
    section: 'context',
    value: 'Contexto revisado',
  });

  assert.equal(changed.businessmap.card.cardId, 123);
  assert.equal(changed.businessmap.stale, true);
});

test('workspace separa setup geral das iniciativas', () => {
  const workspace = createWorkspace({
    email: 'pm@empresa.com',
    name: 'PM',
  });
  workspace.setup = {
    ...workspace.setup,
    projectName: 'Projeto A',
    name: 'Produto A',
    businessContextSources: [{ id: 'fonte', type: 'file', content: 'Contexto' }],
    repositories: [{ id: 1, selected: true }],
  };
  const first = createJourney(workspace.setup);
  const second = createJourney(workspace.setup);
  first.initiative.name = 'Iniciativa 1';
  second.initiative.name = 'Iniciativa 2';
  workspace.initiatives = [first, second];
  workspace.activeInitiativeId = second.id;

  assert.equal(setupIsComplete(workspace.setup), true);
  assert.equal(activeJourney(workspace).initiative.name, 'Iniciativa 2');
  assert.equal(activeJourney(workspace).product.projectName, 'Projeto A');
  assert.notEqual(first.id, second.id);
});

test('cada conta gera um workspace com proprietário próprio', () => {
  const juliana = createWorkspace({ email: 'juliana@empresa.com' });
  const outraPessoa = createWorkspace({ email: 'outra@empresa.com' });

  juliana.setup.projectName = 'Projeto privado da Juliana';

  assert.equal(juliana.ownerId, 'juliana@empresa.com');
  assert.equal(outraPessoa.ownerId, 'outra@empresa.com');
  assert.equal(outraPessoa.setup.projectName, '');
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

test('novas evidências exigem atualização do template antes da aprovação', () => {
  const journey = reduce(
    createJourney(),
    { type: 'selectFramework', framework: 'csd' },
    {
      type: 'setDiscoveryEvidenceSources',
      sources: [
        {
          id: 'meeting-1',
          type: 'transcript',
          title: 'reuniao.vtt',
          content: 'Registro da reunião',
        },
      ],
    },
  );

  assert.match(
    validateStep(5, journey).blockers.join(' '),
    /Atualize o template/,
  );

  const refreshed = journeyReducer(journey, {
    type: 'applyDiscoveryEvidence',
    framework: 'csd',
    result: {
      fields: {
        certainties: 'Registro incorporado',
        assumptions: 'Hipótese',
        doubts: 'Dúvida',
      },
      sourceIds: ['meeting-1'],
      updatedAt: '2026-08-25T00:00:00.000Z',
    },
  });

  assert.equal(refreshed.discovery.evidenceAppliedAt, '2026-08-25T00:00:00.000Z');
  assert.deepEqual(refreshed.discovery.evidenceAppliedSourceIds, ['meeting-1']);
  assert.doesNotMatch(
    validateStep(5, refreshed).blockers.join(' '),
    /Atualize o template/,
  );
});
