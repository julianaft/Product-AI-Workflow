import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { test } from 'node:test';

const UNACCENTED_VISIBLE_WORDS = [
  'nao',
  'classificacao',
  'recomendacao',
  'sugestao',
  'confianca',
  'descricao',
  'negocio',
  'usuario',
  'obrigatorio',
  'obrigatorios',
  'conteudo',
  'revisao',
  'geracao',
  'confirmacao',
  'integracao',
  'analise',
  'intervencao',
  'avancar',
];

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(path)));
    } else if (['.js', '.jsx'].includes(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

test('interface não contém grafias comuns sem acento', async () => {
  const files = await sourceFiles(new URL('../src', import.meta.url).pathname);
  const findings = [];

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const word of UNACCENTED_VISIBLE_WORDS) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(content)) {
        findings.push(`${file}: ${word}`);
      }
    }
  }

  assert.deepEqual(findings, []);
});

