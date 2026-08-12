import { TOTAL_STEPS } from '../data/steps.js';
import { BUTTON } from './ui.js';

export function ProgressHeader({ activeStep, onBack, onRestart }) {
  const percentage = Math.round((activeStep / TOTAL_STEPS) * 100);

  return (
    <header className="no-print fixed top-0 left-0 w-full h-16 bg-white border-b border-line z-50 flex items-center gap-4 px-4 md:px-8">
      <button
        type="button"
        onClick={onBack}
        disabled={activeStep === 1}
        className="text-sm font-bold text-blue disabled:text-line shrink-0"
      >
        Voltar
      </button>

      <div
        className="flex-grow h-3 bg-canvas border border-line rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso da jornada"
      >
        <div
          className="h-full bg-blue transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <span className="text-sm font-extrabold w-16 text-right shrink-0">
        {activeStep}/{TOTAL_STEPS}
      </span>

      <button type="button" onClick={onRestart} className={`${BUTTON.quiet} shrink-0 hidden md:block`}>
        Reiniciar
      </button>
    </header>
  );
}
