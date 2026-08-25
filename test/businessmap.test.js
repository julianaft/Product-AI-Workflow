import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildBusinessmapStory,
  parseBusinessmapBoardUrl,
  validateBusinessmapConfig,
} from '../shared/businessmap.js';
import {
  createBusinessmapStory,
  resolveCardLocation,
  resolveStoryType,
} from '../server/businessmap.js';

const BOARD_URL = 'https://grupoboticario.kanbanize.com/ctrl_board/379';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('extrai o ID apenas de links seguros do board corporativo', () => {
  assert.deepEqual(parseBusinessmapBoardUrl(BOARD_URL), {
    boardId: 379,
    boardUrl: BOARD_URL,
    apiBaseUrl: 'https://grupoboticario.kanbanize.com/api/v2',
  });
  assert.throws(
    () => parseBusinessmapBoardUrl('https://exemplo.com/ctrl_board/379'),
    /grupoboticario\.kanbanize\.com/,
  );
  assert.throws(
    () =>
      parseBusinessmapBoardUrl(
        'https://grupoboticario.kanbanize.com/algum_outro_caminho/379',
      ),
    /formato/,
  );
});

test('configuração do Businessmap é opcional, mas exige link e chave juntos', () => {
  assert.deepEqual(validateBusinessmapConfig({}), {});
  assert.deepEqual(validateBusinessmapConfig({ boardUrl: BOARD_URL }), {
    businessmapApiKey: 'Informe a chave de API.',
  });
  assert.deepEqual(validateBusinessmapConfig({ apiKey: 'segredo' }), {
    businessmapBoardUrl: 'Informe o link do board.',
  });
});

test('monta a descrição da Story no template definido pelo time', () => {
  const story = buildBusinessmapStory({
    initiative: {
      name: 'Checkout em uma etapa',
      audience: 'cliente do aplicativo',
      description: 'pagar sem sair da tela',
      expectedOutcome: 'reduzir o abandono',
      constraints: 'manter o antifraude atual',
    },
    prd: {
      sections: {
        context: 'O abandono no Pix está alto.',
        solutions: 'Pix embutido no checkout.',
        permissions: 'Mesma permissão atual.',
        fieldRules: 'CPF obrigatório.',
        acceptanceCriteria: 'CA1: pagamento confirmado.',
        dependencies: 'API de pagamentos.',
        outOfScope: 'Cartão de crédito.',
        errorHandling: 'Exibir falha sem perder os dados.',
      },
      references: [
        { title: 'Protótipo', url: 'https://figma.com/prototipo' },
      ],
    },
  });

  assert.equal(story.title, 'Checkout em uma etapa');
  for (const heading of [
    'Contexto',
    'História do usuário',
    'Requisitos funcionais principais',
    'Links importantes (PRD/Protótipo/Design Doc)',
    'Critérios de aceite claros e objetivos',
    'Dependências e restrições principais',
    'Cenários de Testes',
  ]) {
    assert.match(story.description, new RegExp(heading.replace(/[()]/g, '\\$&')));
  }
  assert.match(
    story.description,
    /Como cliente do aplicativo,\nquero pagar sem sair da tela,\npara reduzir o abandono\./,
  );
  assert.match(story.description, /Tipo: Story|CPF obrigatório|API de pagamentos/);
});

test('seleciona workflow de cards, primeira lane e folha da coluna Requested', () => {
  const structure = {
    workflows: {
      10: {
        type: 0,
        is_enabled: 1,
        top_lanes: [20],
        section_columns: { 2: [30] },
      },
    },
    lanes: { 20: { workflow_id: 10 } },
    child_columns: { 30: [31, 32] },
  };
  assert.deepEqual(resolveCardLocation(structure), {
    workflowId: 10,
    laneId: 20,
    columnId: 31,
  });
});

test('aceita somente o tipo Story habilitado e disponível no board', () => {
  const globalTypes = [
    { type_id: 7, name: 'Bug', is_enabled: 1 },
    { type_id: 8, name: 'Story', is_enabled: 1 },
  ];
  assert.equal(resolveStoryType(globalTypes, [{ type_id: 8 }]), 8);
  assert.throws(
    () => resolveStoryType(globalTypes, [{ type_id: 7 }]),
    /Story não está disponível/,
  );
});

test('integração resolve o board e cria sempre um card Story', async () => {
  const requests = [];
  const fetchMock = async (url, options = {}) => {
    requests.push({ url, options });
    if (url.endsWith('/boards/379/currentStructure')) {
      return json({
        data: {
          workflows: {
            10: {
              type: 0,
              is_enabled: 1,
              top_lanes: [20],
              section_columns: { 2: [30] },
            },
          },
          lanes: { 20: { workflow_id: 10 } },
          child_columns: {},
        },
      });
    }
    if (url.endsWith('/boards/379/cardTypes')) {
      return json({ data: [{ type_id: 8 }] });
    }
    if (url.includes('/cardTypes?')) {
      return json({
        data: [{ type_id: 8, name: 'Story', is_enabled: 1 }],
      });
    }
    if (url.endsWith('/cards') && options.method === 'POST') {
      return json({
        data: [
          {
            card_id: 123,
            custom_id: 'GCAM-123',
            title: 'Checkout em uma etapa',
            workflow_id: 10,
            lane_id: 20,
            column_id: 30,
          },
        ],
      });
    }
    return json({ error: { message: 'Rota inesperada' } }, 404);
  };

  const card = await createBusinessmapStory(
    {
      boardUrl: BOARD_URL,
      apiKey: 'chave-de-teste',
      initiative: {
        name: 'Checkout em uma etapa',
        audience: 'cliente',
        description: 'pagar com Pix',
        expectedOutcome: 'concluir a compra',
      },
      prd: { sections: { context: 'Contexto aprovado.' } },
    },
    fetchMock,
  );

  assert.equal(card.customId, 'GCAM-123');
  assert.equal(card.type, 'Story');
  assert.equal(requests.length, 4);
  assert.ok(
    requests.every(
      ({ options }) => options.headers.apikey === 'chave-de-teste',
    ),
  );
  const createRequest = requests.find(
    ({ url, options }) => url.endsWith('/cards') && options.method === 'POST',
  );
  assert.deepEqual(
    {
      ...JSON.parse(createRequest.options.body),
      description: '[omitida]',
    },
    {
      title: 'Checkout em uma etapa',
      description: '[omitida]',
      lane_id: 20,
      column_id: 30,
      type_id: 8,
    },
  );
});
