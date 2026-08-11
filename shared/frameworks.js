/**
 * Definicao dos frameworks de discovery.
 * Compartilhado entre a interface React e as skills do servidor para que
 * ambos concordem sobre quais campos existem e quais sao obrigatorios.
 */

export const FRAMEWORKS = {
  'opportunity-tree': {
    id: 'opportunity-tree',
    label: 'Arvore de Oportunidades',
    summary:
      'Liga o objetivo de negocio as dores, solucoes e experimentos. Boa para iniciativas incrementais.',
    fields: [
      {
        key: 'outcome',
        label: 'Objetivo de negocio (outcome)',
        hint: 'Resultado mensuravel que a iniciativa persegue.',
        required: true,
      },
      {
        key: 'opportunities',
        label: 'Oportunidades e dores',
        hint: 'Problemas reais observados, com a fonte da evidencia.',
        required: true,
      },
      {
        key: 'solutions',
        label: 'Solucoes propostas',
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
    summary:
      'Separa o que e fato, o que e hipotese e o que ainda precisa ser investigado. Boa quando ha muitas duvidas.',
    fields: [
      {
        key: 'certainties',
        label: 'Certezas',
        hint: 'Somente o que esta comprovado por dado ou pesquisa.',
        required: true,
      },
      {
        key: 'assumptions',
        label: 'Suposicoes',
        hint: 'Hipoteses que precisam de validacao.',
        required: true,
      },
      {
        key: 'doubts',
        label: 'Duvidas',
        hint: 'Perguntas em aberto que bloqueiam decisoes.',
        required: true,
      },
    ],
  },

  'double-diamond': {
    id: 'double-diamond',
    label: 'Double Diamond',
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
        hint: 'Alternativas de solucao consideradas.',
        required: true,
      },
      {
        key: 'deliver',
        label: '4. Entregar (convergir)',
        hint: 'A solucao escolhida para o MVP.',
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
