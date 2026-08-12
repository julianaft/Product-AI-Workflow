import { useEffect, useRef } from 'react';
import { ACCENT_BG, BUTTON, CARD, classNames } from './ui.js';

function NodeIcon({ status, accent, index }) {
  const base =
    'absolute left-6 -translate-x-1/2 top-6 w-12 h-12 rounded-full flex items-center justify-center font-extrabold ring-4 ring-canvas z-10';

  if (status === 'completed') {
    return (
      <div className={classNames(base, 'bg-green text-black')} aria-hidden="true">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div
        className={classNames(base, 'bg-white border-2 border-line text-black')}
        aria-hidden="true"
      >
        {index}
      </div>
    );
  }

  return (
    <div className={classNames(base, ACCENT_BG[accent], 'text-black')} aria-hidden="true">
      {index}
    </div>
  );
}

export function StepCard({ step, status, summary, onEdit, children }) {
  const ref = useRef(null);

  // A etapa ativa se posiciona sozinha, como no protótipo original,
  // mas sem calcular deslocamento manualmente.
  useEffect(() => {
    if (status === 'active' && ref.current) {
      const id = setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [status]);

  return (
    <section
      ref={ref}
      id={`step-${step.id}`}
      className="relative scroll-mt-24 pb-8"
      aria-current={status === 'active' ? 'step' : undefined}
    >
      <NodeIcon status={status} accent={step.accent} index={step.id} />

      <div className="pl-16 md:pl-24">
        <div className={classNames(CARD, 'overflow-hidden')}>
          <div className={classNames('h-2', status === 'pending' ? 'bg-line' : ACCENT_BG[step.accent])} />

          <div className="p-5 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-blue">
                  {step.phase}
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold mt-1">{step.title}</h2>
                <p className="text-sm mt-2 max-w-3xl">{step.description}</p>
              </div>

              {status === 'completed' && onEdit ? (
                <button type="button" onClick={onEdit} className={`${BUTTON.quiet} no-print`}>
                  Editar
                </button>
              ) : null}
            </div>

            {status === 'active' ? children : null}

            {status === 'completed' && summary ? (
              <div className="border-t border-line pt-4 text-sm">{summary}</div>
            ) : null}

            {status === 'pending' ? (
              <p className="text-sm font-semibold text-blue">
                Etapa bloqueada ate a conclusao da anterior.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
