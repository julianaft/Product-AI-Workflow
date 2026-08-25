import {
  buildBusinessmapStory,
  parseBusinessmapBoardUrl,
  validateBusinessmapConfig,
} from '../shared/businessmap.js';

const REQUEST_TIMEOUT_MS = 10_000;
const CARDS_WORKFLOW_TYPE = 0;
const REQUESTED_SECTION = 2;
const STORY_TYPE_NAME = 'story';

function errorMessage(payload, fallback) {
  const message = payload?.error?.message ?? payload?.message ?? fallback;
  return String(message).slice(0, 500);
}

async function requestBusinessmap(url, apiKey, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      apikey: apiKey,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    signal: options.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Algumas falhas do serviço não retornam JSON.
  }

  if (!response.ok) {
    throw new Error(
      errorMessage(
        payload,
        `O Businessmap respondeu com o status ${response.status}.`,
      ),
    );
  }

  return payload;
}

function enabledCardsWorkflow(structure) {
  const entry = Object.entries(structure.workflows ?? {}).find(
    ([, workflow]) =>
      Number(workflow.type) === CARDS_WORKFLOW_TYPE &&
      Number(workflow.is_enabled ?? 1) === 1,
  );
  if (!entry) {
    throw new Error('O board não possui um workflow de cards ativo.');
  }
  return { id: Number(entry[0]), ...entry[1] };
}

function firstLeafColumn(columnIds, childColumns) {
  for (const columnId of columnIds) {
    const children = childColumns?.[columnId] ?? childColumns?.[String(columnId)];
    if (Array.isArray(children) && children.length > 0) {
      const leaf = firstLeafColumn(children, childColumns);
      if (leaf) return leaf;
    } else {
      return Number(columnId);
    }
  }
  return null;
}

export function resolveCardLocation(structure) {
  const workflow = enabledCardsWorkflow(structure);
  const laneId = (workflow.top_lanes ?? []).map(Number).find(
    (id) => Number(structure.lanes?.[id]?.workflow_id) === workflow.id,
  );
  if (!laneId) {
    throw new Error('Não foi possível localizar uma lane no workflow de cards.');
  }

  const requestedColumns =
    workflow.section_columns?.[REQUESTED_SECTION] ??
    workflow.section_columns?.[String(REQUESTED_SECTION)] ??
    [];
  const columnId = firstLeafColumn(requestedColumns, structure.child_columns);
  if (!columnId) {
    throw new Error('Não foi possível localizar uma coluna Requested no board.');
  }

  return { workflowId: workflow.id, laneId, columnId };
}

export function resolveStoryType(globalTypes, boardTypes) {
  const availableIds = new Set(
    (boardTypes ?? []).map((type) => Number(type.type_id)),
  );
  const story = (globalTypes ?? []).find(
    (type) =>
      String(type.name ?? '').trim().toLowerCase() === STORY_TYPE_NAME &&
      Number(type.is_enabled ?? 1) === 1 &&
      availableIds.has(Number(type.type_id)),
  );
  if (!story) {
    throw new Error('O tipo Story não está disponível neste board.');
  }
  return Number(story.type_id);
}

export async function createBusinessmapStory(
  { boardUrl, apiKey, prd, initiative },
  fetchImpl = fetch,
) {
  const errors = validateBusinessmapConfig({ boardUrl, apiKey });
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0]);
  }
  if (!prd || typeof prd !== 'object') {
    throw new Error('O PRD aprovado é obrigatório para criar a Story.');
  }

  const parsed = parseBusinessmapBoardUrl(boardUrl);
  const request = (path, options) =>
    requestBusinessmap(
      `${parsed.apiBaseUrl}${path}`,
      String(apiKey).trim(),
      options,
      fetchImpl,
    );

  const [structureResponse, boardTypesResponse, globalTypesResponse] =
    await Promise.all([
      request(`/boards/${parsed.boardId}/currentStructure`),
      request(`/boards/${parsed.boardId}/cardTypes`),
      request('/cardTypes?name=Story&fields=type_id,name,is_enabled'),
    ]);

  const location = resolveCardLocation(structureResponse?.data ?? {});
  const typeId = resolveStoryType(
    globalTypesResponse?.data,
    boardTypesResponse?.data,
  );
  const story = buildBusinessmapStory({ prd, initiative });

  const createdResponse = await request('/cards', {
    method: 'POST',
    body: JSON.stringify({
      title: story.title,
      description: story.description,
      lane_id: location.laneId,
      column_id: location.columnId,
      type_id: typeId,
    }),
  });
  const card = createdResponse?.data?.[0];
  if (!card?.card_id) {
    throw new Error('O Businessmap não retornou o ID da Story criada.');
  }

  return {
    cardId: Number(card.card_id),
    customId: card.custom_id ?? null,
    title: card.title ?? story.title,
    boardId: parsed.boardId,
    boardUrl: parsed.boardUrl,
    type: 'Story',
    workflowId: Number(card.workflow_id ?? location.workflowId),
    laneId: Number(card.lane_id ?? location.laneId),
    columnId: Number(card.column_id ?? location.columnId),
    createdAt: new Date().toISOString(),
  };
}
