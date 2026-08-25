import { useRef, useState } from 'react';
import { BUTTON } from './ui.js';

const MAX_FILE_SIZE = 256 * 1024;
const MAX_TOTAL_CONTENT = 400 * 1024;

function htmlToText(value) {
  if (!/<[a-z][\s\S]*>/i.test(value)) return value.trim();
  const document = new DOMParser().parseFromString(value, 'text/html');
  return document.body.textContent?.trim() ?? '';
}

async function extractText(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'docx') {
    const { default: mammoth } = await import('mammoth');
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    return result.value.trim();
  }

  const raw = await file.text();
  if (raw.includes('\u0000')) {
    throw new Error(
      'Este DOC é binário. Envie DOCX ou salve o conteúdo como TXT.',
    );
  }
  return htmlToText(raw);
}

export function DiscoveryEvidenceSources({ sources = [], onChange }) {
  const documentInputRef = useRef(null);
  const transcriptInputRef = useRef(null);
  const [error, setError] = useState('');

  async function addFiles(event, type) {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    if (!files.length) return;

    const additions = [];
    let total = sources.reduce(
      (sum, source) => sum + String(source.content ?? '').length,
      0,
    );

    try {
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `"${file.name}" excede 256 KB. Divida o conteúdo antes de enviar.`,
          );
        }
        const content = await extractText(file);
        if (!content) {
          throw new Error(`"${file.name}" não contém texto legível.`);
        }
        total += content.length;
        if (total > MAX_TOTAL_CONTENT) {
          throw new Error(
            'Documentos e transcrições podem ter no máximo 400 KB de texto no total.',
          );
        }
        additions.push({
          id: crypto.randomUUID(),
          type,
          title: file.name,
          fileName: file.name,
          content,
          addedAt: new Date().toISOString(),
        });
      }

      onChange([...sources, ...additions]);
      setError('');
    } catch (caught) {
      setError(caught.message ?? 'Não foi possível ler o arquivo.');
    }
  }

  function remove(id) {
    onChange(sources.filter((source) => source.id !== id));
  }

  return (
    <section className="border border-line rounded-2xl p-5 mb-6">
      <p className="text-xs font-extrabold uppercase tracking-widest text-blue mb-1">
        Evidências da iniciativa
      </p>
      <h3 className="text-xl font-extrabold mb-2">
        Documentos e transcrições de reuniões
      </h3>
      <p className="text-sm mb-4">
        Esses arquivos pertencem somente a esta iniciativa. Depois de
        adicioná-los, use o botão de atualização para incorporar os registros ao
        framework sem apagar o texto escrito pelo PM.
      </p>

      {sources.length ? (
        <ul className="space-y-2 mb-5">
          {sources.map((source) => (
            <li
              key={source.id}
              className="flex flex-wrap items-center gap-3 border border-line rounded-xl px-4 py-3"
            >
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue">
                {source.type === 'transcript' ? 'Transcrição' : 'Documento'}
              </span>
              <span className="font-semibold">{source.title}</span>
              <span className="text-sm">
                {source.content.length.toLocaleString('pt-BR')} caracteres
              </span>
              <button
                type="button"
                className="ml-auto text-sm font-bold text-ember"
                onClick={() => remove(source.id)}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        ref={documentInputRef}
        type="file"
        multiple
        accept=".txt,.md,.doc,.docx,.html,text/plain,text/html,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => addFiles(event, 'document')}
      />
      <input
        ref={transcriptInputRef}
        type="file"
        multiple
        accept=".txt,.md,.srt,.vtt,text/plain,text/vtt"
        className="hidden"
        onChange={(event) => addFiles(event, 'transcript')}
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={BUTTON.secondary}
          onClick={() => documentInputRef.current?.click()}
        >
          Adicionar documentos
        </button>
        <button
          type="button"
          className={BUTTON.secondary}
          onClick={() => transcriptInputRef.current?.click()}
        >
          Adicionar transcrições
        </button>
      </div>

      <p className="text-xs text-blue mt-3">
        Formatos: TXT, MD, DOC, DOCX e HTML; transcrições TXT, SRT e VTT.
      </p>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-ember mt-3">
          {error}
        </p>
      ) : null}
    </section>
  );
}
