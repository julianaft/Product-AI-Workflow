/**
 * Skill de PRD — implementacao deterministica.
 *
 * Regra central: o documento so pode usar informacao que chegou no payload.
 * O que falta vira pergunta em aberto, nunca texto inventado. Uma futura versao
 * baseada em LLM deve manter exatamente o mesmo contrato de saida e a mesma regra.
 */

import { getFramework } from './frameworks.js';

export const PRD_SECTIONS = [
  { key: 'context', label: 'Contextualizacao' },
  { key: 'problem', label: 'Problema ou necessidade' },
  { key: 'audience', label: 'Publico afetado' },
  { key: 'objectives', label: 'Objetivos' },
  { key: 'hypotheses', label: 'Hipoteses' },
  { key: 'proposedSolution', label: 'Solucao proposta' },
  { key: 'scope', label: 'Escopo' },
  { key: 'outOfScope', label: 'Fora do escopo' },
  { key: 'expectedImpact', label: 'Impacto esperado' },
  { key: 'successMetrics', label: 'Metricas de sucesso' },
  { key: 'risks', label: 'Riscos' },
  { key: 'assumptions', label: 'Premissas' },
  { key: 'experiments', label: 'Experimentos' },
];

export const PRD_SECTION_KEYS = PRD_SECTIONS.map((section) => section.key);

const MISSING = 'Nao informado no discovery. Ver perguntas em aberto.';

function text(value) {
  return String(value ?? '').trim();
}

function isBlank(value) {
  return text(value).length === 0;
}

function orMissing(value) {
  return isBlank(value) ? MISSING : text(value);
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

function discoveryValue(discovery, key) {
  return text(discovery?.fields?.[key]);
}

/**
 * Extrai contexto, problema, solucao e experimentos independente do framework,
 * para que o restante do gerador nao precise conhecer cada formato.
 */
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

function buildOpenQuestions({ initiative, discovery, sections }) {
  const questions = [];

  if (isBlank(initiative.expectedOutcome) && isBlank(discovery.outcome)) {
    questions.push('Qual metrica de negocio comprova o sucesso desta iniciativa?');
  }
  if (isBlank(discovery.problem)) {
    questions.push('Qual problema, com evidencia, esta iniciativa resolve?');
  }
  if (isBlank(discovery.solution)) {
    questions.push('Qual solucao foi escolhida e por que ela venceu as alternativas?');
  }
  if (isBlank(discovery.experiments)) {
    questions.push('Como a solucao sera validada antes da construcao completa?');
  }

  for (const section of PRD_SECTIONS) {
    if (sections[section.key] === MISSING) {
      questions.push(`Secao "${section.label}" sem insumo no discovery.`);
    }
  }

  return [...new Set(questions)];
}

/**
 * Gera o rascunho completo do PRD a partir do contexto aprovado.
 */
export function generatePrd(payload = {}) {
  const product = payload.productContext ?? {};
  const initiative = payload.initiative ?? {};
  const classification = payload.initiativeClassification ?? {};
  const discovery = normalizeDiscovery(payload.discovery ?? {});
  const links = Array.isArray(payload.referenceLinks) ? payload.referenceLinks : [];

  const sections = {
    context: orMissing(
      [product.businessContext, product.technicalContext].filter(Boolean).join('\n\n'),
    ),
    problem: orMissing(discovery.problem || initiative.problem),
    audience: orMissing(initiative.audience),
    objectives: bulletize(initiative.expectedOutcome || discovery.outcome),
    hypotheses: bulletize(discovery.hypotheses || discovery.problem),
    proposedSolution: orMissing(discovery.solution || initiative.description),
    scope: bulletize(discovery.solution),
    outOfScope: 'Nao definido. Listar explicitamente o que fica fora desta entrega.',
    expectedImpact: bulletize(discovery.outcome || initiative.expectedOutcome),
    successMetrics: isBlank(initiative.expectedOutcome)
      ? MISSING
      : `- Metrica derivada do resultado esperado: ${text(initiative.expectedOutcome)}\n- Meta numerica: a definir com o time de dados.`,
    risks: isBlank(initiative.constraints)
      ? MISSING
      : bulletize(initiative.constraints),
    assumptions: bulletize(discovery.certainties),
    experiments: bulletize(discovery.experiments),
  };

  const openQuestions = buildOpenQuestions({ initiative, discovery, sections });

  return {
    title: text(initiative.name) || 'PRD sem titulo',
    metadata: {
      product: text(product.name),
      tribe: text(product.tribe),
      squad: text(product.squad),
      owners: Array.isArray(product.owners) ? product.owners : [],
      initiativeType: classification.type ?? null,
      discoveryFramework: payload.discovery?.framework ?? null,
      status: 'draft',
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
      generatedFrom: ['productContext', 'initiative', 'discovery'],
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Regera uma unica secao, preservando o restante do documento editado.
 */
export function regeneratePrdSection(payload = {}, sectionKey) {
  if (!PRD_SECTION_KEYS.includes(sectionKey)) {
    throw new Error(`Secao desconhecida: ${sectionKey}`);
  }

  const draft = generatePrd(payload);

  return {
    sectionKey,
    content: draft.sections[sectionKey],
    generatedAt: draft.generatedAt,
  };
}

/**
 * Renderiza o PRD em Markdown para exportacao.
 */
export function prdToMarkdown(prd) {
  if (!prd) return '';

  const lines = [`# ${prd.title}`, ''];
  const metadata = prd.metadata ?? {};

  lines.push('| Campo | Valor |', '| --- | --- |');
  lines.push(`| Produto | ${metadata.product || '-'} |`);
  lines.push(`| Tribo | ${metadata.tribe || '-'} |`);
  lines.push(`| Squad | ${metadata.squad || '-'} |`);
  lines.push(`| Responsaveis | ${(metadata.owners ?? []).join(', ') || '-'} |`);
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
    lines.push('## Referencias', '');
    for (const reference of prd.references) {
      lines.push(`- [${reference.title || reference.url}](${reference.url})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
