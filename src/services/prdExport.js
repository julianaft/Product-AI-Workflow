import { PRD_SECTIONS } from '../../shared/prdSections.js';
import { prdToMarkdown } from '../../shared/prdSkill.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function contentToHtml(value) {
  const lines = String(value ?? '').split('\n');
  const blocks = [];
  let list = [];

  function flushList() {
    if (!list.length) return;
    blocks.push(`<ul>${list.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`);
    list = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    if (trimmed.startsWith('- ')) {
      list.push(trimmed.slice(2));
      continue;
    }
    flushList();
    blocks.push(`<p>${escapeHtml(trimmed)}</p>`);
  }
  flushList();

  return blocks.join('');
}

function metadataRows(metadata) {
  return [
    ['Produto', metadata.product],
    ['PM', metadata.pm],
    ['PD', metadata.pd],
    ['TM', metadata.tm],
    ['TL', metadata.tl],
    ['Iniciativa OKR', metadata.okrCode],
    ['Tipo da iniciativa', metadata.initiativeType],
    ['Framework de discovery', metadata.discoveryFramework],
    ['Status', metadata.status],
  ];
}

export function prdToDocumentHtml(prd) {
  const metadata = prd.metadata ?? {};
  const sections = PRD_SECTIONS.map(
    (section) =>
      `<h2>${escapeHtml(section.label)}</h2>${contentToHtml(prd.sections?.[section.key])}`,
  ).join('');
  const references = (prd.references ?? [])
    .map(
      (reference) =>
        `<li><a href="${escapeHtml(reference.url)}">${escapeHtml(reference.title || reference.url)}</a></li>`,
    )
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(prd.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #000000; background: #FFFFFF; line-height: 1.5; }
    h1 { color: #0277BD; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; }
    h2 { color: #0277BD; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-top: 24px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
    th, td { border: 1px solid #E2E8F0; padding: 8px; text-align: left; }
    th { background: #F8FAFC; width: 30%; }
  </style>
</head>
<body>
  <h1>${escapeHtml(prd.title)}</h1>
  <table>
    ${metadataRows(metadata)
      .map(
        ([label, value]) =>
          `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value || '-')}</td></tr>`,
      )
      .join('')}
  </table>
  ${sections}
  ${
    prd.openQuestions?.length
      ? `<h2>Perguntas em aberto</h2><ul>${prd.openQuestions
          .map((question) => `<li>${escapeHtml(question)}</li>`)
          .join('')}</ul>`
      : ''
  }
  ${references ? `<h2>Links importantes</h2><ul>${references}</ul>` : ''}
</body>
</html>`;
}

function safeFileName(value) {
  return String(value ?? 'prd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function downloadPrdDoc(prd) {
  const blob = new Blob([prdToDocumentHtml(prd)], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `${safeFileName(prd.title)}.doc`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyPrdForGoogleDocs(prd) {
  const html = prdToDocumentHtml(prd);
  const plainText = prdToMarkdown(prd);

  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      }),
    ]);
    return;
  }

  await navigator.clipboard.writeText(plainText);
}

