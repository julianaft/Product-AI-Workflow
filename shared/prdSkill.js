/**
 * Skill de PRD — implementacao deterministica.
 *
 * O documento segue o modelo de PRDs reais de produto: iniciativa OKR,
 * pessoas por área, hipóteses com dor/decisão, métricas AS IS/TO BE,
 * soluções com jornada, CAs agrupados, permissão, regras de campo, erros,
 * fora de escopo, dependencias e epicos.
 *
 * Regra central: só usa informação do payload. O que falta vira pergunta
 * em aberto, nunca texto inventado.
 */

import {
  ACCEPTANCE_TEMPLATE,
  HYPOTHESIS_TEMPLATE,
  METRIC_TEMPLATE,
  PRD_SECTION_KEYS,
  PRD_SECTIONS,
  SOLUTION_TEMPLATE,
} from './prdSections.js';
import { getFramework } from './frameworks.js';

export { PRD_SECTION_KEYS, PRD_SECTIONS };

export const PRD_MISSING = 'Não informado no discovery. Ver perguntas em aberto.';
const MISSING = PRD_MISSING;

function text(value) {
  return String(value ?? '').trim();
}

function isBlank(value) {
  return text(value).length === 0;
}

function orMissing(value) {
  return isBlank(value) ? MISSING : text(value);
}

const CONTEXT_STOPWORDS = new Set([
  'para',
  'como',
  'esta',
  'este',
  'essa',
  'esse',
  'isso',
  'aqui',
  'ainda',
  'quando',
  'onde',
  'porque',
  'sobre',
  'entre',
  'depois',
  'antes',
  'muito',
  'pouco',
  'mais',
  'menos',
  'todo',
  'toda',
  'todos',
  'todas',
  'pelo',
  'pela',
  'pelos',
  'pelas',
  'uma',
  'umas',
  'com',
  'sem',
  'que',
  'nao',
  'sim',
  'dos',
  'das',
  'nos',
  'nas',
  'fonte',
  'arquivo',
  'externa',
  'conteudo',
  'lido',
  'automaticamente',
]);

function tokenize(value) {
  return text(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !CONTEXT_STOPWORDS.has(token));
}

function uniqueTokens(value) {
  return [...new Set(tokenize(value))];
}

function initiativeFocus({ initiative = {}, discovery = {} }) {
  return [
    initiative.name,
    initiative.problem,
    initiative.description,
    initiative.audience,
    initiative.expectedOutcome,
    initiative.constraints,
    discovery.problem,
    discovery.solution,
    discovery.outcome,
  ]
    .map((item) => text(item))
    .filter(Boolean);
}

function splitContextChunks(value) {
  const blocks = text(value)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  const chunks = [];

  for (const block of blocks) {
    if (block.length > 500) {
      chunks.push(
        ...block
          .split(/(?<=[.!?])\s+/)
          .map((sentence) => sentence.trim())
          .filter((sentence) => sentence.length > 24),
      );
    } else {
      chunks.push(block);
    }
  }

  return chunks;
}

const MAX_CONTEXT_CHUNKS = 8;

/**
 * Nome do produto, da squad e da área aparecem em praticamente todo parágrafo
 * do contexto de negócio — inclusive nos que dizem não ter relação com a
 * iniciativa. Por isso não contam como evidência de relevância.
 */
function ambientTokens(product = {}) {
  return new Set(
    [product.name, product.projectName, product.squad, product.tribe, product.directorate]
      .flatMap((value) => uniqueTokens(value)),
  );
}

function selectRelevantBusinessContext(businessContext, focusTexts, ambient = new Set()) {
  const focusTokens = new Set(
    focusTexts.flatMap((item) => uniqueTokens(item)).filter((token) => !ambient.has(token)),
  );
  if (focusTokens.size === 0) return '';

  return splitContextChunks(businessContext)
    .map((chunk, position) => {
      const tokens = uniqueTokens(chunk);
      const overlap = tokens.filter((token) => focusTokens.has(token)).length;
      return {
        chunk,
        position,
        overlap,
        density: tokens.length > 0 ? overlap / tokens.length : 0,
      };
    })
    .filter(({ overlap }) => overlap > 0)
    .sort(
      (a, b) => b.overlap - a.overlap || b.density - a.density || a.position - b.position,
    )
    .slice(0, MAX_CONTEXT_CHUNKS)
    .sort((a, b) => a.position - b.position)
    .map(({ chunk }) => chunk)
    .join('\n\n');
}

function formatContext({ product = {}, initiative = {}, discovery = {} }) {
  const focusTexts = initiativeFocus({ initiative, discovery });
  const parts = [];

  if (text(initiative.name)) {
    parts.push(`Iniciativa em foco: ${text(initiative.name)}.`);
  }
  if (text(initiative.problem)) {
    parts.push(`Problema tratado neste fluxo: ${text(initiative.problem)}`);
  }
  if (text(initiative.description)) {
    parts.push(`Entrega prevista: ${text(initiative.description)}`);
  }

  const relevantBusiness = selectRelevantBusinessContext(
    product.businessContext,
    focusTexts,
    ambientTokens(product),
  );
  if (relevantBusiness) {
    parts.push(
      `Trechos do contexto de negócio relacionados a esta iniciativa:\n${relevantBusiness}`,
    );
  } else if (text(product.businessContext)) {
    parts.push(
      'O contexto de negócio anexado não teve trechos claramente ligados a esta iniciativa. O texto completo não foi copiado para o PRD.',
    );
  }

  if (text(product.technicalContext)) {
    parts.push(`Contexto técnico desta iniciativa:\n${text(product.technicalContext)}`);
  }

  return orMissing(parts.join('\n\n'));
}

function bulletize(value) {
  if (isBlank(value)) return MISSING;

  return text(value)
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join('\n');
}

function listPeople(value) {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean);
  }
  return text(value)
    .split(/[,;/\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function discoveryValue(discovery, key) {
  return text(discovery?.fields?.[key]);
}

function normalizeDiscovery(discovery = {}) {
  const framework = getFramework(discovery.framework);

  switch (discovery.framework) {
    case 'opportunity-tree':
      return {
        frameworkLabel: framework?.label ?? 'Discovery',
        outcome: discoveryValue(discovery, 'outcome'),
        problem: discoveryValue(discovery, 'opportunities'),
        solution: discoveryValue(discovery, 'solutions'),
        experiments: discoveryValue(discovery, 'experiments'),
        hypotheses: '',
        certainties: '',
        doubts: '',
      };

    case 'csd':
      return {
        frameworkLabel: framework?.label ?? 'Discovery',
        outcome: '',
        problem: discoveryValue(discovery, 'doubts'),
        solution: '',
        experiments: '',
        hypotheses: discoveryValue(discovery, 'assumptions'),
        certainties: discoveryValue(discovery, 'certainties'),
        doubts: discoveryValue(discovery, 'doubts'),
      };

    case 'double-diamond':
      return {
        frameworkLabel: framework?.label ?? 'Discovery',
        outcome: '',
        problem: discoveryValue(discovery, 'define'),
        solution: discoveryValue(discovery, 'deliver'),
        experiments: discoveryValue(discovery, 'develop'),
        hypotheses: '',
        certainties: discoveryValue(discovery, 'discover'),
        doubts: '',
      };

    case 'jtbd':
      return {
        frameworkLabel: framework?.label ?? 'Discovery',
        outcome: discoveryValue(discovery, 'desiredOutcomes'),
        problem: [
          discoveryValue(discovery, 'situation'),
          discoveryValue(discovery, 'job'),
          discoveryValue(discovery, 'currentAlternatives'),
        ]
          .filter(Boolean)
          .join('\n'),
        solution: '',
        experiments: '',
        hypotheses: discoveryValue(discovery, 'forces'),
        certainties: '',
        doubts: '',
      };

    case 'assumption-mapping':
      return {
        frameworkLabel: framework?.label ?? 'Discovery',
        outcome: '',
        problem: discoveryValue(discovery, 'riskiestAssumptions'),
        solution: '',
        experiments: discoveryValue(discovery, 'validationPlan'),
        hypotheses: [
          discoveryValue(discovery, 'desirability'),
          discoveryValue(discovery, 'viability'),
          discoveryValue(discovery, 'feasibility'),
        ]
          .filter(Boolean)
          .join('\n'),
        certainties: '',
        doubts: discoveryValue(discovery, 'riskiestAssumptions'),
      };

    case 'impact-mapping':
      return {
        frameworkLabel: framework?.label ?? 'Discovery',
        outcome: [
          discoveryValue(discovery, 'goal'),
          discoveryValue(discovery, 'measures'),
        ]
          .filter(Boolean)
          .join('\n'),
        problem: [
          discoveryValue(discovery, 'actors'),
          discoveryValue(discovery, 'impacts'),
        ]
          .filter(Boolean)
          .join('\n'),
        solution: discoveryValue(discovery, 'deliverables'),
        experiments: '',
        hypotheses: discoveryValue(discovery, 'impacts'),
        certainties: '',
        doubts: '',
      };

    case 'user-story-mapping':
      return {
        frameworkLabel: framework?.label ?? 'Discovery',
        outcome: discoveryValue(discovery, 'personas'),
        problem: discoveryValue(discovery, 'gaps'),
        solution: [
          discoveryValue(discovery, 'backbone'),
          discoveryValue(discovery, 'tasks'),
          discoveryValue(discovery, 'releaseSlices'),
        ]
          .filter(Boolean)
          .join('\n'),
        experiments: '',
        hypotheses: '',
        certainties: '',
        doubts: discoveryValue(discovery, 'gaps'),
      };

    case 'service-blueprint':
      return {
        frameworkLabel: framework?.label ?? 'Discovery',
        outcome: discoveryValue(discovery, 'journey'),
        problem: discoveryValue(discovery, 'failurePoints'),
        solution: [
          discoveryValue(discovery, 'frontstage'),
          discoveryValue(discovery, 'backstage'),
          discoveryValue(discovery, 'supportSystems'),
        ]
          .filter(Boolean)
          .join('\n'),
        experiments: '',
        hypotheses: '',
        certainties: discoveryValue(discovery, 'userActions'),
        doubts: discoveryValue(discovery, 'failurePoints'),
      };

    case 'value-proposition-canvas':
      return {
        frameworkLabel: framework?.label ?? 'Discovery',
        outcome: discoveryValue(discovery, 'gains'),
        problem: [
          discoveryValue(discovery, 'customerJobs'),
          discoveryValue(discovery, 'pains'),
        ]
          .filter(Boolean)
          .join('\n'),
        solution: [
          discoveryValue(discovery, 'productsServices'),
          discoveryValue(discovery, 'painRelievers'),
          discoveryValue(discovery, 'gainCreators'),
        ]
          .filter(Boolean)
          .join('\n'),
        experiments: discoveryValue(discovery, 'fitEvidence'),
        hypotheses: '',
        certainties: '',
        doubts: '',
      };

    case 'design-sprint':
      return {
        frameworkLabel: framework?.label ?? 'Discovery',
        outcome: discoveryValue(discovery, 'challenge'),
        problem: discoveryValue(discovery, 'sprintQuestions'),
        solution: discoveryValue(discovery, 'solutionIdeas'),
        experiments: [
          discoveryValue(discovery, 'prototype'),
          discoveryValue(discovery, 'testResults'),
        ]
          .filter(Boolean)
          .join('\n'),
        hypotheses: discoveryValue(discovery, 'sprintQuestions'),
        certainties: '',
        doubts: '',
      };

    case 'lean-canvas':
      return {
        frameworkLabel: framework?.label ?? 'Discovery',
        outcome: [
          discoveryValue(discovery, 'uniqueValueProposition'),
          discoveryValue(discovery, 'metrics'),
        ]
          .filter(Boolean)
          .join('\n'),
        problem: [
          discoveryValue(discovery, 'problems'),
          discoveryValue(discovery, 'segments'),
        ]
          .filter(Boolean)
          .join('\n'),
        solution: [
          discoveryValue(discovery, 'solution'),
          discoveryValue(discovery, 'channels'),
          discoveryValue(discovery, 'businessModel'),
        ]
          .filter(Boolean)
          .join('\n'),
        experiments: '',
        hypotheses: discoveryValue(discovery, 'problems'),
        certainties: '',
        doubts: '',
      };

    default:
      return {
        frameworkLabel: 'Discovery',
        outcome: '',
        problem: '',
        solution: '',
        experiments: '',
        hypotheses: '',
        certainties: '',
        doubts: '',
      };
  }
}

function splitSolutionBlocks(raw) {
  const source = text(raw);
  if (!source) return [];

  const chunks = source.split(/\n(?=solu[cç][aã]o\s*\d+\s*[:.-])/i);
  if (chunks.length > 1) {
    return chunks.map((chunk) => text(chunk)).filter(Boolean);
  }
  return [source];
}

function formatHypotheses({ discovery, initiative }) {
  const source = discovery.hypotheses || initiative.problem;
  if (isBlank(source)) {
    return `${MISSING}\n\nModelo esperado:\n${HYPOTHESIS_TEMPLATE}`;
  }

  if (/^h\d+\s*:/i.test(text(source))) {
    return text(source);
  }

  const lines = text(source)
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

  return lines
    .map((line, index) => {
      return [
        `H${index + 1}: ${line.slice(0, 80)}`,
        `Dor: ${line}`,
        'Hipótese: Se [ação], então [resultado mensurável] — [a preencher]',
        'Decisão: [a preencher]',
      ].join('\n');
    })
    .join('\n\n');
}

function formatImpactMetrics({ initiative, discovery }) {
  const outcome = initiative.expectedOutcome || discovery.outcome;
  if (isBlank(outcome)) {
    return `${MISSING}\n\nModelo esperado:\n${METRIC_TEMPLATE}`;
  }

  return [
    'Solução 1: [nome da solução — a confirmar]',
    `- Resultado esperado informado: ${text(outcome)}`,
    '- Cobertura: [a preencher]',
    '- Volume: [a preencher]',
    '- AS IS: [tempo ou esforço atual — a preencher]',
    '- TO BE: [tempo ou esforço esperado — a preencher]',
    '- Redução / impacto: [delta — a preencher se não estiver no resultado esperado]',
  ].join('\n');
}

function formatSolutions({ discovery, initiative }) {
  const blocks = splitSolutionBlocks(discovery.solution || initiative.description);
  if (blocks.length === 0) {
    return `${MISSING}\n\nModelo esperado:\n${SOLUTION_TEMPLATE}`;
  }

  return blocks
    .map((block, index) => {
      const title = /^solu[cç][aã]o\s*\d+/i.test(block)
        ? block.split('\n')[0]
        : `Solução ${index + 1}: ${initiative.name || 'sem título'}`;
      const body = /^solu[cç][aã]o\s*\d+/i.test(block)
        ? block.split('\n').slice(1).join('\n').trim()
        : block;

      return [
        title,
        'Aplicável a: [a preencher]',
        'Jornada AS IS:',
        '- [a preencher]',
        'Jornada TO BE:',
        '- [a preencher]',
        `Descrição: ${body || MISSING}`,
        'Mudanças necessárias:',
        '- [a preencher]',
      ].join('\n');
    })
    .join('\n\n');
}

function formatAcceptanceCriteria({ discovery, initiative }) {
  const blocks = splitSolutionBlocks(discovery.solution || initiative.description);
  if (blocks.length === 0) {
    return `${MISSING}\n\nModelo esperado:\n${ACCEPTANCE_TEMPLATE}`;
  }

  return blocks
    .map((block, index) => {
      const name = /^solu[cç][aã]o\s*\d+/i.test(block)
        ? block.split('\n')[0]
        : `Solução ${index + 1}`;
      return [
        name,
        'CA1: Dado [contexto], quando [ação], então [resultado observável] — [a preencher]',
      ].join('\n');
    })
    .join('\n\n');
}

function formatStakeholders({ product, initiative }) {
  const groups = [];
  const squadPeople = listPeople(product.owners);
  if (product.squad || squadPeople.length) {
    groups.push(
      `- Squad ${product.squad || '[squad]'}: ${squadPeople.join(', ') || '[a preencher]'}`,
    );
  }
  if (!isBlank(initiative.stakeholders)) {
    groups.push(bulletize(initiative.stakeholders));
  }
  if (!isBlank(product.pm)) groups.push(`- PM / GPM: ${text(product.pm)}`);
  if (!isBlank(product.pd)) groups.push(`- PD: ${text(product.pd)}`);
  if (!isBlank(product.tm)) groups.push(`- TM: ${text(product.tm)}`);
  if (!isBlank(product.tl)) groups.push(`- TL: ${text(product.tl)}`);

  return groups.length ? groups.join('\n') : MISSING;
}

function formatOkr({ initiative }) {
  const code = text(initiative.okrCode);
  const name = text(initiative.name);
  if (!code && !name) return MISSING;
  if (code && name) return `${code} - ${name}`;
  if (code) return code;
  return `${name}\nCódigo OKR: [a preencher]`;
}

function buildOpenQuestions({ product, initiative, discovery, sections }) {
  const questions = [];

  if (isBlank(initiative.okrCode)) {
    questions.push('Qual é o código da iniciativa OKR?');
  }
  if (isBlank(initiative.expectedOutcome) && isBlank(discovery.outcome)) {
    questions.push('Qual métrica de negócio comprova o sucesso, com baseline AS IS e meta TO BE?');
  }
  if (isBlank(discovery.problem) && isBlank(initiative.problem)) {
    questions.push('Qual problema, com evidência, esta iniciativa resolve?');
  }
  if (isBlank(discovery.solution) && isBlank(initiative.description)) {
    questions.push('Quais soluções entram nesta entrega e para que recorte cada uma vale?');
  }
  if (!text(sections.solutions).includes('Jornada AS IS') || text(sections.solutions).includes('[a preencher]')) {
    questions.push('A jornada AS IS e TO BE de cada solução foi descrita passo a passo?');
  }
  if (text(sections.acceptanceCriteria).includes('[a preencher]') || sections.acceptanceCriteria === MISSING) {
    questions.push('Os critérios de aceite estão escritos de forma verificável por solução?');
  }
  if (sections.outOfScope === MISSING || /n[aã]o definido/i.test(sections.outOfScope)) {
    questions.push('O que explicitamente fica fora desta entrega?');
  }
  if (isBlank(product.pm) && listPeople(product.owners).length === 0) {
    questions.push('Quem são as pessoas envolvidas, agrupadas por área?');
  }

  for (const section of PRD_SECTIONS) {
    if (sections[section.key] === MISSING) {
      questions.push(`Seção "${section.label}" sem insumo no discovery.`);
    }
  }

  return [...new Set(questions)];
}

export function generatePrd(payload = {}) {
  const product = payload.productContext ?? {};
  const initiative = payload.initiative ?? {};
  const classification = payload.initiativeClassification ?? {};
  const discovery = normalizeDiscovery(payload.discovery ?? {});
  const links = Array.isArray(payload.referenceLinks) ? payload.referenceLinks : [];

  const sections = {
    okrInitiative: formatOkr({ initiative }),
    stakeholders: formatStakeholders({ product, initiative }),
    context: formatContext({ product, initiative, discovery }),
    problem: orMissing(discovery.problem || initiative.problem),
    audience: orMissing(initiative.audience),
    hypotheses: formatHypotheses({ discovery, initiative }),
    impactMetrics: formatImpactMetrics({ initiative, discovery }),
    solutions: formatSolutions({ discovery, initiative }),
    permissions: MISSING,
    fieldRules: MISSING,
    errorHandling: MISSING,
    acceptanceCriteria: formatAcceptanceCriteria({ discovery, initiative }),
    outOfScope: MISSING,
    dependencies: isBlank(initiative.constraints) ? MISSING : bulletize(initiative.constraints),
    epics: MISSING,
    risks: isBlank(initiative.constraints) ? MISSING : bulletize(initiative.constraints),
    assumptions: bulletize(discovery.certainties),
    experiments: bulletize(discovery.experiments),
  };

  applyPayloadAnswers(sections, payload.prdAnswers);

  const openQuestions = subtractAnsweredQuestions(
    buildOpenQuestions({ product, initiative, discovery, sections }),
    payload.prdAnswers,
  );
  const owners = listPeople(product.owners);
  const previousRevision = Number(payload.currentPrd?.revision ?? 0);

  return {
    title: text(initiative.name) || 'PRD sem título',
    revision: previousRevision + 1,
    metadata: {
      directorate: text(product.directorate),
      product: text(product.name),
      tribe: text(product.tribe),
      squad: text(product.squad),
      pm: text(product.pm),
      pd: text(product.pd),
      writers: listPeople(product.writers).length ? listPeople(product.writers) : owners,
      tm: text(product.tm),
      tl: text(product.tl),
      owners,
      okrCode: text(initiative.okrCode),
      initiativeType: classification.type ?? null,
      discoveryFramework: payload.discovery?.framework ?? null,
      status: 'draft',
      reviewers: Array.isArray(payload.reviewers) ? payload.reviewers : [],
    },
    sections,
    openQuestions,
    references: links.map((link) => ({
      type: link.type,
      title: link.title,
      url: link.url,
    })),
    traceability: {
      framework: discovery.frameworkLabel,
      discoveryApproved: Boolean(payload.discovery?.approved),
      generatedFrom: [
        'productContext',
        'initiative',
        'discovery',
        ...(Array.isArray(payload.prdAnswers) && payload.prdAnswers.length > 0
          ? ['prdRevisionChat']
          : []),
      ],
      model: 'prd-v2-input-output',
    },
    generatedAt: new Date().toISOString(),
  };
}

function applyPayloadAnswers(sections, answers = []) {
  if (!Array.isArray(answers)) return;

  for (const item of answers) {
    const key = item?.sectionKey;
    const answer = text(item?.answer);
    if (!key || !answer || typeof sections[key] !== 'string') continue;
    sections[key] =
      sections[key] === MISSING || isBlank(sections[key])
        ? answer
        : `${sections[key].trim()}\n\nAtualização do PM:\n${answer}`;
  }
}

function subtractAnsweredQuestions(questions, answers = []) {
  if (!Array.isArray(answers) || answers.length === 0) return questions;
  const answered = new Set(answers.map((item) => text(item?.question)).filter(Boolean));
  return questions.filter((question) => !answered.has(question));
}

export function regeneratePrdSection(payload = {}, sectionKey) {
  if (!PRD_SECTION_KEYS.includes(sectionKey)) {
    throw new Error(`Seção desconhecida: ${sectionKey}`);
  }

  const draft = generatePrd(payload);

  return {
    sectionKey,
    content: draft.sections[sectionKey],
    generatedAt: draft.generatedAt,
  };
}

export function prdToMarkdown(prd) {
  if (!prd) return '';

  const lines = [`# ${prd.title}`, ''];
  const metadata = prd.metadata ?? {};

  lines.push('| Campo | Valor |', '| --- | --- |');
  lines.push(`| Produto | ${metadata.product || '-'} |`);
  lines.push(`| PM | ${metadata.pm || '-'} |`);
  lines.push(`| PD | ${metadata.pd || '-'} |`);
  lines.push(`| TM | ${metadata.tm || '-'} |`);
  lines.push(`| TL | ${metadata.tl || '-'} |`);
  lines.push(`| Iniciativa OKR | ${metadata.okrCode || '-'} |`);
  lines.push(`| Tipo | ${metadata.initiativeType || '-'} |`);
  lines.push(`| Discovery | ${metadata.discoveryFramework || '-'} |`);
  lines.push(`| Status | ${metadata.status || 'draft'} |`, '');

  for (const section of PRD_SECTIONS) {
    lines.push(`## ${section.label}`, '', prd.sections?.[section.key] ?? MISSING, '');
  }

  if (prd.openQuestions?.length) {
    lines.push('## Perguntas em aberto', '');
    for (const question of prd.openQuestions) {
      lines.push(`- ${question}`);
    }
    lines.push('');
  }

  if (prd.references?.length) {
    lines.push('## Links importantes', '');
    for (const reference of prd.references) {
      lines.push(`- [${reference.title || reference.url}](${reference.url})`);
    }
    lines.push('');
  }

  if (metadata.reviewers?.length) {
    lines.push('## Revisores', '', '| Participante | Status da análise |', '| --- | --- |');
    for (const reviewer of metadata.reviewers) {
      lines.push(`| ${reviewer.name || reviewer} | ${reviewer.status || 'Não iniciada'} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
