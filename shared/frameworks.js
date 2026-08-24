/**
 * Definicao dos frameworks de discovery.
 * Compartilhado entre a interface React e as skills do servidor para que
 * ambos concordem sobre quais campos existem e quais sao obrigatorios.
 */

export const FRAMEWORKS = {
  'opportunity-tree': {
    id: 'opportunity-tree',
    label: 'Arvore de Oportunidades',
    need: 'Conectar um outcome claro a problemas, soluções e experimentos.',
    summary:
      'Liga o objetivo de negócio às dores, soluções e experimentos. Boa para iniciativas incrementais.',
    fields: [
      {
        key: 'outcome',
        label: 'Objetivo de negócio (outcome)',
        hint: 'Resultado mensuravel que a iniciativa persegue.',
        required: true,
      },
      {
        key: 'opportunities',
        label: 'Oportunidades e dores',
        hint: 'Problemas reais observados, com a fonte da evidência.',
        required: true,
      },
      {
        key: 'solutions',
        label: 'Soluções propostas',
        hint: 'Caminhos possiveis para atacar as oportunidades.',
        required: true,
      },
      {
        key: 'experiments',
        label: 'Experimentos e testes',
        hint: 'Como validar antes de construir tudo.',
        required: false,
      },
    ],
  },

  csd: {
    id: 'csd',
    label: 'Matriz CSD',
    need: 'Separar fatos, hipóteses e perguntas antes de tomar decisões.',
    summary:
      'Separa o que é fato, o que é hipótese e o que ainda precisa ser investigado. Boa quando há muitas dúvidas.',
    fields: [
      {
        key: 'certainties',
        label: 'Certezas',
        hint: 'Somente o que esta comprovado por dado ou pesquisa.',
        required: true,
      },
      {
        key: 'assumptions',
        label: 'Suposições',
        hint: 'Hipóteses que precisam de validação.',
        required: true,
      },
      {
        key: 'doubts',
        label: 'Dúvidas',
        hint: 'Perguntas em aberto que bloqueiam decisões.',
        required: true,
      },
    ],
  },

  'double-diamond': {
    id: 'double-diamond',
    label: 'Double Diamond',
    need: 'Explorar um problema amplo e convergir para um recorte de solução.',
    summary:
      'Divergir e convergir duas vezes. Boa quando o escopo ainda esta amplo ou indefinido.',
    fields: [
      {
        key: 'discover',
        label: '1. Descobrir (divergir)',
        hint: 'Pesquisa, entrevistas e dados levantados.',
        required: true,
      },
      {
        key: 'define',
        label: '2. Definir (convergir)',
        hint: 'O problema escolhido para resolver.',
        required: true,
      },
      {
        key: 'develop',
        label: '3. Desenvolver (divergir)',
        hint: 'Alternativas de solução consideradas.',
        required: true,
      },
      {
        key: 'deliver',
        label: '4. Entregar (convergir)',
        hint: 'A solução escolhida para o MVP.',
        required: true,
      },
    ],
  },

  jtbd: {
    id: 'jtbd',
    label: 'Jobs To Be Done',
    need: 'Entender por que uma pessoa contrata uma solução e qual progresso busca.',
    summary:
      'Investiga contexto, motivação, barreiras e resultado desejado. Boa quando o comportamento e a necessidade do usuário ainda não estão claros.',
    fields: [
      {
        key: 'situation',
        label: 'Situacao e contexto',
        hint: 'Quando e em qual contexto a necessidade aparece.',
        required: true,
      },
      {
        key: 'job',
        label: 'Job principal',
        hint: 'Quando [situacao], quero [motivacao], para [resultado].',
        required: true,
      },
      {
        key: 'currentAlternatives',
        label: 'Alternativas atuais',
        hint: 'Como a pessoa resolve hoje, inclusive planilhas e contornos.',
        required: true,
      },
      {
        key: 'forces',
        label: 'Forcas de progresso e resistencia',
        hint: 'Pressao, atracao, ansiedade e habitos que influenciam a mudanca.',
        required: true,
      },
      {
        key: 'desiredOutcomes',
        label: 'Resultados desejados',
        hint: 'O que precisa melhorar e como a pessoa reconhece sucesso.',
        required: true,
      },
    ],
  },

  'assumption-mapping': {
    id: 'assumption-mapping',
    label: 'Mapa de Suposições',
    need: 'Priorizar as hipóteses mais arriscadas antes de investir na solução.',
    summary:
      'Organiza suposições por importância e nível de evidência. Boa quando o time já tem uma solução, mas não sabe o que pode invalidá-la.',
    fields: [
      {
        key: 'desirability',
        label: 'Suposições de desejabilidade',
        hint: 'O usuário quer ou precisa disso?',
        required: true,
      },
      {
        key: 'viability',
        label: 'Suposições de viabilidade',
        hint: 'O modelo de negócio e as restrições permitem sustentar a solução?',
        required: true,
      },
      {
        key: 'feasibility',
        label: 'Suposições de factibilidade',
        hint: 'É possível entregar com tecnologia, dados, prazo e operação disponíveis?',
        required: true,
      },
      {
        key: 'riskiestAssumptions',
        label: 'Suposições mais arriscadas',
        hint: 'Importantes para o sucesso e ainda sem evidência.',
        required: true,
      },
      {
        key: 'validationPlan',
        label: 'Plano de validação',
        hint: 'Teste, evidência esperada, critério de sucesso e ordem.',
        required: true,
      },
    ],
  },

  'impact-mapping': {
    id: 'impact-mapping',
    label: 'Impact Mapping',
    need: 'Conectar uma meta de negócio a atores, mudanças de comportamento e entregas.',
    summary:
      'Parte da meta e evita backlog de funcionalidades sem impacto. Boa quando há muitos stakeholders ou soluções concorrentes.',
    fields: [
      {
        key: 'goal',
        label: 'Meta',
        hint: 'Objetivo mensurável de negócio.',
        required: true,
      },
      {
        key: 'actors',
        label: 'Atores',
        hint: 'Quem pode ajudar ou impedir a meta.',
        required: true,
      },
      {
        key: 'impacts',
        label: 'Impactos de comportamento',
        hint: 'O que cada ator precisa fazer de forma diferente.',
        required: true,
      },
      {
        key: 'deliverables',
        label: 'Entregas candidatas',
        hint: 'Funcionalidades, experimentos ou mudancas que geram os impactos.',
        required: true,
      },
      {
        key: 'measures',
        label: 'Medidas de impacto',
        hint: 'Como medir a mudanca de comportamento e a meta.',
        required: true,
      },
    ],
  },

  'user-story-mapping': {
    id: 'user-story-mapping',
    label: 'User Story Mapping',
    need: 'Visualizar uma jornada ponta a ponta e definir cortes de MVP.',
    summary:
      'Organiza atividades, passos e historias na ordem da experiencia. Boa quando o fluxo e conhecido, mas o escopo de cada entrega precisa ser fatiado.',
    fields: [
      {
        key: 'personas',
        label: 'Personas e objetivo da jornada',
        hint: 'Quem percorre o fluxo e o que tenta concluir.',
        required: true,
      },
      {
        key: 'backbone',
        label: 'Atividades principais (backbone)',
        hint: 'Grandes etapas da jornada, em ordem.',
        required: true,
      },
      {
        key: 'tasks',
        label: 'Passos e tarefas',
        hint: 'O que a pessoa faz dentro de cada atividade.',
        required: true,
      },
      {
        key: 'releaseSlices',
        label: 'Cortes de entrega',
        hint: 'MVP e releases seguintes, com criterio para cada corte.',
        required: true,
      },
      {
        key: 'gaps',
        label: 'Lacunas e edge cases',
        hint: 'Excecoes, dependencias e pontos sem comportamento definido.',
        required: false,
      },
    ],
  },

  'service-blueprint': {
    id: 'service-blueprint',
    label: 'Service Blueprint',
    need: 'Mapear uma experiência que atravessa canais, operação e vários sistemas.',
    summary:
      'Relaciona ações do usuário, frontstage, backstage e suporte. Boa para processos operacionais complexos e integrações.',
    fields: [
      {
        key: 'journey',
        label: 'Etapas da jornada',
        hint: 'Sequência ponta a ponta observada pelo usuário.',
        required: true,
      },
      {
        key: 'userActions',
        label: 'Ações do usuário',
        hint: 'O que a pessoa faz em cada etapa.',
        required: true,
      },
      {
        key: 'frontstage',
        label: 'Frontstage',
        hint: 'Telas, pessoas e respostas visíveis ao usuário.',
        required: true,
      },
      {
        key: 'backstage',
        label: 'Backstage',
        hint: 'Processos, regras e atividades internas invisiveis.',
        required: true,
      },
      {
        key: 'supportSystems',
        label: 'Sistemas e processos de suporte',
        hint: 'Serviços, dados, integrações e times que sustentam o fluxo.',
        required: true,
      },
      {
        key: 'failurePoints',
        label: 'Pontos de falha e oportunidades',
        hint: 'Handoffs, esperas, retrabalho e riscos.',
        required: true,
      },
    ],
  },

  'value-proposition-canvas': {
    id: 'value-proposition-canvas',
    label: 'Value Proposition Canvas',
    need: 'Avaliar o encaixe entre dores do segmento e a proposta de valor.',
    summary:
      'Cruza jobs, dores e ganhos com aliviadores e criadores de ganho. Boa antes de comprometer uma proposta de produto.',
    fields: [
      {
        key: 'customerJobs',
        label: 'Jobs do cliente',
        hint: 'O que o segmento tenta realizar no contexto.',
        required: true,
      },
      {
        key: 'pains',
        label: 'Dores',
        hint: 'Obstaculos, riscos e resultados indesejados.',
        required: true,
      },
      {
        key: 'gains',
        label: 'Ganhos esperados',
        hint: 'Beneficios e resultados desejados.',
        required: true,
      },
      {
        key: 'productsServices',
        label: 'Produtos e servicos',
        hint: 'Elementos da proposta oferecida.',
        required: true,
      },
      {
        key: 'painRelievers',
        label: 'Aliviadores de dor',
        hint: 'Como a proposta reduz cada dor prioritaria.',
        required: true,
      },
      {
        key: 'gainCreators',
        label: 'Criadores de ganho',
        hint: 'Como a proposta produz os ganhos priorizados.',
        required: true,
      },
      {
        key: 'fitEvidence',
        label: 'Evidências de fit',
        hint: 'Dados que sustentam o encaixe e lacunas a validar.',
        required: true,
      },
    ],
  },

  'design-sprint': {
    id: 'design-sprint',
    label: 'Design Sprint',
    need: 'Responder rapidamente uma pergunta critica com prototipo e teste.',
    summary:
      'Estrutura desafio, ideias, decisão, protótipo e teste. Boa quando há pouco tempo e uma decisão de alto risco precisa de evidência.',
    fields: [
      {
        key: 'challenge',
        label: 'Desafio e objetivo de longo prazo',
        hint: 'Problema focal e resultado desejado.',
        required: true,
      },
      {
        key: 'sprintQuestions',
        label: 'Perguntas do sprint',
        hint: 'O que precisa ser verdade para a solução funcionar.',
        required: true,
      },
      {
        key: 'map',
        label: 'Mapa da jornada e alvo',
        hint: 'Atores, inicio, fim e ponto focal do sprint.',
        required: true,
      },
      {
        key: 'solutionIdeas',
        label: 'Ideias de solução',
        hint: 'Alternativas consideradas antes da decisão.',
        required: true,
      },
      {
        key: 'prototype',
        label: 'Prototipo e cenario de teste',
        hint: 'O que sera simulado e qual tarefa o participante executa.',
        required: true,
      },
      {
        key: 'testResults',
        label: 'Resultados e decisão',
        hint: 'Padrões observados, critério e próximo passo.',
        required: false,
      },
    ],
  },

  'lean-canvas': {
    id: 'lean-canvas',
    label: 'Lean Canvas',
    need: 'Estruturar uma nova proposta ou produto sob incerteza de negócio.',
    summary:
      'Sintetiza problema, segmentos, proposta, canais, custos e métricas. Boa para novos produtos ou modelos ainda não validados.',
    fields: [
      {
        key: 'problems',
        label: 'Problemas prioritarios',
        hint: 'Top problemas e alternativas existentes.',
        required: true,
      },
      {
        key: 'segments',
        label: 'Segmentos e early adopters',
        hint: 'Para quem e quem sente a dor primeiro.',
        required: true,
      },
      {
        key: 'uniqueValueProposition',
        label: 'Proposta unica de valor',
        hint: 'Beneficio central e por que e diferente.',
        required: true,
      },
      {
        key: 'solution',
        label: 'Solução de alto nível',
        hint: 'Hipóteses de solução para cada problema.',
        required: true,
      },
      {
        key: 'channels',
        label: 'Canais',
        hint: 'Como alcancar e atender os segmentos.',
        required: true,
      },
      {
        key: 'metrics',
        label: 'Métricas-chave',
        hint: 'Sinais de aquisicao, uso, retencao ou valor.',
        required: true,
      },
      {
        key: 'businessModel',
        label: 'Receita, custos e vantagem',
        hint: 'Como se sustenta e o que e dificil de copiar.',
        required: true,
      },
    ],
  },
};

export const FRAMEWORK_IDS = Object.keys(FRAMEWORKS);

export function getFramework(id) {
  return FRAMEWORKS[id] ?? null;
}

export function getRequiredFieldKeys(frameworkId) {
  const framework = getFramework(frameworkId);
  if (!framework) return [];
  return framework.fields.filter((field) => field.required).map((field) => field.key);
}
