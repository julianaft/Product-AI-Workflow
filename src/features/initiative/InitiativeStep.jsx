import { TextAreaField, TextField } from '../../components/Field.jsx';
import { StepActions } from '../../components/StepActions.jsx';
import { useTouched } from '../../hooks/useTouched.js';
import { validateStep } from '../../services/validation.js';
import { useJourney } from '../../state/JourneyProvider.jsx';

export function InitiativeStep({ onNext }) {
  const { journey, dispatch } = useJourney();
  const { markTouched, errorFor } = useTouched();
  const { errors } = validateStep(2, journey);

  function update(field) {
    return (value) => dispatch({ type: 'updateInitiative', field, value });
  }

  return (
    <>
      <div className="grid gap-x-6 md:grid-cols-2">
        <TextField
          label="Nome da iniciativa"
          required
          value={journey.initiative.name}
          error={errorFor(errors, 'name')}
          onBlur={markTouched('name')}
          onChange={update('name')}
          placeholder="Automatizacao de input e output"
        />
        <TextField
          label="Codigo da iniciativa OKR"
          hint="Identificador rastreavel da iniciativa, se existir."
          value={journey.initiative.okrCode}
          onChange={update('okrCode')}
          placeholder="C17IN1120"
        />
      </div>

      <TextAreaField
        label="Descricao"
        hint="O que se pretende construir, em linguagem de negocio."
        required
        rows={4}
        value={journey.initiative.description}
        error={errorFor(errors, 'description')}
        onBlur={markTouched('description')}
        onChange={update('description')}
      />

      <TextAreaField
        label="Problema percebido"
        hint="O que acontece hoje e por que isso e um problema. Cite a evidencia quando houver."
        required
        rows={4}
        value={journey.initiative.problem}
        error={errorFor(errors, 'problem')}
        onBlur={markTouched('problem')}
        onChange={update('problem')}
      />

      <div className="grid gap-x-6 md:grid-cols-2">
        <TextField
          label="Publico afetado"
          required
          value={journey.initiative.audience}
          error={errorFor(errors, 'audience')}
          onBlur={markTouched('audience')}
          onChange={update('audience')}
          placeholder="Revendedoras do canal VD"
        />
        <TextField
          label="Resultado esperado"
          hint="De preferencia com numero e prazo."
          required
          value={journey.initiative.expectedOutcome}
          error={errorFor(errors, 'expectedOutcome')}
          onBlur={markTouched('expectedOutcome')}
          onChange={update('expectedOutcome')}
        />
      </div>

      <TextAreaField
        label="Pessoas envolvidas por area"
        hint="Agrupar por squad, areas parceiras e areas consumidoras."
        rows={4}
        value={journey.initiative.stakeholders}
        onChange={update('stakeholders')}
      />

      <TextAreaField
        label="Restricoes e dependencias conhecidas"
        hint="Prazo, planilha, sistema, area ou permissao sem os quais a entrega nao fecha."
        rows={3}
        value={journey.initiative.constraints}
        onChange={update('constraints')}
      />

      <StepActions
        blockers={Object.values(errors)}
        onNext={onNext}
        nextLabel="Analisar iniciativa"
      />
    </>
  );
}
