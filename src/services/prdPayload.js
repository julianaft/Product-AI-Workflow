import { discoveryFields } from '../state/journeyModel.js';

function ownersToList(value) {
  return String(value ?? '')
    .split(',')
    .map((owner) => owner.trim())
    .filter(Boolean);
}

function businessContextFromSources(product) {
  const sources = product.businessContextSources ?? [];
  const extracted = sources.map((source) => {
    if (source.type === 'file') {
      return `Fonte: ${source.title}\n${source.content}`;
    }
    return `Fonte externa: ${source.title} (${source.url}). Conteúdo não lido automaticamente.`;
  });

  if (product.businessContext?.trim()) {
    extracted.unshift(product.businessContext.trim());
  }

  return extracted.join('\n\n');
}

function technicalContextFromRepositories(product) {
  const repositories = (product.repositories ?? []).filter((repository) => repository.selected);
  if (!repositories.length) return '';

  return [
    'Repositórios do contexto técnico geral do projeto:',
    ...repositories.map(
      (repository) =>
        `- ${repository.fullName} (${repository.url}) — branch padrão: ${repository.defaultBranch}`,
    ),
  ].join('\n');
}

/**
 * Monta o payload da skill de PRD.
 * Somente conteúdo aprovado entra: se o discovery não foi aprovado, a flag vai
 * como false e a skill trata o documento como rascunho sem respaldo.
 */
export function buildPrdPayload(journey) {
  return {
    productContext: {
      name: journey.product.name,
      directorate: journey.product.directorate,
      tribe: journey.product.tribe,
      squad: journey.product.squad,
      owners: ownersToList(journey.product.owners),
      pm: journey.product.pm,
      pd: journey.product.pd,
      writers: journey.product.writers,
      tm: journey.product.tm,
      tl: journey.product.tl,
      businessContext: businessContextFromSources(journey.product),
      technicalContext: technicalContextFromRepositories(journey.product),
      repositories: (journey.product.repositories ?? []).filter(
        (repository) => repository.selected,
      ),
    },
    initiative: { ...journey.initiative },
    initiativeClassification: {
      type: journey.classification.type,
      confirmedAt: journey.classification.confirmedAt,
    },
    discovery: {
      framework: journey.discovery.framework,
      fields: discoveryFields(journey),
      approved: journey.discovery.approved,
    },
    referenceLinks: [
      ...journey.links.map((link) => ({
        type: link.type,
        title: link.title,
        url: link.url,
      })),
      ...(journey.product.businessContextSources ?? [])
        .filter((source) => source.url)
        .map((source) => ({
          type: source.type,
          title: source.title,
          url: source.url,
        })),
      ...(journey.product.repositories ?? [])
        .filter((repository) => repository.selected)
        .map((repository) => ({
          type: 'github',
          title: repository.fullName,
          url: repository.url,
        })),
    ],
    prdAnswers: journey.prd?.answers ?? [],
    currentPrd: journey.prd?.document,
  };
}
