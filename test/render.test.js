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

function render() {
  return renderToString(
    createElement(JourneyProvider, null, createElement(App)),
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
});

after(async () => {
  await server?.close();
});

test('sem sessão a aplicação renderiza o login mockado', () => {
  store.clear();
  assert.match(render(), /Continuar com Google/);
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
        { id: 'i1', activeStep: 2, initiative: { name: 'Iniciativa A' } },
      ],
      activeInitiativeId: 'i1',
    }),
  );

  assert.match(render(), /Iniciativa A/);
});

test('workspace corrompido não derruba a aplicação', () => {
  store.set('pm-builder:workspace:pm%40empresa.com', '{"initiatives":"quebrado"}');
  assert.ok(render().length > 0);
});
