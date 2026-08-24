/**
 * Modelo de PRD usado pela skill, pela interface e pelo prompt.
 *
 * A estrutura veio de PRDs reais de produto (iniciativa OKR, hipóteses com
 * decisão, métricas AS IS/TO BE por solução, jornada, CAs agrupados,
 * permissionamento, defaults, erros, épicos e revisores). Os rótulos e o
 * guia de qualidade são agnósticos: nenhum produto específico entra aqui.
 */

export const PRD_SECTIONS = [
  {
    key: 'okrInitiative',
    label: 'Iniciativa OKR',
    quality:
      'Código da iniciativa + título. Sem código, registrar como pendente.',
  },
  {
    key: 'stakeholders',
    label: 'Principais pessoas envolvidas',
    quality:
      'Agrupar por área (squad, parceiros, áreas consumidoras), não uma lista solta.',
  },
  {
    key: 'context',
    label: 'Contextualização',
    quality:
      'Só o recorte da iniciativa: processo AS IS, evidência e o que muda agora. Não colar o contexto de negócio inteiro.',
  },
  {
    key: 'problem',
    label: 'Necessidade',
    quality:
      'Uma frase com a dor, o número que a sustenta e o prazo que a torna urgente.',
  },
  {
    key: 'audience',
    label: 'Público afetado',
    quality: 'Quem opera, quem decide e quem é impactado na ponta.',
  },
  {
    key: 'hypotheses',
    label: 'Hipóteses',
    quality:
      'Cada hipótese no formato Hn: Dor + Hipótese (Se... então...) + Decisão. Não misturar solução pronta com hipótese.',
  },
  {
    key: 'impactMetrics',
    label: 'Métricas de impacto',
    quality:
      'Por solução: cobertura, volume, AS IS, TO BE e redução. Número sem baseline vira pergunta em aberto.',
  },
  {
    key: 'solutions',
    label: 'Detalhamento das soluções',
    quality:
      'Por solução: aplicável a, jornada AS IS, jornada TO BE, descrição, mudanças, Figma/links. Uma solução por bloco.',
  },
  {
    key: 'permissions',
    label: 'Permissionamento',
    quality:
      'Permissão nova ou existente, quem vê, quem é bloqueado. Se não houver mudança de acesso, dizer isso.',
  },
  {
    key: 'fieldRules',
    label: 'Regras de campos, defaults e validações',
    quality:
      'Obrigatórios, defaults quando vazios, formatos, agrupadores e regras de negócio que a interface já aplica.',
  },
  {
    key: 'errorHandling',
    label: 'Tratamento de erros',
    quality:
      'O que o usuário vê, o que pode exportar, sucesso parcial vs. falha total, persistência de estado.',
  },
  {
    key: 'acceptanceCriteria',
    label: 'Critérios de aceite',
    quality:
      'CAs numerados por solução, verificáveis sem interpretação. Um CA = um comportamento observável.',
  },
  {
    key: 'outOfScope',
    label: 'Fora do escopo',
    quality:
      'Lista explícita do que esta entrega não faz, com motivo. Vazio é um risco.',
  },
  {
    key: 'dependencies',
    label: 'Principais dependências',
    quality: 'Planilha, sistema, área, documento ou permissão sem os quais a entrega não fecha.',
  },
  {
    key: 'epics',
    label: 'Épicos',
    quality: 'Um épico por solução ou entrega rastreável no backlog.',
  },
  {
    key: 'risks',
    label: 'Riscos',
    quality: 'Risco + condição que o torna real. Sem chute de probabilidade.',
  },
  {
    key: 'assumptions',
    label: 'Premissas',
    quality: 'Fatos assumidos. Se uma premissa cair, o PRD precisa ser revisto.',
  },
  {
    key: 'experiments',
    label: 'Experimentos',
    quality: 'Como validar antes da construção completa. Se não houver, marcar pendente.',
  },
];

export const PRD_SECTION_KEYS = PRD_SECTIONS.map((section) => section.key);

export const HYPOTHESIS_TEMPLATE = `H1: [título curto]
Dor: [o que dói hoje, com evidência se houver]
Hipótese: Se [ação], então [resultado mensurável]
Decisão: [o que o time já decidiu a partir desta hipótese]`;

export const METRIC_TEMPLATE = `Solução 1: [nome]
- Cobertura: [o que entra nesta entrega]
- Volume: [quantidade afetada]
- AS IS: [tempo ou esforço atual]
- TO BE: [tempo ou esforço esperado]
- Redução / impacto: [delta]`;

export const SOLUTION_TEMPLATE = `Solução 1: [nome]
Aplicável a: [recorte]
Jornada AS IS:
- [passo atual]
Jornada TO BE:
- [passo futuro]
Descrição: [o que o sistema passa a fazer]
Mudanças necessárias:
- [mudança de fluxo, tela ou regra]`;

export const ACCEPTANCE_TEMPLATE = `Solução 1: [nome]
CA1: Dado [contexto], quando [ação], então [resultado observável]
CA2: ...`;
