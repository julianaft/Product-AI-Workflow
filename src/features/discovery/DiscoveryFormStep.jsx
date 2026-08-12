import { useCallback } from 'react';
import { getFramework } from '../../../shared/frameworks.js';
import { TextAreaField } from '../../components/Field.jsx';
import { LinkAttachments } from '../../components/LinkAttachments.jsx';
import { HumanGate, SkillPanel } from '../../components/SkillPanel.jsx';
import { StepActions } from '../../components/StepActions.jsx';
import { BUTTON } from '../../components/ui.js';
import { useSkill } from '../../hooks/useSkill.js';
import { useTouched } from '../../hooks/useTouched.js';
import { reviewDiscovery, suggestDiscoveryField } from '../../services/aiClient.js';
import { validateStep } from '../../services/validation.js';
import { discoveryFields } from '../../state/journeyModel.js';
import { useJourney } from '../../state/JourneyProvider.jsx';

export function DiscoveryFormStep({ onNext }) {
  const { journey, dispatch } = useJourney();
  const { markTouched, errorFor } = useTouched();
  const review = useSkill(reviewDiscovery);
  const suggest = useSkill(suggestDiscoveryField);

  const framework = getFramework(journey.discovery.framework);
  const fields = discoveryFields(journey);
  const { errors, blockers } = validateStep(5, journey);

  const runReview = useCallback(async () => {
    const result = await review.run({
      frameworkId: journey.discovery.framework,
      fields,
      initiative: journey.initiative,
    });

    if (result) {
      dispatch({ type: 'setDiscoveryReview', review: result });
    }
  }, [dispatch, fields, journey.discovery.framework, journey.initiative, review]);

  async function suggestField(fieldKey) {
    const result = await suggest.run({
      product: journey.product,
      initiative: journey.initiative,
      frameworkId: journey.discovery.framework,
      fieldKey,
      currentValue: fields[fieldKey] ?? '',
    });

    if (result?.suggestion) {
      dispatch({ type: 'updateDiscoveryField', field: fieldKey, value: result.suggestion });
    }
  }

  if (!framework) {
    return <p className="text-sm font-semibold text-ember">Selecione um framework na etapa anterior.</p>;
  }

  const suggested = journey.discovery.recommendation?.suggestedFields;
  const reviewResult = journey.discovery.review;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue">
          Framework
        </span>
        <span className="font-extrabold">{framework.label}</span>

        {suggested ? (
          <button
            type="button"
            className={`${BUTTON.quiet} no-print`}
            onClick={() =>
              dispatch({
                type: 'applySuggestedFields',
                framework: journey.discovery.framework,
                fields: suggested,
              })
            }
          >
            Preencher vazios com o rascunho da skill
          </button>
        ) : null}
      </div>

      {framework.fields.map((field) => (
        <div key={field.key} className="relative">
          <TextAreaField
            label={field.label}
            hint={field.hint}
            required={field.required}
            rows={5}
            value={fields[field.key] ?? ''}
            error={errorFor(errors, field.key)}
            onBlur={markTouched(field.key)}
            onChange={(value) =>
              dispatch({ type: 'updateDiscoveryField', field: field.key, value })
            }
          />
          <button
            type="button"
            onClick={() => suggestField(field.key)}
            disabled={suggest.loading}
            className="no-print text-sm font-bold text-blue -mt-3 mb-5"
          >
            {suggest.loading ? 'Gerando...' : 'Sugerir conteudo para este campo'}
          </button>
        </div>
      ))}

      {suggest.error ? (
        <p role="alert" className="text-sm font-semibold text-ember mb-4">
          {suggest.error}
        </p>
      ) : null}

      <LinkAttachments
        scope="discovery"
        links={journey.links}
        onAdd={(link) => dispatch({ type: 'addLink', link })}
        onRemove={(id) => dispatch({ type: 'removeLink', id })}
      />

      <SkillPanel
        title="Revisao do discovery"
        description="A skill aponta lacunas, contradicoes e perguntas em aberto antes do PRD. Ela nao aprova o discovery."
        runLabel="Revisar discovery"
        onRun={runReview}
        loading={review.loading}
        error={review.error}
      >
        {reviewResult ? (
          <div className="space-y-4">
            <p className="font-extrabold">
              Campos obrigatorios preenchidos: {Math.round((reviewResult.completeness ?? 0) * 100)}%
            </p>

            <ReviewList title="Lacunas" items={reviewResult.gaps} emptyLabel="Nenhuma lacuna encontrada." />
            <ReviewList
              title="Contradicoes"
              items={reviewResult.contradictions}
              emptyLabel="Nenhuma contradicao encontrada."
            />
            <ReviewList
              title="Perguntas em aberto"
              items={reviewResult.questions}
              emptyLabel="Nenhuma pergunta pendente."
            />
          </div>
        ) : (
          <p className="text-sm">Rode a revisao antes de aprovar.</p>
        )}
      </SkillPanel>

      <HumanGate>o discovery precisa ser aprovado pelo PM antes de virar PRD.</HumanGate>

      <StepActions blockers={blockers} onNext={onNext} nextLabel="Gerar PRD">
        {!journey.discovery.approved ? (
          <button
            type="button"
            className={BUTTON.success}
            disabled={Object.keys(errors).length > 0}
            onClick={() => dispatch({ type: 'approveDiscovery' })}
          >
            Aprovar discovery
          </button>
        ) : null}
      </StepActions>
    </>
  );
}

function ReviewList({ title, items = [], emptyLabel }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-widest text-blue mb-1">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm">{emptyLabel}</p>
      ) : (
        <ul className="text-sm space-y-1">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
