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
          placeholder="Automatização de input e output"
        />
        <TextField
          label="Código da iniciativa OKR"
          hint="Identificador rastreavel da iniciativa, se existir."
          value={journey.initiative.okrCode}
          onChange={update('okrCode')}
          placeholder="C17IN1120"
        />
      </div>

      <TextAreaField
        label="Descrição"
        hint="O que se pretende construir, em linguagem de negócio."
        required
        rows={4}
        value={journey.initiative.description}
        error={errorFor(errors, 'description')}
        onBlur={markTouched('description')}
        onChange={update('description')}
      />

      <TextAreaField
        label="Problema percebido"
        hint="O que acontece hoje e por que isso é um problema. Cite a evidência quando houver."
        required
        rows={4}
        value={journey.initiative.problem}
        error={errorFor(errors, 'problem')}
        onBlur={markTouched('problem')}
        onChange={update('problem')}
      />

      <div className="grid gap-x-6 md:grid-cols-2">
        <TextField
          label="Público afetado"
          required
          value={journey.initiative.audience}
          error={errorFor(errors, 'audience')}
          onBlur={markTouched('audience')}
          onChange={update('audience')}
          placeholder="Revendedoras do canal VD"
        />
        <TextField
          label="Resultado esperado"
          hint="De preferência com número e prazo."
          required
          value={journey.initiative.expectedOutcome}
          error={errorFor(errors, 'expectedOutcome')}
          onBlur={markTouched('expectedOutcome')}
          onChange={update('expectedOutcome')}
        />
      </div>

      <TextAreaField
        label="Pessoas envolvidas por área"
        hint="Agrupar por squad, áreas parceiras e áreas consumidoras."
        rows={4}
        value={journey.initiative.stakeholders}
        onChange={update('stakeholders')}
      />

      <TextAreaField
        label="Restrições e dependências conhecidas"
        hint="Prazo, planilha, sistema, área ou permissão sem os quais a entrega não fecha."
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
