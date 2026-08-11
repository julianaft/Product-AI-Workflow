import { useState } from 'react';
import { BUTTON, INPUT, classNames } from './ui.js';

/**
 * Ferramentas externas entram como referencia, nao como integracao.
 * Guardamos titulo, tipo e URL; nenhum conteudo e lido automaticamente.
 */
export const LINK_TYPES = [
  { value: 'miro', label: 'Miro' },
  { value: 'notebooklm', label: 'NotebookLM' },
  { value: 'docs', label: 'Google Docs' },
  { value: 'research', label: 'Pesquisa / entrevistas' },
  { value: 'other', label: 'Outro' },
];

function labelFor(type) {
  return LINK_TYPES.find((item) => item.value === type)?.label ?? 'Outro';
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function LinkAttachments({ links, onAdd, onRemove, scope }) {
  const [type, setType] = useState('miro');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const visible = links.filter((link) => link.scope === scope);

  function submit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError('Informe um titulo para o link.');
      return;
    }
    if (!isValidUrl(url)) {
      setError('Informe uma URL valida comecando com http ou https.');
      return;
    }

    onAdd({
      id: crypto.randomUUID(),
      scope,
      type,
      title: title.trim(),
      url: url.trim(),
    });

    setTitle('');
    setUrl('');
    setError('');
  }

  return (
    <div className="border border-line rounded-2xl p-5 mb-6">
      <h3 className="font-extrabold mb-1">Links de referencia</h3>
      <p className="text-sm mb-4">
        Miro, NotebookLM e Docs entram apenas como link. A skill recebe titulo e endereco, nunca o
        conteudo do quadro ou do documento.
      </p>

      {visible.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {visible.map((link) => (
            <li
              key={link.id}
              className="flex flex-wrap items-center gap-3 border border-line rounded-xl px-4 py-3"
            >
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue">
                {labelFor(link.type)}
              </span>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue underline break-all"
              >
                {link.title}
              </a>
              <button
                type="button"
                onClick={() => onRemove(link.id)}
                className="ml-auto text-sm font-bold text-ember no-print"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={submit} className="no-print grid gap-3 md:grid-cols-[10rem_1fr_1fr_auto]">
        <select
          aria-label="Tipo do link"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className={INPUT}
        >
          {LINK_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <input
          aria-label="Titulo do link"
          className={INPUT}
          placeholder="Titulo"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <input
          aria-label="URL do link"
          className={classNames(INPUT, 'break-all')}
          placeholder="https://"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />

        <button type="submit" className={BUTTON.quiet}>
          Adicionar
        </button>
      </form>

      {error ? (
        <p role="alert" className="text-sm font-semibold text-ember mt-2">
          {error}
        </p>
      ) : null}
    </div>
  );
}
