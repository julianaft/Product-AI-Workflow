/**
 * Skill de discovery — implementacao deterministica.
 *
 * Esta versao nao chama modelo de linguagem: ela aplica regras explicitas sobre
 * o texto que o PM escreveu. Serve para dois papeis:
 *   1. modo mock da interface, para desenvolver o fluxo sem custo nem credencial;
 *   2. fallback do servidor quando nenhum provedor de IA esta configurado.
 *
 * O contrato de entrada e de saida e o mesmo nos dois casos, entao trocar a
 * implementacao por uma chamada real de LLM nao muda a interface.
 */

import { FRAMEWORK_IDS, getFramework, getRequiredFieldKeys } from './frameworks.js';

const NEW_FLOW_SIGNALS = [
  'do zero',
  'nova area',
  'nova área',
  'novo produto',
  'novo app',
  'novo aplicativo',
  'nova plataforma',
  'nova jornada',
  'novo fluxo',
  'nunca existiu',
  'primeira versao',
  'primeira versão',
];

const INCREMENTAL_SIGNALS = [
  'expandir',
  'expansao',
  'expansão',
  'nova mecanica',
  'nova mecânica',
  'nova faixa',
  'novo campo',
  'ja existe',
  'já existe',
  'fase 2',
  'fase 02',
  'segunda fase',
  'melhorar',
  'ajustar',
  'integrar',
  'integracao',
  'integração',
  'atual',
];

const UNCERTAINTY_SIGNALS = [
  'acreditamos',
  'talvez',
  'nao sabemos',
  'não sabemos',
  'suspeitamos',
  'imaginamos',
  'hipotese',
  'hipótese',
  'precisamos descobrir',
  'nao esta claro',
  'não está claro',
  'a validar',
];

const EVIDENCE_SIGNALS = [
  '%',
  'dados',
  'pesquisa',
  'entrevista',
  'metrica',
  'métrica',
  'relatorio',
  'relatório',
  'medimos',
  'observamos',
];

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim();
}

function countSignals(text, signals) {
  const haystack = normalize(text);
  return signals.filter((signal) => haystack.includes(signal)).length;
}

function isBlank(value) {
  return normalize(value).length === 0;
}

function isShallow(value, minimumWords = 8) {
  const words = normalize(value).split(/\s+/).filter(Boolean);
  return words.length < minimumWords;
}

function clampConfidence(value) {
  return Math.min(0.95, Math.max(0.35, Number(value.toFixed(2))));
}

function initiativeText(initiative = {}) {
  return [
    initiative.name,
    initiative.description,
    initiative.problem,
    initiative.audience,
    initiative.expectedOutcome,
    initiative.constraints,
  ]
    .filter(Boolean)
    .join(' \n ');
}

/**
 * Classifica a iniciativa como incremental ou novo fluxo.
 * A decisao sempre volta marcada como pendente de confirmacao humana.
 */
export function classifyInitiative({ product = {}, initiative = {} } = {}) {
  const text = `${initiativeText(initiative)} \n ${product.businessContext ?? ''}`;
  const newScore = countSignals(text, NEW_FLOW_SIGNALS);
  const incrementalScore = countSignals(text, INCREMENTAL_SIGNALS);

  const type = newScore > incrementalScore ? 'new' : 'incremental';
  const distance = Math.abs(newScore - incrementalScore);
  const confidence = clampConfidence(0.5 + distance * 0.12);

  const signals = [];
  if (incrementalScore > 0) {
    signals.push(`${incrementalScore} indicio(s) de expansao sobre algo que ja existe.`);
  }
  if (newScore > 0) {
    signals.push(`${newScore} indicio(s) de construcao inedita.`);
  }
  if (signals.length === 0) {
    signals.push('Nenhum indicio forte encontrado no texto: a classificacao e um chute conservador.');
  }

  const reason =
    type === 'incremental'
      ? 'O texto descreve mudanca sobre uma base existente, entao o caminho tende a ser incremental.'
      : 'O texto descreve algo sem base anterior, entao o caminho tende a ser um fluxo novo.';

  return {
    type,
    confidence,
    reason,
    signals,
    needsConfirmation: true,
  };
}

/**
 * Recomenda um framework de discovery e devolve um rascunho dos campos.
 * O rascunho so reaproveita texto que o PM ja escreveu; nada e inventado.
 */
export function recommendDiscovery({
  product = {},
  initiative = {},
  initiativeType = 'incremental',
  availableFrameworks = FRAMEWORK_IDS,
} = {}) {
  const text = initiativeText(initiative);
  const uncertainty = countSignals(text, UNCERTAINTY_SIGNALS);
  const evidence = countSignals(text, EVIDENCE_SIGNALS);

  let recommended;
  let reason;

  if (initiativeType === 'new') {
    recommended = 'double-diamond';
    reason =
      'A iniciativa foi classificada como fluxo novo e o escopo ainda e amplo, entao vale divergir antes de convergir.';
  } else if (uncertainty > evidence) {
    recommended = 'csd';
    reason =
      'A descricao tem mais hipoteses do que evidencias, entao separar certezas, suposicoes e duvidas vem antes de desenhar solucao.';
  } else {
    recommended = 'opportunity-tree';
    reason =
      'A iniciativa expande algo existente e ja tem objetivo declarado, entao ligar objetivo, dores e experimentos e mais direto.';
  }

  if (!availableFrameworks.includes(recommended)) {
    recommended = availableFrameworks[0];
    reason = 'Framework recomendado indisponivel na configuracao atual; primeira opcao aplicada.';
  }

  const confidence = clampConfidence(0.55 + Math.abs(uncertainty - evidence) * 0.08);

  const alternatives = availableFrameworks
    .filter((id) => id !== recommended)
    .map((id) => ({
      framework: id,
      reason: alternativeReason(id),
    }));

  return {
    recommendedFramework: recommended,
    confidence,
    reason,
    alternatives,
    suggestedFields: draftFields(recommended, { product, initiative }),
    questions: openQuestions({ initiative }),
  };
}

function alternativeReason(frameworkId) {
  switch (frameworkId) {
    case 'opportunity-tree':
      return 'Use se o objetivo ja estiver claro e faltar apenas destrinchar dores e solucoes.';
    case 'csd':
      return 'Use se o time ainda discorda sobre o que e fato e o que e suposicao.';
    case 'double-diamond':
      return 'Use se o problema ainda pode mudar de forma durante a pesquisa.';
    default:
      return 'Alternativa disponivel.';
  }
}

const PENDING = '[a preencher]';

/**
 * Monta um rascunho por campo a partir do que ja foi informado.
 * Campos sem base viram um marcador explicito em vez de texto inventado.
 */
function draftFields(frameworkId, { product = {}, initiative = {} }) {
  const framework = getFramework(frameworkId);
  if (!framework) return {};

  const outcome = initiative.expectedOutcome || PENDING;
  const problem = initiative.problem || PENDING;
  const description = initiative.description || PENDING;
  const audience = initiative.audience || PENDING;

  const drafts = {
    'opportunity-tree': {
      outcome,
      opportunities:
        problem === PENDING
          ? PENDING
          : `${problem}\n\nPublico afetado: ${audience}.\nEvidencia: ${PENDING}.`,
      solutions: description,
      experiments: `${PENDING} — definir um teste que valide a solucao antes da construcao completa.`,
    },
    csd: {
      certainties:
        product.businessContext && !isBlank(product.businessContext)
          ? `Contexto conhecido do produto: ${product.businessContext}`
          : PENDING,
      assumptions: problem === PENDING ? PENDING : `Acreditamos que: ${problem}`,
      doubts: `Qual evidencia sustenta o resultado esperado "${outcome}"?`,
    },
    'double-diamond': {
      discover: `${PENDING} — listar pesquisas, entrevistas e dados ja levantados.`,
      define: problem,
      develop: description,
      deliver: `${PENDING} — escolher o recorte de MVP.`,
    },
  };

  const draft = drafts[frameworkId] ?? {};
  const allowedKeys = framework.fields.map((field) => field.key);

  return Object.fromEntries(
    Object.entries(draft).filter(([key]) => allowedKeys.includes(key)),
  );
}

function openQuestions({ initiative = {} }) {
  const questions = [];

  if (isBlank(initiative.expectedOutcome)) {
    questions.push('Qual numero muda se esta iniciativa der certo?');
  }
  if (isBlank(initiative.audience)) {
    questions.push('Quem exatamente e afetado por essa mudanca?');
  }
  if (isBlank(initiative.problem) || isShallow(initiative.problem)) {
    questions.push('Qual comportamento atual do usuario precisa mudar, e por que ele acontece hoje?');
  }
  if (isBlank(initiative.constraints)) {
    questions.push('Existe restricao de prazo, sistema legado ou dependencia externa?');
  }

  questions.push('Qual evidencia sustenta o problema descrito?');

  return questions;
}

/**
 * Sugere conteudo para um unico campo do discovery.
 */
export function suggestDiscoveryField({
  product = {},
  initiative = {},
  frameworkId,
  fieldKey,
  currentValue = '',
} = {}) {
  const drafts = draftFields(frameworkId, { product, initiative });
  const suggestion = drafts[fieldKey] ?? PENDING;

  return {
    fieldKey,
    suggestion,
    rationale:
      'Rascunho montado a partir do contexto do produto e da descricao da iniciativa. Revise antes de aceitar.',
    replacesContent: !isBlank(currentValue),
    basedOn: ['product.businessContext', 'initiative.description', 'initiative.problem'],
  };
}

/**
 * Revisa o discovery preenchido e aponta lacunas antes do PRD.
 */
export function reviewDiscovery({ frameworkId, fields = {}, initiative = {} } = {}) {
  const framework = getFramework(frameworkId);
  const gaps = [];
  const contradictions = [];
  const questions = [];

  if (!framework) {
    return {
      readyForPrd: false,
      gaps: ['Nenhum framework de discovery selecionado.'],
      contradictions,
      questions,
    };
  }

  for (const field of framework.fields) {
    const value = fields[field.key];

    if (field.required && isBlank(value)) {
      gaps.push(`"${field.label}" esta vazio.`);
      continue;
    }
    if (!isBlank(value) && String(value).includes(PENDING)) {
      gaps.push(`"${field.label}" ainda contem o marcador ${PENDING}.`);
    }
    if (field.required && isShallow(value)) {
      gaps.push(`"${field.label}" esta curto demais para sustentar uma secao do PRD.`);
    }
  }

  const allText = Object.values(fields).join(' ');
  if (countSignals(allText, EVIDENCE_SIGNALS) === 0) {
    questions.push('Nenhuma evidencia citada no discovery. Qual dado sustenta o problema?');
  }
  if (frameworkId === 'csd' && countSignals(fields.certainties ?? '', UNCERTAINTY_SIGNALS) > 0) {
    contradictions.push(
      'O campo Certezas usa linguagem de hipotese ("acreditamos", "talvez"). Mova esse conteudo para Suposicoes.',
    );
  }

  const requiredKeys = getRequiredFieldKeys(frameworkId);
  const filledRequired = requiredKeys.filter((key) => !isBlank(fields[key]));

  return {
    readyForPrd: gaps.length === 0 && filledRequired.length === requiredKeys.length,
    completeness: requiredKeys.length === 0 ? 1 : filledRequired.length / requiredKeys.length,
    gaps,
    contradictions,
    questions,
  };
}
