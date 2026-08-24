import { useRef, useState } from 'react';
import { BUTTON, INPUT } from './ui.js';

const MAX_FILE_SIZE = 256 * 1024;
const MAX_EXTRACTED_CONTEXT = 500 * 1024;

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function htmlToText(value) {
  if (!/<[a-z][\s\S]*>/i.test(value)) return value.trim();
  const document = new DOMParser().parseFromString(value, 'text/html');
  return document.body.textContent?.trim() ?? '';
}

export function BusinessContextSources({ sources, onChange, error }) {
  const inputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [localError, setLocalError] = useState('');

  function addNotebook(event) {
    event.preventDefault();

    if (!title.trim()) {
      setLocalError('Informe um título para a fonte do NotebookLM.');
      return;
    }
    if (!isValidUrl(url)) {
      setLocalError('Informe uma URL válida do NotebookLM.');
      return;
    }

    onChange([
      ...sources,
      {
        id: crypto.randomUUID(),
        type: 'notebooklm',
        title: title.trim(),
        url: url.trim(),
      },
    ]);
    setTitle('');
    setUrl('');
    setLocalError('');
  }

  async function addFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setLocalError('O arquivo deve ter no máximo 256 KB para não exceder o contexto da IA.');
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['txt', 'md', 'doc', 'html'].includes(extension)) {
      setLocalError('Use TXT ou DOC baseado em texto. DOCX e DOC binário ainda não são suportados.');
      return;
    }

    const raw = await file.text();
    if (raw.includes('\u0000')) {
      setLocalError('Este DOC é binário. Salve-o como TXT ou como DOC baseado em HTML e envie novamente.');
      return;
    }

    const content = htmlToText(raw);
    if (!content) {
      setLocalError('O arquivo não contém texto legível.');
      return;
    }
    const currentSize = sources.reduce(
      (total, source) => total + String(source.content ?? '').length,
      0,
    );
    if (currentSize + content.length > MAX_EXTRACTED_CONTEXT) {
      setLocalError('O conteúdo extraído deve ter no máximo 500 KB no total.');
      return;
    }

    onChange([
      ...sources,
      {
        id: crypto.randomUUID(),
        type: 'file',
        title: file.name,
        fileName: file.name,
        content,
      },
    ]);
    setLocalError('');
  }

  function remove(id) {
    onChange(sources.filter((source) => source.id !== id));
  }

  return (
    <section className="border border-line rounded-2xl p-5 mb-6">
      <h3 className="font-extrabold mb-1">Contexto de negócio</h3>
      <p className="text-sm mb-4">
        Adicione uma fonte do NotebookLM por link ou carregue um TXT/DOC com texto. O link
        identifica a fonte, mas o conteúdo do NotebookLM não é lido automaticamente.
      </p>

      {sources.length > 0 ? (
        <ul className="space-y-2 mb-5">
          {sources.map((source) => (
            <li
              key={source.id}
              className="flex flex-wrap items-center gap-3 border border-line rounded-xl px-4 py-3"
            >
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue">
                {source.type === 'notebooklm' ? 'NotebookLM' : 'Arquivo'}
              </span>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-blue underline break-all"
                >
                  {source.title}
                </a>
              ) : (
                <span className="font-semibold">{source.title}</span>
              )}
              {source.content ? (
                <span className="text-sm">{source.content.length.toLocaleString('pt-BR')} caracteres</span>
              ) : null}
              <button
                type="button"
                onClick={() => remove(source.id)}
                className="ml-auto text-sm font-bold text-ember"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={addNotebook} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] mb-3">
        <input
          aria-label="Título da fonte do NotebookLM"
          className={INPUT}
          placeholder="Título da fonte"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <input
          aria-label="URL do NotebookLM"
          className={INPUT}
          placeholder="https://notebooklm.google.com/..."
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <button type="submit" className={BUTTON.quiet}>
          Adicionar link
        </button>
      </form>

      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.doc,.html,text/plain,text/html,application/msword"
        onChange={addFile}
        className="hidden"
      />
      <button type="button" className={BUTTON.secondary} onClick={() => inputRef.current?.click()}>
        Carregar TXT ou DOC
      </button>

      {localError || error ? (
        <p role="alert" className="text-sm font-semibold text-ember mt-3">
          {localError || error}
        </p>
      ) : null}
    </section>
  );
}

