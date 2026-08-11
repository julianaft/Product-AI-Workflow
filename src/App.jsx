import { ProgressHeader } from './components/ProgressHeader.jsx';
import { StepCard } from './components/StepCard.jsx';
import { STEPS, TOTAL_STEPS } from './data/steps.js';
import { ClassificationStep } from './features/initiative/ClassificationStep.jsx';
import { DiscoveryFormStep } from './features/discovery/DiscoveryFormStep.jsx';
import { DiscoverySelectionStep } from './features/discovery/DiscoverySelectionStep.jsx';
import { InitiativeStep } from './features/initiative/InitiativeStep.jsx';
import { PrdStep } from './features/prd/PrdStep.jsx';
import { ProductContextStep } from './features/product-context/ProductContextStep.jsx';
import { getAiMode } from './services/aiClient.js';
import { clearJourney } from './services/storage.js';
import { useJourney } from './state/JourneyProvider.jsx';
import { FRAMEWORKS } from '../shared/frameworks.js';

function stepStatus(stepId, journey) {
  if (stepId === journey.activeStep) return 'active';
  if (stepId < journey.activeStep || stepId <= journey.maxRevealedStep) return 'completed';
  return 'pending';
}

function summaryFor(stepId, journey) {
  switch (stepId) {
    case 1:
      return journey.product.name ? `${journey.product.name} — squad ${journey.product.squad}` : null;
    case 2:
      return journey.initiative.name || null;
    case 3:
      if (!journey.classification.type) return null;
      return journey.classification.type === 'new' ? 'Novo fluxo' : 'Incremental';
    case 4:
      return FRAMEWORKS[journey.discovery.framework]?.label ?? null;
    case 5:
      return journey.discovery.approved ? 'Discovery aprovado.' : 'Discovery em rascunho.';
    case 6:
      return journey.prd.status === 'approved' ? 'PRD aprovado.' : 'PRD em rascunho.';
    default:
      return null;
  }
}

function renderStep(stepId, onNext) {
  switch (stepId) {
    case 1:
      return <ProductContextStep onNext={onNext} />;
    case 2:
      return <InitiativeStep onNext={onNext} />;
    case 3:
      return <ClassificationStep onNext={onNext} />;
    case 4:
      return <DiscoverySelectionStep onNext={onNext} />;
    case 5:
      return <DiscoveryFormStep onNext={onNext} />;
    case 6:
      return <PrdStep />;
    default:
      return null;
  }
}

export default function App() {
  const { journey, dispatch } = useJourney();

  const filled = ((journey.activeStep - 0.5) / TOTAL_STEPS) * 100;

  function restart() {
    if (window.confirm('Descartar a jornada atual e comecar do zero?')) {
      clearJourney();
      dispatch({ type: 'reset' });
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8">
      <ProgressHeader
        activeStep={journey.activeStep}
        onBack={() => dispatch({ type: 'previousStep' })}
        onRestart={restart}
      />

      <div className="max-w-5xl mx-auto mb-10">
        <span className="inline-block bg-blue text-white text-xs font-extrabold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
          Jornada de produto
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-3">Do input da iniciativa ao PRD</h1>
        <p className="max-w-3xl">
          Seis etapas com duas skills de IA: uma recomenda e revisa o discovery, outra constroi o
          PRD. Ferramentas externas entram como link, sem integracao nativa.
        </p>
        <p className="text-sm font-bold text-blue mt-3">
          Modo das skills: {getAiMode() === 'http' ? 'servidor' : 'deterministico local'}
        </p>
      </div>

      <main className="max-w-5xl mx-auto relative">
        <div className="absolute left-6 top-0 bottom-0 w-1 -translate-x-1/2 bg-line rounded-full" aria-hidden="true" />
        <div
          className="absolute left-6 top-0 w-1 -translate-x-1/2 bg-blue rounded-full transition-all duration-500"
          style={{ height: `${filled}%` }}
          aria-hidden="true"
        />

        {STEPS.map((step) => {
          const status = stepStatus(step.id, journey);

          return (
            <StepCard
              key={step.id}
              step={step}
              status={status}
              summary={summaryFor(step.id, journey)}
              onEdit={() => dispatch({ type: 'goToStep', step: step.id })}
            >
              {renderStep(step.id, () => dispatch({ type: 'nextStep' }))}
            </StepCard>
          );
        })}
      </main>
    </div>
  );
}
