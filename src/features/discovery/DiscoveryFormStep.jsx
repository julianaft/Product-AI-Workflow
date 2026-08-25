import { useCallback, useEffect } from 'react';
import { draftDiscoveryFields } from '../../../shared/discoverySkill.js';
import { getFramework } from '../../../shared/frameworks.js';
import { TextAreaField } from '../../components/Field.jsx';
import { DiscoveryEvidenceSources } from '../../components/DiscoveryEvidenceSources.jsx';
import { LinkAttachments } from '../../components/LinkAttachments.jsx';
import { HumanGate, SkillPanel } from '../../components/SkillPanel.jsx';
import { StepActions } from '../../components/StepActions.jsx';
import { BUTTON } from '../../components/ui.js';
import { useSkill } from '../../hooks/useSkill.js';
import { useTouched } from '../../hooks/useTouched.js';
import {
  refreshDiscoveryWithEvidence,
  reviewDiscovery,
  suggestDiscoveryField,
} from '../../services/aiClient.js';
import { validateStep } from '../../services/validation.js';
import { discoveryFields } from '../../state/journeyModel.js';
import { useJourney } from '../../state/JourneyProvider.jsx';

export function DiscoveryFormStep({ onNext }) {
  const { journey, dispatch } = useJourney();
  const { markTouched, errorFor } = useTouched();
  const review = useSkill(reviewDiscovery);
  const suggest = useSkill(suggestDiscoveryField);
  const refresh = useSkill(refreshDiscoveryWithEvidence);

  const framework = getFramework(journey.discovery.framework);
  const fields = discoveryFields(journey);
  const { errors, blockers } = validateStep(5, journey);
  const drafts = framework
    ? draftDiscoveryFields(framework.id, {
        product: journey.product,
        initiative: journey.initiative,
      })
    : {};

  useEffect(() => {
    const frameworkId = journey.discovery.framework;
    if (!frameworkId) return;

    dispatch({
      type: 'applySuggestedFields',
      framework: frameworkId,
      fields: draftDiscoveryFields(frameworkId, {
        product: journey.product,
        initiative: journey.initiative,
      }),
    });
  }, [
    dispatch,
    journey.discovery.framework,
    journey.initiative,
    journey.product,
  ]);

  const runReview = useCallback(async () => {
    const result = await review.run({
      frameworkId: journey.discovery.framework,
      fields,
      initiative: journey.initiative,
      evidenceSources: journey.discovery.evidenceSources,
    });

    if (result) {
      dispatch({ type: 'setDiscoveryReview', review: result });
    }
  }, [
    dispatch,
    fields,
    journey.discovery.evidenceSources,
    journey.discovery.framework,
    journey.initiative,
    review,
  ]);

  const refreshFromEvidence = useCallback(async () => {
    const result = await refresh.run({
      frameworkId: journey.discovery.framework,
      product: journey.product,
      initiative: journey.initiative,
      evidenceSources: journey.discovery.evidenceSources,
      currentFields: fields,
    });

    if (result) {
      dispatch({
        type: 'applyDiscoveryEvidence',
        framework: journey.discovery.framework,
        result,
      });
    }
  }, [dispatch, fields, journey, refresh]);

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

  const reviewResult = journey.discovery.review;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue">
          Framework
        </span>
        <span className="font-extrabold">{framework.label}</span>

        {Object.keys(drafts).length ? (
          <button
            type="button"
            className={`${BUTTON.quiet} no-print`}
            onClick={() =>
              dispatch({
                type: 'applySuggestedFields',
                framework: journey.discovery.framework,
                fields: drafts,
              })
            }
          >
            Preencher vazios com o rascunho da skill
          </button>
        ) : null}
      </div>

      <p className="text-sm mb-6">
        Os campos já vêm com um rascunho a partir do problema, da dor e da entrega descritos nas
        etapas anteriores. A skill não inventa evidência: o que faltar aparece como ponto a
        validar. Edite o que não bater e use o botão por campo para regenerar só aquele trecho.
      </p>

      <DiscoveryEvidenceSources
        sources={journey.discovery.evidenceSources}
        onChange={(sources) =>
          dispatch({ type: 'setDiscoveryEvidenceSources', sources })
        }
      />

      <div className="border border-sky rounded-2xl p-5 mb-6">
        <h3 className="font-extrabold mb-1">
          Atualizar o template com as novas informações
        </h3>
        <p className="text-sm mb-4">
          A atualização preenche campos vazios e incorpora os registros no campo
          de evidências do framework. O conteúdo escrito pelo PM é preservado.
        </p>
        <button
          type="button"
          className={BUTTON.primary}
          disabled={
            refresh.loading || journey.discovery.evidenceSources.length === 0
          }
          onClick={refreshFromEvidence}
        >
          {refresh.loading
            ? 'Atualizando discovery...'
            : 'Atualizar template de discovery'}
        </button>
        {journey.discovery.evidenceAppliedAt ? (
          <p className="text-sm font-semibold text-blue mt-3">
            Evidências incorporadas em{' '}
            {new Date(journey.discovery.evidenceAppliedAt).toLocaleString(
              'pt-BR',
            )}
            .
          </p>
        ) : journey.discovery.evidenceSources.length ? (
          <p className="text-sm font-semibold text-orange mt-3">
            Há novas evidências aguardando atualização do template.
          </p>
        ) : null}
        {refresh.error ? (
          <p role="alert" className="text-sm font-semibold text-ember mt-3">
            {refresh.error}
          </p>
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
            {suggest.loading ? 'Gerando...' : 'Sugerir conteúdo para este campo'}
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
        title="Revisão do discovery"
        description="A skill aponta lacunas, contradições e perguntas em aberto antes do PRD. Ela não aprova o discovery."
        runLabel="Revisar discovery"
        onRun={runReview}
        loading={review.loading}
        error={review.error}
      >
        {reviewResult ? (
          <div className="space-y-4">
            <p className="font-extrabold">
              Campos obrigatórios preenchidos: {Math.round((reviewResult.completeness ?? 0) * 100)}%
            </p>

            <ReviewList title="Lacunas" items={reviewResult.gaps} emptyLabel="Nenhuma lacuna encontrada." />
            <ReviewList
              title="Contradições"
              items={reviewResult.contradictions}
              emptyLabel="Nenhuma contradição encontrada."
            />
            <ReviewList
              title="Perguntas em aberto"
              items={reviewResult.questions}
              emptyLabel="Nenhuma pergunta pendente."
            />
          </div>
        ) : (
          <p className="text-sm">Rode a revisão antes de aprovar.</p>
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
