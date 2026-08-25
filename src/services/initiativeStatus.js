function timestamp(value) {
  const time = Date.parse(value ?? '');
  return Number.isFinite(time) ? time : 0;
}

export function initiativeStatus(journey = {}) {
  // Gerar o PRD encerra o fluxo da iniciativa; a aprovação continua sendo uma
  // decisão editorial do documento, não uma condição para finalizar o trabalho.
  if (journey.prd?.document) {
    return {
      label: 'Finalizada',
      badgeClass: 'bg-green text-black',
    };
  }
  if (journey.discovery?.approved) {
    return {
      label: 'Em PRD',
      badgeClass: 'bg-blue text-white',
    };
  }
  if (journey.discovery?.review) {
    return {
      label: 'Em revisão',
      badgeClass: 'bg-orange text-black',
    };
  }
  if (journey.discovery?.framework) {
    return {
      label: 'Em discovery',
      badgeClass: 'bg-ember text-white',
    };
  }
  if (journey.classification?.confirmedAt) {
    return {
      label: 'Em andamento',
      badgeClass: 'bg-sky text-black',
    };
  }
  if (
    Object.values(journey.initiative ?? {}).some((value) =>
      String(value ?? '').trim(),
    )
  ) {
    return {
      label: 'Em andamento',
      badgeClass: 'bg-lime text-black',
    };
  }
  return {
    label: 'Rascunho',
    badgeClass: 'bg-line text-black',
  };
}

export function initiativeLastActivity(journey = {}) {
  return (
    journey.updatedAt ??
    journey.prd?.document?.generatedAt ??
    journey.prd?.approvedAt ??
    journey.discovery?.evidenceAppliedAt ??
    journey.classification?.confirmedAt ??
    journey.createdAt ??
    null
  );
}

export function newestFirst(initiatives = []) {
  return [...initiatives].sort(
    (left, right) =>
      timestamp(initiativeLastActivity(right)) -
        timestamp(initiativeLastActivity(left)) ||
      timestamp(right.createdAt) - timestamp(left.createdAt),
  );
}
