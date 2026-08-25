import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

// Monta a aplicação de verdade: erros de render (hook não importado, dado
// gravado por uma versão anterior) só aparecem quando a árvore é renderizada.
const ROOT = new URL('..', import.meta.url).pathname;

const store = new Map();
let server;
let App;
let JourneyProvider;
let BusinessmapStep;

function render() {
  return renderToString(
    createElement(JourneyProvider, null, createElement(App)),
  );
}

function renderInsideJourney(Component) {
  return renderToString(
    createElement(JourneyProvider, null, createElement(Component)),
  );
}

before(async () => {
  globalThis.window = {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
    location: { reload() {} },
  };

  server = await createServer({
    root: ROOT,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  });
  ({ default: App } = await server.ssrLoadModule('/src/App.jsx'));
  ({ JourneyProvider } = await server.ssrLoadModule(
    '/src/state/JourneyProvider.jsx',
  ));
  ({ BusinessmapStep } = await server.ssrLoadModule(
    '/src/features/businessmap/BusinessmapStep.jsx',
  ));
});

after(async () => {
  await server?.close();
});

test('sem sessão a aplicação renderiza o login Google', () => {
  store.clear();
  const html = render();
  assert.match(html, /Continuar com Google/);
  assert.doesNotMatch(html, /mockado|simular/i);
});

test('setup não exige nem exibe o campo de espaço do time', () => {
  store.clear();
  store.set(
    'pm-builder:mock-google-session',
    JSON.stringify({ id: 'pm@empresa.com', email: 'pm@empresa.com', name: 'PM' }),
  );

  const html = render();
  assert.match(html, /Setup inicial do projeto/);
  assert.match(html, /Produto/);
  assert.doesNotMatch(html, /Projeto \/ espaço do time/);
  assert.doesNotMatch(html, /Informações reutilizadas em toda iniciativa/);
  assert.doesNotMatch(html, /Integração opcional em desenvolvimento/);
});

test('com setup completo a aplicação renderiza o painel de iniciativas', () => {
  store.clear();
  store.set(
    'pm-builder:mock-google-session',
    JSON.stringify({ id: 'pm@empresa.com', email: 'pm@empresa.com', name: 'PM' }),
  );
  store.set(
    'pm-builder:workspace:pm%40empresa.com',
    JSON.stringify({
      version: 2,
      setup: {
        projectName: 'Projeto',
        name: 'Produto',
        businessContextSources: [{ id: '1', content: 'contexto' }],
        repositories: [{ name: 'repo', selected: true }],
      },
      initiatives: [
        {
          id: 'i1',
          createdAt: '2026-08-25T11:00:00.000Z',
          updatedAt: '2026-08-25T11:00:00.000Z',
          activeStep: 2,
          initiative: { name: 'Iniciativa A' },
        },
        {
          id: 'i2',
          createdAt: '2026-08-25T12:00:00.000Z',
          updatedAt: '2026-08-25T12:00:00.000Z',
          initiative: { name: 'Iniciativa finalizada' },
          prd: { document: { title: 'PRD A' } },
        },
      ],
      activeInitiativeId: 'i1',
    }),
  );

  const html = render();
  assert.match(html, /Iniciativa A/);
  assert.match(html, /Iniciativa finalizada/);
  assert.match(html, /Finalizada/);
  assert.match(html, /Descartar/);
  assert.ok(
    html.indexOf('Iniciativa finalizada') < html.indexOf('Iniciativa A'),
  );
});

test('etapa final renderiza a prévia da Story configurada', () => {
  store.set(
    'pm-builder:workspace:pm%40empresa.com',
    JSON.stringify({
      version: 2,
      setup: {
        projectName: 'Projeto',
        name: 'Produto',
        businessContextSources: [{ id: '1', content: 'contexto' }],
        repositories: [{ name: 'repo', selected: true }],
        businessmapBoardUrl:
          'https://grupoboticario.kanbanize.com/ctrl_board/379',
        businessmapApiKey: 'chave-local-de-teste',
      },
      initiatives: [
        {
          id: 'i1',
          activeStep: 7,
          maxRevealedStep: 7,
          initiative: {
            name: 'Iniciativa A',
            audience: 'cliente',
            description: 'concluir a compra',
            expectedOutcome: 'reduzir abandono',
          },
          prd: {
            status: 'approved',
            document: {
              title: 'PRD A',
              sections: { context: 'Contexto da iniciativa.' },
            },
          },
        },
      ],
      activeInitiativeId: 'i1',
    }),
  );

  const html = renderInsideJourney(BusinessmapStep);
  assert.match(html, /Prévia do card/);
  assert.match(html, /Tipo: Story/);
  assert.match(html, /Criar Story no Businessmap/);
  assert.match(html, /alt="Businessmap"/);
  assert.match(html, />WIP</);
});

test('workspace corrompido não derruba a aplicação', () => {
  store.set('pm-builder:workspace:pm%40empresa.com', '{"initiatives":"quebrado"}');
  assert.ok(render().length > 0);
});
