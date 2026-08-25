export async function createBusinessmapStory({
  boardUrl,
  apiKey,
  prd,
  initiative,
}) {
  const response = await fetch('/api/businessmap/stories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boardUrl, apiKey, prd, initiative }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // A mensagem genérica abaixo cobre respostas sem JSON.
  }

  if (!response.ok) {
    throw new Error(
      payload?.error ?? 'Não foi possível criar a Story no Businessmap.',
    );
  }

  return payload;
}
