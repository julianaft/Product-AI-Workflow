/**
 * Ponto unico de contato com o provedor de IA.
 *
 * A troca do provedor acontece so aqui: o restante do sistema conhece apenas
 * runPrompt({ system, payload }) devolvendo JSON ja parseado.
 *
 * Variaveis de ambiente esperadas quando houver provedor:
 *   AI_API_URL   endpoint de chat completions
 *   AI_API_KEY   credencial
 *   AI_MODEL     identificador do modelo
 */

const API_URL = process.env.AI_API_URL ?? '';
const API_KEY = process.env.AI_API_KEY ?? '';
const MODEL = process.env.AI_MODEL ?? '';
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 30000);

export function isProviderConfigured() {
  return Boolean(API_URL && API_KEY && MODEL);
}

/**
 * Modelos as vezes devolvem o JSON dentro de um bloco de codigo.
 * Extrair antes do parse evita derrubar a chamada por causa de formatacao.
 */
function extractJson(content) {
  const trimmed = String(content ?? '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;

  return JSON.parse(candidate);
}

export async function runPrompt({ system, payload }) {
  if (!isProviderConfigured()) {
    throw new Error('Provedor de IA nao configurado.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify(payload) },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Provedor respondeu ${response.status}.`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    return extractJson(content);
  } finally {
    clearTimeout(timer);
  }
}
