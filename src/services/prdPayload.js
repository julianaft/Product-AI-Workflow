import { discoveryFields } from '../state/journeyModel.js';

function ownersToList(value) {
  return String(value ?? '')
    .split(',')
    .map((owner) => owner.trim())
    .filter(Boolean);
}

/**
 * Monta o payload da skill de PRD.
 * Somente conteudo aprovado entra: se o discovery nao foi aprovado, a flag vai
 * como false e a skill trata o documento como rascunho sem respaldo.
 */
export function buildPrdPayload(journey) {
  return {
    productContext: {
      name: journey.product.name,
      tribe: journey.product.tribe,
      squad: journey.product.squad,
      owners: ownersToList(journey.product.owners),
      businessContext: journey.product.businessContext,
      technicalContext: journey.product.technicalContext,
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
    referenceLinks: journey.links.map((link) => ({
      type: link.type,
      title: link.title,
      url: link.url,
    })),
  };
}
