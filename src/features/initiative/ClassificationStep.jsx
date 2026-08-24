import { useCallback, useEffect, useRef } from 'react';
import { HumanGate, SkillPanel } from '../../components/SkillPanel.jsx';
import { OptionCard } from '../../components/OptionCard.jsx';
import { StepActions } from '../../components/StepActions.jsx';
import { BUTTON } from '../../components/ui.js';
import { useSkill } from '../../hooks/useSkill.js';
import { classifyInitiative } from '../../services/aiClient.js';
import { validateStep } from '../../services/validation.js';
import { useJourney } from '../../state/JourneyProvider.jsx';

const TYPES = [
  {
    value: 'incremental',
    title: 'Incremental',
    description: 'Expande algo que já existe: nova mecânica, novo campo, novo canal, integração.',
  },
  {
    value: 'new',
    title: 'Novo fluxo',
    description: 'Cria uma jornada inédita: nova área de negócio, produto ou aplicação do zero.',
  },
];

export function ClassificationStep({ onNext }) {
  const { journey, dispatch } = useJourney();
  const { run, loading, error } = useSkill(classifyInitiative);
  const { blockers } = validateStep(3, journey);

  const suggestion = journey.classification.suggestion;

  // Guarda a assinatura da última análise para não repetir a chamada quando o
  // React remonta o efeito, mas permite nova análise se a iniciativa mudar.
  const lastAnalysed = useRef(null);

  const analyse = useCallback(async () => {
    const result = await run({
      product: journey.product,
      initiative: journey.initiative,
    });

    if (result) {
      dispatch({ type: 'setClassificationSuggestion', suggestion: result });
    }
  }, [dispatch, journey.initiative, journey.product, run]);

  // A análise roda sozinha ao abrir a etapa, e novamente se a iniciativa mudar.
  useEffect(() => {
    const signature = JSON.stringify(journey.initiative);

    if (!suggestion && lastAnalysed.current !== signature) {
      lastAnalysed.current = signature;
      analyse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion]);

  return (
    <>
      <SkillPanel
        title="Classificação da iniciativa"
        description="A skill lê o contexto do produto e a descrição da iniciativa e sugere o tipo. A sugestão não decide nada sozinha."
        runLabel={suggestion ? 'Analisar de novo' : 'Analisar'}
        onRun={analyse}
        loading={loading}
        error={error}
      >
        {suggestion ? (
          <div className="border border-line rounded-xl p-4">
            <p className="font-extrabold mb-2">
              Sugestão: {suggestion.type === 'incremental' ? 'Incremental' : 'Novo fluxo'} (
              {Math.round(suggestion.confidence * 100)}% de confiança)
            </p>
            <p className="text-sm mb-3">{suggestion.reason}</p>
            <ul className="text-sm space-y-1">
              {suggestion.signals?.map((signal) => (
                <li key={signal}>- {signal}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm">Nenhuma análise executada ainda.</p>
        )}
      </SkillPanel>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {TYPES.map((type) => (
          <OptionCard
            key={type.value}
            title={type.title}
            description={type.description}
            selected={journey.classification.type === type.value}
            recommended={suggestion?.type === type.value}
            onSelect={() => dispatch({ type: 'setClassificationType', value: type.value })}
          />
        ))}
      </div>

      <HumanGate>a classificação precisa ser confirmada pelo PM.</HumanGate>

      <StepActions blockers={blockers} onNext={onNext} nextLabel="Escolher discovery">
        {journey.classification.type && !journey.classification.confirmedAt ? (
          <button
            type="button"
            className={BUTTON.success}
            onClick={() => dispatch({ type: 'confirmClassification' })}
          >
            Confirmar classificação
          </button>
        ) : null}
      </StepActions>
    </>
  );
}
