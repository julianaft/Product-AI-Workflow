import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const commands = [
  ['servidor', resolve(root, 'server/index.js')],
  ['interface', resolve(root, 'node_modules/vite/bin/vite.js')],
];
const children = commands.map(([name, script]) => {
  const child = spawn(process.execPath, [script], {
    cwd: root,
    stdio: 'inherit',
  });
  child.on('error', (error) => {
    console.error(`[${name}] não iniciou:`, error);
  });
  return child;
});

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  setTimeout(() => process.exit(exitCode), 50);
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (!stopping && (code !== 0 || signal)) {
      stop(code || 1);
    }
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
