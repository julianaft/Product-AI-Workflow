export const STEPS = [
  {
    id: 1,
    key: 'product',
    phase: 'Setup',
    title: 'Contexto do produto',
    description:
      'Informações estáveis do produto, usadas como base para todas as iniciativas.',
    accent: 'lime',
  },
  {
    id: 2,
    key: 'initiative',
    phase: 'Upstream',
    title: 'Iniciativa',
    description: 'O que sera construido, para quem e qual resultado se espera.',
    accent: 'orange',
  },
  {
    id: 3,
    key: 'classification',
    phase: 'Upstream',
    title: 'Classificação da iniciativa',
    description: 'A skill sugere incremental ou novo fluxo. O PM confirma.',
    accent: 'orange',
  },
  {
    id: 4,
    key: 'discoverySelection',
    phase: 'Discovery',
    title: 'Ferramenta de discovery',
    description: 'A skill recomenda um framework e explica o motivo.',
    accent: 'ember',
  },
  {
    id: 5,
    key: 'discoveryForm',
    phase: 'Discovery',
    title: 'Preenchimento do discovery',
    description: 'Conteúdo sugerido pela skill e revisado pelo PM.',
    accent: 'ember',
  },
  {
    id: 6,
    key: 'prd',
    phase: 'Entrega',
    title: 'PRD',
    description: 'Documento gerado, revisado no chat e aprovado pelo PM.',
    accent: 'blue',
  },
  {
    id: 7,
    key: 'businessmap',
    phase: 'Entrega',
    title: 'Story no Businessmap (WIP)',
    description:
      'Etapa opcional para criar um card do tipo Story a partir do PRD aprovado.',
    accent: 'green',
  },
];

export const TOTAL_STEPS = STEPS.length;

export function getStep(id) {
  return STEPS.find((step) => step.id === id) ?? STEPS[0];
}
