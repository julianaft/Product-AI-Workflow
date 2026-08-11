import { useCallback, useEffect, useRef } from 'react';
import { FRAMEWORKS, FRAMEWORK_IDS } from '../../../shared/frameworks.js';
import { OptionCard } from '../../components/OptionCard.jsx';
import { SkillPanel } from '../../components/SkillPanel.jsx';
import { StepActions } from '../../components/StepActions.jsx';
import { useSkill } from '../../hooks/useSkill.js';
import { recommendDiscovery } from '../../services/aiClient.js';
import { validateStep } from '../../services/validation.js';
import { useJourney } from '../../state/JourneyProvider.jsx';

export function DiscoverySelectionStep({ onNext }) {
  const { journey, dispatch } = useJourney();
  const { run, loading, error } = useSkill(recommendDiscovery);
  const { blockers } = validateStep(4, journey);

  const recommendation = journey.discovery.recommendation;
  const lastAsked = useRef(null);

  const askSkill = useCallback(async () => {
    const result = await run({
      product: journey.product,
      initiative: journey.initiative,
      initiativeType: journey.classification.type,
      availableFrameworks: FRAMEWORK_IDS,
    });

    if (result) {
      dispatch({ type: 'setDiscoveryRecommendation', recommendation: result });

      if (!journey.discovery.framework) {
        dispatch({ type: 'selectFramework', framework: result.recommendedFramework });
      }
    }
  }, [
    dispatch,
    journey.classification.type,
    journey.discovery.framework,
    journey.initiative,
    journey.product,
    run,
  ]);

  useEffect(() => {
    const signature = `${journey.classification.type}:${journey.initiative.name}`;

    if (!recommendation && lastAsked.current !== signature) {
      lastAsked.current = signature;
      askSkill();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendation]);

  function chooseFramework(id) {
    dispatch({ type: 'selectFramework', framework: id });
  }

  return (
    <>
      <SkillPanel
        title="Recomendacao de discovery"
        description="A skill compara a iniciativa com os tres frameworks disponiveis e justifica a escolha. Voce pode adotar outro framework a qualquer momento."
        runLabel={recommendation ? 'Recomendar de novo' : 'Recomendar'}
        onRun={askSkill}
        loading={loading}
        error={error}
      >
        {recommendation ? (
          <div className="border border-line rounded-xl p-4">
            <p className="font-extrabold mb-2">
              {FRAMEWORKS[recommendation.recommendedFramework]?.label} (
              {Math.round(recommendation.confidence * 100)}% de confianca)
            </p>
            <p className="text-sm mb-4">{recommendation.reason}</p>

            {recommendation.alternatives?.length ? (
              <>
                <p className="text-xs font-extrabold uppercase tracking-widest text-blue mb-2">
                  Quando trocar
                </p>
                <ul className="text-sm space-y-1 mb-4">
                  {recommendation.alternatives.map((alternative) => (
                    <li key={alternative.framework}>
                      <strong>{FRAMEWORKS[alternative.framework]?.label}:</strong>{' '}
                      {alternative.reason}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {recommendation.questions?.length ? (
              <>
                <p className="text-xs font-extrabold uppercase tracking-widest text-blue mb-2">
                  Perguntas que a skill nao consegue responder sozinha
                </p>
                <ul className="text-sm space-y-1">
                  {recommendation.questions.map((question) => (
                    <li key={question}>- {question}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ) : (
          <p className="text-sm">Nenhuma recomendacao ainda.</p>
        )}
      </SkillPanel>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {FRAMEWORK_IDS.map((id) => (
          <OptionCard
            key={id}
            title={FRAMEWORKS[id].label}
            description={FRAMEWORKS[id].summary}
            selected={journey.discovery.framework === id}
            recommended={recommendation?.recommendedFramework === id}
            onSelect={() => chooseFramework(id)}
          />
        ))}
      </div>

      <p className="text-sm mb-6">
        Trocar de framework nao apaga nada: o conteudo de cada metodo fica guardado separadamente.
      </p>

      <StepActions blockers={blockers} onNext={onNext} nextLabel="Preencher discovery" />
    </>
  );
}
