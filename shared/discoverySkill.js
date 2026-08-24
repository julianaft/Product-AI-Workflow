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

const FRAMEWORK_SIGNALS = {
  'service-blueprint': [
    'handoff',
    'processo operacional',
    'operacao',
    'operação',
    'varios sistemas',
    'vários sistemas',
    'integracao',
    'integração',
    'canal',
    'backoffice',
    'retrabalho',
  ],
  'user-story-mapping': [
    'mvp',
    'release',
    'fatiar',
    'priorizar escopo',
    'jornada ponta a ponta',
    'fluxo completo',
    'etapas da jornada',
  ],
  jtbd: [
    'motivacao',
    'motivação',
    'comportamento',
    'por que o usuario',
    'por que o usuário',
    'alternativa atual',
    'necessidade do usuario',
    'necessidade do usuário',
    'abandono',
  ],
  'assumption-mapping': [
    'risco',
    'suposicao',
    'suposição',
    'hipotese critica',
    'hipótese crítica',
    'validar antes',
    'incerteza',
  ],
  'impact-mapping': [
    'okr',
    'meta de negocio',
    'meta de negócio',
    'stakeholder',
    'ator',
    'mudanca de comportamento',
    'mudança de comportamento',
    'impacto',
  ],
  'value-proposition-canvas': [
    'proposta de valor',
    'fit',
    'segmento',
    'dor do cliente',
    'ganho do cliente',
    'diferencial',
  ],
  'design-sprint': [
    'prototipo',
    'protótipo',
    'testar rapido',
    'testar rápido',
    'decisao urgente',
    'decisão urgente',
    'cinco dias',
    'uma semana',
  ],
  'lean-canvas': [
    'modelo de negocio',
    'modelo de negócio',
    'receita',
    'custos',
    'early adopter',
    'novo mercado',
    'startup',
    'canal de aquisicao',
    'canal de aquisição',
  ],
};

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
  const frameworkScores = Object.fromEntries(
    Object.entries(FRAMEWORK_SIGNALS).map(([id, signals]) => [id, countSignals(text, signals)]),
  );
  const [strongestFramework, strongestScore] = Object.entries(frameworkScores).sort(
    (left, right) => right[1] - left[1],
  )[0];

  let recommended;
  let reason;

  if (strongestScore >= 2 && availableFrameworks.includes(strongestFramework)) {
    recommended = strongestFramework;
    reason = recommendationReason(strongestFramework);
  } else if (initiativeType === 'new') {
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

  const alternatives = rankAlternatives({
    availableFrameworks,
    recommended,
    frameworkScores,
    initiativeType,
    uncertainty,
    evidence,
  })
    .slice(0, 3)
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

function recommendationReason(frameworkId) {
  const reasons = {
    jtbd:
      'A principal incerteza esta no comportamento e na motivacao do usuario; Jobs To Be Done ajuda a entender o progresso buscado antes de escolher a solucao.',
    'assumption-mapping':
      'A iniciativa explicita riscos e hipoteses criticas; o Mapa de Suposicoes prioriza o que precisa ser validado primeiro.',
    'impact-mapping':
      'A iniciativa parte de uma meta e envolve atores ou mudancas de comportamento; Impact Mapping conecta esses elementos as entregas.',
    'user-story-mapping':
      'O fluxo e conhecido, mas precisa ser organizado e fatiado; User Story Mapping torna a jornada e os cortes de MVP visiveis.',
    'service-blueprint':
      'A dor atravessa operacao, canais ou sistemas; Service Blueprint evidencia frontstage, backstage, handoffs e pontos de falha.',
    'value-proposition-canvas':
      'A incerteza esta no encaixe entre o segmento e a proposta; o Value Proposition Canvas cruza jobs, dores, ganhos e resposta de valor.',
    'design-sprint':
      'Existe uma decisao de alto risco que precisa de prototipo e teste rapido; Design Sprint organiza essa validacao.',
    'lean-canvas':
      'A iniciativa envolve um novo produto, mercado ou modelo de negocio; Lean Canvas estrutura as hipoteses de negocio antes do investimento.',
  };
  return reasons[frameworkId] ?? 'O contexto informado corresponde a necessidade deste framework.';
}

function rankAlternatives({
  availableFrameworks,
  recommended,
  frameworkScores,
  initiativeType,
  uncertainty,
  evidence,
}) {
  const baseScores = {
    'opportunity-tree': initiativeType === 'incremental' ? 2 : 0,
    csd: uncertainty > evidence ? 2 : 0,
    'double-diamond': initiativeType === 'new' ? 2 : 0,
    ...frameworkScores,
  };

  return [...availableFrameworks]
    .filter((id) => id !== recommended)
    .sort((left, right) => (baseScores[right] ?? 0) - (baseScores[left] ?? 0));
}

function alternativeReason(frameworkId) {
  switch (frameworkId) {
    case 'opportunity-tree':
      return 'Use se o objetivo ja estiver claro e faltar apenas destrinchar dores e solucoes.';
    case 'csd':
      return 'Use se o time ainda discorda sobre o que e fato e o que e suposicao.';
    case 'double-diamond':
      return 'Use se o problema ainda pode mudar de forma durante a pesquisa.';
    case 'jtbd':
      return 'Use se a maior duvida for por que o usuario muda de comportamento ou contrata uma solucao.';
    case 'assumption-mapping':
      return 'Use se ja ha uma solucao e o risco esta nas suposicoes sem evidencia.';
    case 'impact-mapping':
      return 'Use se for preciso alinhar meta, atores, impactos e entregas.';
    case 'user-story-mapping':
      return 'Use se a jornada estiver clara, mas o MVP e as releases ainda nao.';
    case 'service-blueprint':
      return 'Use se a experiencia depender de operacao, handoffs ou varios sistemas.';
    case 'value-proposition-canvas':
      return 'Use se o encaixe entre segmento, dores e proposta de valor estiver incerto.';
    case 'design-sprint':
      return 'Use se uma decisao critica precisar de prototipo e teste rapido.';
    case 'lean-canvas':
      return 'Use se produto, mercado ou modelo de negocio ainda forem hipoteses.';
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
    jtbd: {
      situation: `Publico: ${audience}. Contexto em que a necessidade aparece: ${PENDING}.`,
      job: `Quando ${PENDING}, quero ${problem}, para ${outcome}.`,
      currentAlternatives: `${PENDING} — como o publico resolve esse problema hoje.`,
      forces: `${PENDING} — pressao, atracao, ansiedade e habitos que influenciam a mudanca.`,
      desiredOutcomes: outcome,
    },
    'assumption-mapping': {
      desirability: problem === PENDING ? PENDING : `Acreditamos que o publico precisa resolver: ${problem}`,
      viability: `${PENDING} — restricoes de negocio, custo e operacao.`,
      feasibility: initiative.constraints || `${PENDING} — tecnologia, dados, prazo e dependencias.`,
      riskiestAssumptions: `${PENDING} — ordenar por importancia e falta de evidencia.`,
      validationPlan: `${PENDING} — experimento, evidencia esperada e criterio de sucesso.`,
    },
    'impact-mapping': {
      goal: outcome,
      actors: audience,
      impacts: `${PENDING} — o que cada ator precisa fazer de forma diferente.`,
      deliverables: description,
      measures: `${PENDING} — medida do comportamento e da meta.`,
    },
    'user-story-mapping': {
      personas: `${audience} — objetivo: ${outcome}.`,
      backbone: `${PENDING} — atividades principais em ordem.`,
      tasks: `${PENDING} — passos executados em cada atividade.`,
      releaseSlices: `${PENDING} — corte do MVP e releases seguintes.`,
      gaps: `${PENDING} — edge cases, dependencias e comportamentos ausentes.`,
    },
    'service-blueprint': {
      journey: `${PENDING} — etapas ponta a ponta do processo.`,
      userActions: `${audience}: ${problem}`,
      frontstage: `${PENDING} — telas, pessoas e respostas visiveis.`,
      backstage: `${PENDING} — regras e processos internos.`,
      supportSystems:
        product.technicalContext || `${PENDING} — sistemas, dados, integracoes e times.`,
      failurePoints: `${problem}\nEvidencia: ${PENDING}.`,
    },
    'value-proposition-canvas': {
      customerJobs: problem,
      pains: problem,
      gains: outcome,
      productsServices: description,
      painRelievers: `${PENDING} — como a proposta reduz cada dor prioritaria.`,
      gainCreators: `${PENDING} — como a proposta produz os ganhos esperados.`,
      fitEvidence: `${PENDING} — evidencias de encaixe e lacunas a validar.`,
    },
    'design-sprint': {
      challenge: `${problem}\nObjetivo de longo prazo: ${outcome}.`,
      sprintQuestions: `${PENDING} — o que precisa ser verdade para a solucao funcionar.`,
      map: `${audience} — inicio: ${PENDING}; fim: ${outcome}.`,
      solutionIdeas: description,
      prototype: `${PENDING} — recorte do prototipo e tarefa do teste.`,
      testResults: `${PENDING} — padroes observados, criterio e decisao.`,
    },
    'lean-canvas': {
      problems: problem,
      segments: audience,
      uniqueValueProposition: `${outcome}\nDiferencial: ${PENDING}.`,
      solution: description,
      channels: `${PENDING} — como alcancar e atender o segmento.`,
      metrics: outcome,
      businessModel: `${PENDING} — receita, custos e vantagem dificil de copiar.`,
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
