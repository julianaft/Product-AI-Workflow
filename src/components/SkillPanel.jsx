import { BUTTON, classNames } from './ui.js';

/**
 * Moldura comum das duas skills. Deixa explicito na tela que a saida e uma
 * sugestao e que a decisao continua sendo do PM.
 */
export function SkillPanel({
  title,
  description,
  runLabel,
  onRun,
  loading,
  error,
  disabled,
  children,
}) {
  return (
    <div className="border border-line rounded-2xl overflow-hidden mb-6">
      <div className="bg-lime px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest">Skill de IA</p>
          <h3 className="text-lg font-extrabold">{title}</h3>
        </div>

        <button
          type="button"
          onClick={onRun}
          disabled={loading || disabled}
          className={classNames(BUTTON.primary, 'no-print')}
        >
          {loading ? 'Processando...' : runLabel}
        </button>
      </div>

      <div className="p-5 bg-white">
        {description ? <p className="text-sm mb-4">{description}</p> : null}

        {error ? (
          <p role="alert" className="border border-ember rounded-xl px-4 py-3 text-sm font-semibold text-ember mb-4">
            {error}
          </p>
        ) : null}

        {children}
      </div>
    </div>
  );
}

export function HumanGate({ children }) {
  return (
    <p className="border border-orange rounded-xl px-4 py-3 text-sm font-bold text-black mb-6">
      Intervencao humana: {children}
    </p>
  );
}
