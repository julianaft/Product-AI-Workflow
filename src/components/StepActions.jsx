import { BUTTON } from './ui.js';

export function StepActions({ blockers = [], onNext, nextLabel = 'Avancar', children }) {
  const blocked = blockers.length > 0;

  return (
    <div className="no-print border-t border-line pt-6 mt-6">
      {blocked ? (
        <ul className="mb-4 space-y-1">
          {blockers.map((blocker) => (
            <li key={blocker} className="text-sm font-semibold text-ember">
              {blocker}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {children}
        {onNext ? (
          <button type="button" onClick={onNext} disabled={blocked} className={BUTTON.primary}>
            {nextLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
