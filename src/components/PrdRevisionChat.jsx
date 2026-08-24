import { useEffect, useRef, useState } from 'react';
import { BUTTON, INPUT, classNames } from './ui.js';

function createMessage(role, content, extra = {}) {
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${role}-${Date.now()}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

export function PrdRevisionChat({
  document,
  chat = [],
  openQuestions = [],
  disabled,
  loading,
  error,
  onSend,
}) {
  const [draft, setDraft] = useState('');
  const threadRef = useRef(null);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [chat, loading]);

  function quoteQuestion(question) {
    setDraft(`PERGUNTA: ${question}\nRESPOSTA: `);
  }

  async function submit(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || disabled || loading || !document) return;
    setDraft('');
    await onSend(content);
  }

  return (
    <section className="no-print border border-line rounded-2xl overflow-hidden mb-6">
      <div className="bg-sky px-5 py-4">
        <p className="text-xs font-extrabold uppercase tracking-widest">Chat de revisão</p>
        <h3 className="text-lg font-extrabold">Converse com o PRD</h3>
        <p className="text-sm mt-1">
          Responda uma pergunta em aberto ou descreva o que precisa mudar. Cada envio gera uma
          nova versão do documento acima, preservando o restante do conteúdo.
        </p>
      </div>

      {disabled ? (
        <p className="border-b border-line bg-white px-5 py-3 text-sm font-bold">
          O PRD está aprovado. Use &quot;Reabrir para edição&quot; para voltar a conversar.
        </p>
      ) : null}

      {openQuestions.length ? (
        <div className="px-5 py-4 border-b border-line bg-white">
          <p className="text-xs font-extrabold uppercase tracking-widest mb-2">
            Responder uma pergunta em aberto
          </p>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
            {openQuestions.map((question) => (
              <button
                key={question}
                type="button"
                className="text-left text-sm border border-line rounded-xl px-3 py-2 hover:border-blue disabled:text-line"
                disabled={disabled || loading}
                onClick={() => quoteQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div
        ref={threadRef}
        className="p-5 space-y-3 bg-canvas min-h-40 max-h-96 overflow-y-auto"
      >
        {chat.length === 0 ? (
          <p className="text-sm">
            Nenhuma mensagem ainda. Exemplos: “o código OKR é I-1042”, “adicione na seção Fora do
            escopo: esta entrega não inclui o app mobile” ou “reescreva a seção Riscos”.
          </p>
        ) : (
          chat.map((message) => (
            <article
              key={message.id}
              className={classNames(
                'rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap',
                message.role === 'user'
                  ? 'bg-blue text-white md:ml-24'
                  : 'bg-white border border-line md:mr-24',
              )}
            >
              <p className="text-xs font-extrabold uppercase tracking-widest mb-1">
                {message.role === 'user' ? 'Você' : 'Skill de PRD'}
                {message.revision ? ` · versão ${message.revision}` : ''}
              </p>
              {message.content}
            </article>
          ))
        )}
        {loading ? (
          <p className="text-sm font-semibold text-blue">Gerando nova versão...</p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm font-semibold text-ember px-5 py-3">
          {error}
        </p>
      ) : null}

      <form onSubmit={submit} className="border-t border-line p-5 bg-white">
        <label
          htmlFor="prd-chat-input"
          className="block text-xs font-extrabold uppercase tracking-widest mb-2"
        >
          Mensagem
        </label>
        <textarea
          id="prd-chat-input"
          className={classNames(INPUT, 'resize-y mb-3')}
          rows={3}
          disabled={disabled || loading}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Responda uma pergunta ou peça uma alteração no PRD"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              submit(event);
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className={BUTTON.primary}
            disabled={disabled || loading || !draft.trim()}
          >
            {loading ? 'Gerando...' : 'Enviar e gerar nova versão'}
          </button>
          <span className="text-sm">Ctrl + Enter envia.</span>
        </div>
      </form>
    </section>
  );
}

export { createMessage };
