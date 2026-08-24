/**
 * Modelo de PRD usado pela skill, pela interface e pelo prompt.
 *
 * A estrutura veio de PRDs reais de produto (iniciativa OKR, hipoteses com
 * decisao, metricas AS IS/TO BE por solucao, jornada, CAs agrupados,
 * permissionamento, defaults, erros, epicos e revisores). Os rotulos e o
 * guia de qualidade sao agnosticos: nenhum produto especifico entra aqui.
 */

export const PRD_SECTIONS = [
  {
    key: 'okrInitiative',
    label: 'Iniciativa OKR',
    quality:
      'Codigo da iniciativa + titulo. Sem codigo, registrar como pendente.',
  },
  {
    key: 'stakeholders',
    label: 'Principais pessoas envolvidas',
    quality:
      'Agrupar por area (squad, parceiros, areas consumidoras), nao uma lista solta.',
  },
  {
    key: 'context',
    label: 'Contextualizacao',
    quality:
      'Volume atual, processo AS IS, evidencia numerica e o que muda agora. Fato, nao slogan.',
  },
  {
    key: 'problem',
    label: 'Necessidade',
    quality:
      'Uma frase com a dor, o numero que a sustenta e o prazo que a torna urgente.',
  },
  {
    key: 'audience',
    label: 'Publico afetado',
    quality: 'Quem opera, quem decide e quem e impactado na ponta.',
  },
  {
    key: 'hypotheses',
    label: 'Hipoteses',
    quality:
      'Cada hipotese no formato Hn: Dor + Hipotese (Se... entao...) + Decisao. Nao misturar solucao pronta com hipotese.',
  },
  {
    key: 'impactMetrics',
    label: 'Metricas de impacto',
    quality:
      'Por solucao: cobertura, volume, AS IS, TO BE e reducao. Numero sem baseline vira pergunta em aberto.',
  },
  {
    key: 'solutions',
    label: 'Detalhamento das solucoes',
    quality:
      'Por solucao: aplicavel a, jornada AS IS, jornada TO BE, descricao, mudancas, Figma/links. Uma solucao por bloco.',
  },
  {
    key: 'permissions',
    label: 'Permissionamento',
    quality:
      'Permissao nova ou existente, quem ve, quem e bloqueado. Se nao houver mudanca de acesso, dizer isso.',
  },
  {
    key: 'fieldRules',
    label: 'Regras de campos, defaults e validacoes',
    quality:
      'Obrigatorios, defaults quando vazios, formatos, agrupadores e regras de negocio que a interface ja aplica.',
  },
  {
    key: 'errorHandling',
    label: 'Tratamento de erros',
    quality:
      'O que o usuario ve, o que pode exportar, sucesso parcial vs. falha total, persistencia de estado.',
  },
  {
    key: 'acceptanceCriteria',
    label: 'Criterios de aceite',
    quality:
      'CAs numerados por solucao, verificaveis sem interpretacao. Um CA = um comportamento observavel.',
  },
  {
    key: 'outOfScope',
    label: 'Fora do escopo',
    quality:
      'Lista explicita do que esta entrega nao faz, com motivo. Vazio e um risco.',
  },
  {
    key: 'dependencies',
    label: 'Principais dependencias',
    quality: 'Planilha, sistema, area, documento ou permissao sem os quais a entrega nao fecha.',
  },
  {
    key: 'epics',
    label: 'Epicos',
    quality: 'Um epico por solucao ou entrega rastreavel no backlog.',
  },
  {
    key: 'risks',
    label: 'Riscos',
    quality: 'Risco + condicao que o torna real. Sem chute de probabilidade.',
  },
  {
    key: 'assumptions',
    label: 'Premissas',
    quality: 'Fatos assumidos. Se uma premissa cair, o PRD precisa ser revisto.',
  },
  {
    key: 'experiments',
    label: 'Experimentos',
    quality: 'Como validar antes da construcao completa. Se nao houver, marcar pendente.',
  },
];

export const PRD_SECTION_KEYS = PRD_SECTIONS.map((section) => section.key);

export const HYPOTHESIS_TEMPLATE = `H1: [titulo curto]
Dor: [o que dói hoje, com evidencia se houver]
Hipotese: Se [acao], entao [resultado mensuravel]
Decisao: [o que o time ja decidiu a partir desta hipotese]`;

export const METRIC_TEMPLATE = `Solucao 1: [nome]
- Cobertura: [o que entra nesta entrega]
- Volume: [quantidade afetada]
- AS IS: [tempo ou esforco atual]
- TO BE: [tempo ou esforco esperado]
- Reducao / impacto: [delta]`;

export const SOLUTION_TEMPLATE = `Solucao 1: [nome]
Aplicavel a: [recorte]
Jornada AS IS:
- [passo atual]
Jornada TO BE:
- [passo futuro]
Descricao: [o que o sistema passa a fazer]
Mudancas necessarias:
- [mudanca de fluxo, tela ou regra]`;

export const ACCEPTANCE_TEMPLATE = `Solucao 1: [nome]
CA1: Dado [contexto], quando [acao], entao [resultado observavel]
CA2: ...`;
