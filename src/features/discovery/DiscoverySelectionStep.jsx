import { useCallback, useEffect, useRef } from 'react';
import { draftDiscoveryFields } from '../../../shared/discoverySkill.js';
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

      const frameworkId = journey.discovery.framework || result.recommendedFramework;
      if (!journey.discovery.framework) {
        dispatch({ type: 'selectFramework', framework: result.recommendedFramework });
      }
      dispatch({
        type: 'applySuggestedFields',
        framework: frameworkId,
        fields: draftDiscoveryFields(frameworkId, {
          product: journey.product,
          initiative: journey.initiative,
        }),
      });
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
    dispatch({
      type: 'applySuggestedFields',
      framework: id,
      fields: draftDiscoveryFields(id, {
        product: journey.product,
        initiative: journey.initiative,
      }),
    });
  }

  return (
    <>
      <SkillPanel
        title="Recomendação de discovery"
        description={`A skill compara a necessidade da iniciativa com ${FRAMEWORK_IDS.length} frameworks de discovery e justifica a escolha. Você pode adotar outro framework a qualquer momento.`}
        runLabel={recommendation ? 'Recomendar de novo' : 'Recomendar'}
        onRun={askSkill}
        loading={loading}
        error={error}
      >
        {recommendation ? (
          <div className="border border-line rounded-xl p-4">
            <p className="font-extrabold mb-2">
              {FRAMEWORKS[recommendation.recommendedFramework]?.label} (
              {Math.round(recommendation.confidence * 100)}% de confiança)
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
                  Perguntas que a skill não consegue responder sozinha
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
          <p className="text-sm">Nenhuma recomendação ainda.</p>
        )}
      </SkillPanel>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {FRAMEWORK_IDS.map((id) => (
          <OptionCard
            key={id}
            title={FRAMEWORKS[id].label}
            description={`${FRAMEWORKS[id].need} ${FRAMEWORKS[id].summary}`}
            selected={journey.discovery.framework === id}
            recommended={recommendation?.recommendedFramework === id}
            onSelect={() => chooseFramework(id)}
          />
        ))}
      </div>

      <p className="text-sm mb-6">
        Trocar de framework não apaga nada: o conteúdo de cada método fica guardado separadamente.
      </p>

      <StepActions blockers={blockers} onNext={onNext} nextLabel="Preencher discovery" />
    </>
  );
}
