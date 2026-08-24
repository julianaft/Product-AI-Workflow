import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const SOURCE_DIR = new URL('../src/', import.meta.url).pathname;

// Hooks só falham quando o componente renderiza no navegador: o build trata a
// chamada como referência global e o node --test não monta a árvore React.
const REACT_HOOKS = [
  'useCallback',
  'useContext',
  'useEffect',
  'useId',
  'useImperativeHandle',
  'useInsertionEffect',
  'useLayoutEffect',
  'useMemo',
  'useReducer',
  'useRef',
  'useState',
  'useSyncExternalStore',
  'useTransition',
];

function collectJsxFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectJsxFiles(path);
    return entry.isFile() && path.endsWith('.jsx') ? [path] : [];
  });
}

function reactImportNames(source) {
  const match = source.match(/import\s*\{([^}]*)\}\s*from\s*'react'/);
  if (!match) return new Set();
  return new Set(
    match[1]
      .split(',')
      .map((name) => name.split(' as ')[0].trim())
      .filter(Boolean),
  );
}

test('todo hook do React usado em src/ está importado', () => {
  const files = collectJsxFiles(SOURCE_DIR);
  assert.ok(files.length > 0, 'nenhum arquivo .jsx encontrado em src/');

  const missing = [];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const imported = reactImportNames(source);
    for (const hook of REACT_HOOKS) {
      const used = new RegExp(`(?<![\\w.])${hook}\\s*\\(`).test(source);
      if (used && !imported.has(hook)) {
        missing.push(`${file.replace(SOURCE_DIR, 'src/')}: ${hook}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});
