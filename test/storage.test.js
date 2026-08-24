import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  clearSession,
  loadSession,
  loadWorkspace,
  saveSession,
  saveWorkspace,
} from '../src/services/storage.js';

function mockLocalStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test('storage isola workspaces pelo e-mail da conta mockada', () => {
  globalThis.window = { localStorage: mockLocalStorage() };

  saveWorkspace('juliana@empresa.com', {
    setup: { projectName: 'Projeto da Juliana' },
  });
  saveWorkspace('outra@empresa.com', {
    setup: { projectName: 'Outro projeto' },
  });

  assert.equal(
    loadWorkspace('juliana@empresa.com').setup.projectName,
    'Projeto da Juliana',
  );
  assert.equal(
    loadWorkspace('outra@empresa.com').setup.projectName,
    'Outro projeto',
  );
});

test('sessão mockada pode ser criada e encerrada', () => {
  globalThis.window = { localStorage: mockLocalStorage() };

  saveSession({ email: 'pm@empresa.com', provider: 'google-mock' });
  assert.equal(loadSession().email, 'pm@empresa.com');

  clearSession();
  assert.equal(loadSession(), null);
});

