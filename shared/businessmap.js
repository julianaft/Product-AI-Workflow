const BUSINESSMAP_HOST = 'grupoboticario.kanbanize.com';
const BOARD_PATH = /^\/ctrl_board\/(\d+)\/?$/;

function text(value) {
  return String(value ?? '').trim();
}

function content(value) {
  return text(value) || 'TBD';
}

export function parseBusinessmapBoardUrl(value) {
  let url;
  try {
    url = new URL(text(value));
  } catch {
    throw new Error('Informe um link válido do board do Businessmap.');
  }

  const match = url.pathname.match(BOARD_PATH);
  if (url.protocol !== 'https:' || url.hostname !== BUSINESSMAP_HOST || !match) {
    throw new Error(
      `Use um link no formato https://${BUSINESSMAP_HOST}/ctrl_board/379.`,
    );
  }

  const boardId = Number(match[1]);
  return {
    boardId,
    boardUrl: `https://${BUSINESSMAP_HOST}/ctrl_board/${boardId}`,
    apiBaseUrl: `https://${BUSINESSMAP_HOST}/api/v2`,
  };
}

export function validateBusinessmapConfig({ boardUrl, apiKey } = {}) {
  const hasBoard = Boolean(text(boardUrl));
  const hasKey = Boolean(text(apiKey));
  const errors = {};

  if (!hasBoard && !hasKey) return errors;
  if (!hasBoard) errors.businessmapBoardUrl = 'Informe o link do board.';
  if (!hasKey) errors.businessmapApiKey = 'Informe a chave de API.';

  if (hasBoard) {
    try {
      parseBusinessmapBoardUrl(boardUrl);
    } catch (error) {
      errors.businessmapBoardUrl = error.message;
    }
  }

  return errors;
}

export function businessmapIsConfigured(product = {}) {
  return (
    Boolean(text(product.businessmapBoardUrl)) &&
    Boolean(text(product.businessmapApiKey)) &&
    Object.keys(
      validateBusinessmapConfig({
        boardUrl: product.businessmapBoardUrl,
        apiKey: product.businessmapApiKey,
      }),
    ).length === 0
  );
}

function references(prd) {
  const items = Array.isArray(prd?.references) ? prd.references : [];
  if (!items.length) return 'TBD';
  return items
    .map((item) => {
      const label = text(item.title) || text(item.type) || 'Link';
      return `- ${label}: ${text(item.url)}`;
    })
    .join('\n');
}

function functionalRequirements(sections) {
  return [
    content(sections.solutions),
    `Permissionamento:\n${content(sections.permissions)}`,
    `Regras de campos e validações:\n${content(sections.fieldRules)}`,
  ].join('\n\n');
}

function dependenciesAndConstraints(sections, initiative) {
  return [
    content(sections.dependencies),
    text(initiative.constraints)
      ? `Restrições da iniciativa:\n${text(initiative.constraints)}`
      : '',
    text(sections.outOfScope) ? `Fora do escopo:\n${text(sections.outOfScope)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function testScenarios(sections) {
  return [
    content(sections.acceptanceCriteria),
    text(sections.errorHandling)
      ? `Tratamento de erros a validar:\n${text(sections.errorHandling)}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildBusinessmapStory({ prd = {}, initiative = {} } = {}) {
  const sections = prd.sections ?? {};
  const userStory =
    text(initiative.audience) &&
    text(initiative.description) &&
    text(initiative.expectedOutcome)
      ? `Como ${text(initiative.audience)},\nquero ${text(initiative.description)},\npara ${text(initiative.expectedOutcome)}.`
      : 'TBD';

  const description = [
    'Contexto',
    '',
    content(sections.context),
    '',
    '',
    'História do usuário',
    '',
    userStory,
    '',
    '',
    'Requisitos funcionais principais',
    '',
    functionalRequirements(sections),
    '',
    '',
    'Links importantes (PRD/Protótipo/Design Doc)',
    '',
    references(prd),
    '',
    '',
    'Critérios de aceite claros e objetivos',
    '',
    content(sections.acceptanceCriteria),
    '',
    '',
    'Dependências e restrições principais',
    '',
    dependenciesAndConstraints(sections, initiative),
    '',
    '',
    'Cenários de Testes',
    '',
    '',
    testScenarios(sections),
  ].join('\n');

  return {
    title: text(initiative.name) || text(prd.title) || 'Story sem título',
    description,
  };
}
