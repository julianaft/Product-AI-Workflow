/**
 * Skill de discovery — implementacao deterministica.
 *
 * Esta versão não chama modelo de linguagem: ela aplica regras explícitas sobre
 * o texto que o PM escreveu. Serve para dois papeis:
 *   1. modo mock da interface, para desenvolver o fluxo sem custo nem credencial;
 *   2. fallback do servidor quando nenhum provedor de IA esta configurado.
 *
 * O contrato de entrada e de saida e o mesmo nos dois casos, entao trocar a
 * implementação por uma chamada real de LLM não muda a interface.
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
 * A decisão sempre volta marcada como pendente de confirmação humana.
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
    signals.push(`${newScore} indício(s) de construção inédita.`);
  }
  if (signals.length === 0) {
    signals.push('Nenhum indício forte encontrado no texto: a classificação é um chute conservador.');
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
      'A descrição tem mais hipóteses do que evidências, então separar certezas, suposições e dúvidas vem antes de desenhar solução.';
  } else {
    recommended = 'opportunity-tree';
    reason =
      'A iniciativa expande algo existente e ja tem objetivo declarado, entao ligar objetivo, dores e experimentos e mais direto.';
  }

  if (!availableFrameworks.includes(recommended)) {
    recommended = availableFrameworks[0];
    reason = 'Framework recomendado indisponível na configuração atual; primeira opção aplicada.';
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
    suggestedFields: draftDiscoveryFields(recommended, { product, initiative }),
    questions: openQuestions({ initiative }),
  };
}

function recommendationReason(frameworkId) {
  const reasons = {
    jtbd:
      'A principal incerteza está no comportamento e na motivação do usuário; Jobs To Be Done ajuda a entender o progresso buscado antes de escolher a solução.',
    'assumption-mapping':
      'A iniciativa explicita riscos e hipóteses críticas; o Mapa de Suposições prioriza o que precisa ser validado primeiro.',
    'impact-mapping':
      'A iniciativa parte de uma meta e envolve atores ou mudancas de comportamento; Impact Mapping conecta esses elementos as entregas.',
    'user-story-mapping':
      'O fluxo e conhecido, mas precisa ser organizado e fatiado; User Story Mapping torna a jornada e os cortes de MVP visiveis.',
    'service-blueprint':
      'A dor atravessa operação, canais ou sistemas; Service Blueprint evidencia frontstage, backstage, handoffs e pontos de falha.',
    'value-proposition-canvas':
      'A incerteza esta no encaixe entre o segmento e a proposta; o Value Proposition Canvas cruza jobs, dores, ganhos e resposta de valor.',
    'design-sprint':
      'Existe uma decisão de alto risco que precisa de protótipo e teste rápido; Design Sprint organiza essa validação.',
    'lean-canvas':
      'A iniciativa envolve um novo produto, mercado ou modelo de negócio; Lean Canvas estrutura as hipóteses de negócio antes do investimento.',
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
      return 'Use se o objetivo já estiver claro e faltar apenas destrinchar dores e soluções.';
    case 'csd':
      return 'Use se o time ainda discorda sobre o que e fato e o que e suposicao.';
    case 'double-diamond':
      return 'Use se o problema ainda pode mudar de forma durante a pesquisa.';
    case 'jtbd':
      return 'Use se a maior dúvida for por que o usuário muda de comportamento ou contrata uma solução.';
    case 'assumption-mapping':
      return 'Use se já há uma solução e o risco está nas suposições sem evidência.';
    case 'impact-mapping':
      return 'Use se for preciso alinhar meta, atores, impactos e entregas.';
    case 'user-story-mapping':
      return 'Use se a jornada estiver clara, mas o MVP e as releases ainda não.';
    case 'service-blueprint':
      return 'Use se a experiência depender de operação, handoffs ou vários sistemas.';
    case 'value-proposition-canvas':
      return 'Use se o encaixe entre segmento, dores e proposta de valor estiver incerto.';
    case 'design-sprint':
      return 'Use se uma decisão crítica precisar de protótipo e teste rápido.';
    case 'lean-canvas':
      return 'Use se produto, mercado ou modelo de negócio ainda forem hipóteses.';
    default:
      return 'Alternativa disponivel.';
  }
}

export const PENDING = '[a preencher]';

function textOf(value) {
  return String(value ?? '').trim();
}

function joinBlocks(...parts) {
  return parts.map((part) => textOf(part)).filter(Boolean).join('\n\n');
}

function knownOrPending(value, fallback) {
  const current = textOf(value);
  if (current) return current;
  return fallback ? gapLine(fallback) : '';
}

function gapLine(prompt) {
  return `A validar: ${prompt}`;
}

function businessContextFromProduct(product = {}) {
  const parts = [];
  if (textOf(product.businessContext)) parts.push(textOf(product.businessContext));

  for (const source of product.businessContextSources ?? []) {
    if (source?.type === 'file' && textOf(source.content)) {
      parts.push(`${source.title || source.fileName || 'Arquivo'}: ${textOf(source.content)}`);
    } else if (textOf(source?.title) || textOf(source?.url)) {
      parts.push(`Fonte de negócio: ${textOf(source.title) || textOf(source.url)} (conteúdo não lido automaticamente).`);
    }
  }

  return parts.join('\n\n');
}

function technicalContextFromProduct(product = {}) {
  if (textOf(product.technicalContext)) return textOf(product.technicalContext);

  const repositories = (product.repositories ?? []).filter((repository) => repository.selected);
  if (!repositories.length) return '';

  return [
    'Repositórios selecionados:',
    ...repositories.map((repository) => `- ${repository.fullName || repository.url}`),
  ].join('\n');
}

function discoverySource({ product = {}, initiative = {} } = {}) {
  return {
    name: textOf(initiative.name),
    problem: textOf(initiative.problem),
    delivery: textOf(initiative.description),
    outcome: textOf(initiative.expectedOutcome),
    audience: textOf(initiative.audience),
    constraints: textOf(initiative.constraints),
    stakeholders: textOf(initiative.stakeholders),
    okrCode: textOf(initiative.okrCode),
    business: businessContextFromProduct(product),
    technical: technicalContextFromProduct(product),
  };
}

/**
 * Monta um rascunho por campo a partir do problema, da dor e da entrega
 * já descritos na iniciativa e no contexto do produto. Não inventa métrica
 * nem evidência: o que não foi informado vira um gancho de validação.
 */
export function draftDiscoveryFields(frameworkId, context = {}) {
  const framework = getFramework(frameworkId);
  if (!framework) return {};

  const source = discoverySource(context);
  const problem = source.problem || PENDING;
  const delivery = source.delivery || PENDING;
  const outcome = source.outcome || PENDING;
  const audience = source.audience || PENDING;

  const drafts = {
    'opportunity-tree': {
      outcome: knownOrPending(source.outcome, 'qual número de negócio esta iniciativa precisa mover?'),
      opportunities: joinBlocks(
        source.problem && `Dor: ${source.problem}`,
        source.audience && `Quem sente: ${source.audience}`,
        source.business && `Contexto observado:\n${source.business}`,
        gapLine('qual evidência (dado, pesquisa ou observação) confirma essa dor?'),
      ),
      solutions: joinBlocks(
        source.delivery && `Entrega proposta: ${source.delivery}`,
        source.name && `Iniciativa: ${source.name}`,
        gapLine('quais recortes ou alternativas de solução ficam de fora desta entrega?'),
      ),
      experiments: joinBlocks(
        source.delivery &&
          source.problem &&
          `Hipótese de teste: se entregarmos "${source.delivery}", a dor "${source.problem}" reduz.`,
        source.outcome && `Sinal de sucesso declarado: ${source.outcome}.`,
        gapLine('qual experimento mínimo valida isso antes da construção completa?'),
      ),
    },
    csd: {
      certainties: joinBlocks(
        source.business && `Contexto conhecido do produto:\n${source.business}`,
        source.audience && `Público já identificado: ${source.audience}.`,
        source.technical && `Escopo técnico informado:\n${source.technical}`,
        !source.business && !source.audience && !source.technical
          ? knownOrPending('', 'o que já está comprovado por dado ou operação atual?')
          : gapLine('separar o que é fato observado do que ainda é interpretação.'),
      ),
      assumptions: joinBlocks(
        source.problem && `Acreditamos que a dor principal é: ${source.problem}`,
        source.delivery && `Acreditamos que a entrega "${source.delivery}" ataca essa dor.`,
        source.outcome && `Acreditamos que o resultado "${source.outcome}" é o melhor comprovante.`,
        gapLine('o que precisa ser verdade para essa aposta valer?'),
      ),
      doubts: joinBlocks(
        source.outcome && `Qual evidência sustenta o resultado esperado "${source.outcome}"?`,
        source.problem && `Como essa dor aparece hoje, passo a passo, para ${audience}?`,
        gapLine('o que o time ainda não consegue responder com dado?'),
      ),
    },
    'double-diamond': {
      discover: joinBlocks(
        source.business && `O que já sabemos do contexto:\n${source.business}`,
        source.audience && `Com quem investigar: ${source.audience}.`,
        source.problem && `Sinal inicial da dor: ${source.problem}`,
        gapLine('listar pesquisas, entrevistas e dados já levantados, sem concluir a solução.'),
      ),
      define: joinBlocks(
        source.problem && `Problema escolhido neste momento: ${source.problem}`,
        source.audience && `Recorte de público: ${source.audience}.`,
        gapLine('confirmar se este é o problema certo antes de desenvolver solução.'),
      ),
      develop: joinBlocks(
        source.delivery && `Caminho já descrito: ${source.delivery}`,
        gapLine('quais alternativas de solução foram consideradas além desta entrega?'),
      ),
      deliver: joinBlocks(
        source.delivery && `Recorte de entrega: ${source.delivery}`,
        source.outcome && `Deve mover: ${source.outcome}.`,
        source.constraints && `Restrições: ${source.constraints}.`,
        gapLine('qual é o MVP desta entrega e o que fica para depois?'),
      ),
    },
    jtbd: {
      situation: joinBlocks(
        source.audience && `Público: ${source.audience}.`,
        source.business && `Contexto em que a necessidade aparece:\n${source.business}`,
        source.problem && `Gatilho observado: ${source.problem}`,
        gapLine('quando, onde e com qual pressão essa necessidade aparece?'),
      ),
      job: joinBlocks(
        `Quando ${source.audience || PENDING}, quero resolver "${problem}", para chegar a "${outcome}".`,
        gapLine('reescrever no formato: Quando [situação], quero [progresso], para [resultado].'),
      ),
      currentAlternatives: joinBlocks(
        source.business && `Como parece ser resolvido hoje:\n${source.business}`,
        gapLine('qual alternativa o público usa hoje (planilha, outro fluxo, contorno manual)?'),
      ),
      forces: joinBlocks(
        source.problem && `Pressão para mudar: ${source.problem}`,
        source.delivery && `Atração da proposta: ${source.delivery}`,
        gapLine('quais hábitos, ansiedades ou regras travam a mudança?'),
      ),
      desiredOutcomes: knownOrPending(source.outcome, 'qual progresso o usuário considera sucesso?'),
    },
    'assumption-mapping': {
      desirability: joinBlocks(
        source.problem && `Acreditamos que ${audience} precisa resolver: ${source.problem}`,
        source.delivery && `Acreditamos que "${source.delivery}" é desejável para esse público.`,
        gapLine('quem já demonstrou essa necessidade com evidência?'),
      ),
      viability: joinBlocks(
        source.outcome && `Aposta de negócio: ${source.outcome}.`,
        source.constraints && `Restrições informadas: ${source.constraints}.`,
        gapLine('custo, operação e incentivo realmente sustentam essa entrega?'),
      ),
      feasibility: joinBlocks(
        source.technical && `Viabilidade técnica a partir do escopo:\n${source.technical}`,
        source.constraints && `Restrições: ${source.constraints}.`,
        gapLine('tecnologia, dados, prazo e dependências permitem construir isso agora?'),
      ),
      riskiestAssumptions: joinBlocks(
        source.problem && `Suposição de dor: ${source.problem}`,
        source.delivery && `Suposição de solução: ${source.delivery} resolve essa dor.`,
        source.outcome && `Suposição de impacto: ${source.outcome}.`,
        gapLine('ordenar por importância e falta de evidência.'),
      ),
      validationPlan: joinBlocks(
        source.delivery &&
          source.problem &&
          `Testar se "${source.delivery}" reduz "${source.problem}" para ${audience}.`,
        source.outcome && `Critério declarado: ${source.outcome}.`,
        gapLine('experimento, evidência esperada e critério de parada.'),
      ),
    },
    'impact-mapping': {
      goal: joinBlocks(
        source.okrCode && `Iniciativa OKR: ${source.okrCode}.`,
        knownOrPending(source.outcome, 'qual meta de negócio esta entrega deve mover?'),
      ),
      actors: joinBlocks(
        source.audience && `Quem opera ou é impactado: ${source.audience}.`,
        source.stakeholders && `Outras pessoas envolvidas: ${source.stakeholders}.`,
        gapLine('quem mais precisa mudar comportamento para a meta acontecer?'),
      ),
      impacts: joinBlocks(
        source.problem && `Comportamento atual (dor): ${source.problem}`,
        source.outcome && `Comportamento desejado ligado à meta: ${source.outcome}.`,
        gapLine('o que cada ator precisa fazer de forma diferente?'),
      ),
      deliverables: joinBlocks(
        source.delivery && `Entrega: ${source.delivery}`,
        source.name && `Iniciativa: ${source.name}.`,
        gapLine('o que de fato será construído nesta fatia?'),
      ),
      measures: joinBlocks(
        source.outcome && `Medida declarada: ${source.outcome}.`,
        gapLine('baseline AS IS e meta TO BE por ator ou solução.'),
      ),
    },
    'user-story-mapping': {
      personas: joinBlocks(
        source.audience && `${source.audience} — objetivo: ${outcome}.`,
        source.problem && `Dor que essa persona enfrenta: ${source.problem}`,
        gapLine('há mais de um perfil com jornadas diferentes?'),
      ),
      backbone: joinBlocks(
        source.delivery && `Jornada alvo desta entrega: ${source.delivery}`,
        source.problem && `Ponto de dor no fluxo atual: ${source.problem}`,
        gapLine('listar as atividades principais em ordem, do início ao resultado.'),
      ),
      tasks: joinBlocks(
        source.problem && `Tarefas hoje, no fluxo com dor: ${source.problem}`,
        source.delivery && `Tarefas que a entrega deve cobrir: ${source.delivery}`,
        gapLine('passos concretos em cada atividade da jornada.'),
      ),
      releaseSlices: joinBlocks(
        source.delivery && `Fatia desta iniciativa: ${source.delivery}`,
        source.constraints && `Limites: ${source.constraints}.`,
        gapLine('o que entra no MVP versus releases seguintes?'),
      ),
      gaps: joinBlocks(
        source.constraints && `Restrições já visíveis: ${source.constraints}.`,
        gapLine('edge cases, dependências e comportamentos ausentes nesta fatia.'),
      ),
    },
    'service-blueprint': {
      journey: joinBlocks(
        source.delivery && `Fluxo que a entrega pretende cobrir: ${source.delivery}`,
        source.problem && `Onde o processo atual dói: ${source.problem}`,
        gapLine('etapas ponta a ponta, do gatilho ao encerramento.'),
      ),
      userActions: joinBlocks(
        source.audience && `${source.audience}:`,
        source.problem && `Ação atual / dor: ${source.problem}`,
        source.delivery && `Ação desejada com a entrega: ${source.delivery}`,
      ),
      frontstage: joinBlocks(
        source.delivery && `O que o usuário passa a ver ou operar: ${source.delivery}`,
        gapLine('telas, pessoas e respostas visíveis em cada etapa.'),
      ),
      backstage: joinBlocks(
        source.business && `Processo interno conhecido:\n${source.business}`,
        gapLine('regras, filas e trabalho humano que o usuário não vê.'),
      ),
      supportSystems: joinBlocks(
        source.technical && source.technical,
        source.constraints && `Dependências: ${source.constraints}.`,
        gapLine('sistemas, dados, integrações e times de suporte.'),
      ),
      failurePoints: joinBlocks(
        source.problem && `Falha / retrabalho atual: ${source.problem}`,
        gapLine('em qual etapa isso quebra e qual evidência comprova?'),
      ),
    },
    'value-proposition-canvas': {
      customerJobs: joinBlocks(
        source.problem && `Trabalho que o cliente tenta concluir: ${source.problem}`,
        source.audience && `Segmento: ${source.audience}.`,
      ),
      pains: joinBlocks(
        source.problem && `Dor: ${source.problem}`,
        source.business && `Como isso aparece no contexto atual:\n${source.business}`,
      ),
      gains: knownOrPending(source.outcome, 'o que o cliente ganha se a dor sumir?'),
      productsServices: joinBlocks(
        source.delivery && `Oferta desta iniciativa: ${source.delivery}`,
        source.name && `Nome: ${source.name}.`,
      ),
      painRelievers: joinBlocks(
        source.delivery &&
          source.problem &&
          `"${source.delivery}" pretende aliviar: ${source.problem}`,
        gapLine('como a proposta reduz cada dor prioritária, na prática?'),
      ),
      gainCreators: joinBlocks(
        source.outcome && `Ganho declarado: ${source.outcome}.`,
        source.delivery && `Mecanismo proposto: ${source.delivery}`,
        gapLine('como a proposta produz esses ganhos de forma observável?'),
      ),
      fitEvidence: joinBlocks(
        source.business && `Indício já registrado:\n${source.business}`,
        gapLine('evidências de encaixe e lacunas a validar.'),
      ),
    },
    'design-sprint': {
      challenge: joinBlocks(
        source.problem && `Desafio: ${source.problem}`,
        source.outcome && `Objetivo de longo prazo: ${source.outcome}.`,
        source.audience && `Para: ${source.audience}.`,
      ),
      sprintQuestions: joinBlocks(
        source.delivery && `A entrega "${source.delivery}" resolve a dor descrita?`,
        source.outcome && `Conseguimos observar "${source.outcome}" neste recorte?`,
        gapLine('o que precisa ser verdade para a solução funcionar?'),
      ),
      map: joinBlocks(
        source.audience && `Quem: ${source.audience}.`,
        source.problem && `Início (dor): ${source.problem}`,
        source.outcome && `Fim desejado: ${source.outcome}.`,
        gapLine('desenhar o mapa do fluxo atual até o resultado.'),
      ),
      solutionIdeas: joinBlocks(
        source.delivery && `Ideia já descrita: ${source.delivery}`,
        gapLine('quais outras ideias o time ainda deveria esboçar?'),
      ),
      prototype: joinBlocks(
        source.delivery && `Recorte sugerido para prototipar: ${source.delivery}`,
        gapLine('qual tarefa o participante executa no teste?'),
      ),
      testResults: joinBlocks(
        gapLine('padrões observados, critério de sucesso e decisão após o teste.'),
        source.outcome && `Comparar o resultado com: ${source.outcome}.`,
      ),
    },
    'lean-canvas': {
      problems: knownOrPending(source.problem, 'quais dores deste segmento são prioritárias?'),
      segments: knownOrPending(source.audience, 'quem é o early adopter?'),
      uniqueValueProposition: joinBlocks(
        source.outcome && `Promessa: ${source.outcome}`,
        source.delivery && `Como: ${source.delivery}`,
        gapLine('qual diferencial difícil de copiar?'),
      ),
      solution: knownOrPending(source.delivery, 'qual solução mínima ataca as dores principais?'),
      channels: joinBlocks(
        source.audience && `Público a alcançar: ${source.audience}.`,
        source.business && `Canal / processo atual:\n${source.business}`,
        gapLine('como alcançar e atender o segmento?'),
      ),
      metrics: knownOrPending(source.outcome, 'qual métrica indica que o canvas está funcionando?'),
      businessModel: joinBlocks(
        source.constraints && `Restrições de negócio: ${source.constraints}.`,
        gapLine('receita, custos e vantagem difícil de copiar.'),
      ),
    },
  };

  const draft = drafts[frameworkId] ?? {};
  const allowedKeys = framework.fields.map((field) => field.key);

  return Object.fromEntries(
    Object.entries(draft)
      .filter(([key]) => allowedKeys.includes(key))
      .map(([key, value]) => [key, textOf(value)])
      .filter(([, value]) => value.length > 0),
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
    questions.push('Qual comportamento atual do usuário precisa mudar, e por que ele acontece hoje?');
  }
  if (isBlank(initiative.constraints)) {
    questions.push('Existe restrição de prazo, sistema legado ou dependência externa?');
  }

  questions.push('Qual evidência sustenta o problema descrito?');

  return questions;
}

/**
 * Sugere conteúdo para um único campo do discovery.
 */
export function suggestDiscoveryField({
  product = {},
  initiative = {},
  frameworkId,
  fieldKey,
  currentValue = '',
} = {}) {
  const drafts = draftDiscoveryFields(frameworkId, { product, initiative });
  const suggestion =
    drafts[fieldKey] ??
    gapLine('este campo ainda não tem base no problema, na dor ou na entrega descritos.');

  return {
    fieldKey,
    suggestion,
    rationale:
      'Rascunho montado a partir do problema, da dor e da entrega descritos na iniciativa. Revise antes de aceitar.',
    replacesContent: !isBlank(currentValue),
    basedOn: [
      'initiative.problem',
      'initiative.description',
      'initiative.expectedOutcome',
      'product.businessContextSources',
    ],
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
    questions.push('Nenhuma evidência citada no discovery. Qual dado sustenta o problema?');
  }
  if (frameworkId === 'csd' && countSignals(fields.certainties ?? '', UNCERTAINTY_SIGNALS) > 0) {
    contradictions.push(
      'O campo Certezas usa linguagem de hipótese ("acreditamos", "talvez"). Mova esse conteúdo para Suposições.',
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
