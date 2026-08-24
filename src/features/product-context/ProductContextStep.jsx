import { BusinessContextSources } from '../../components/BusinessContextSources.jsx';
import { TextField } from '../../components/Field.jsx';
import { GithubRepositorySelector } from '../../components/GithubRepositorySelector.jsx';
import { StepActions } from '../../components/StepActions.jsx';
import { useTouched } from '../../hooks/useTouched.js';
import { validateStep } from '../../services/validation.js';
import { useJourney } from '../../state/JourneyProvider.jsx';

export function ProductContextStep({ onNext }) {
  const { journey, dispatch } = useJourney();
  const { markTouched, errorFor } = useTouched();
  const { errors } = validateStep(1, journey);

  function update(field) {
    return (value) => dispatch({ type: 'updateProduct', field, value });
  }

  const blockers = Object.values(errors);

  return (
    <>
      <div className="grid gap-x-6 md:grid-cols-2">
        <TextField
          label="Projeto / espaço do time"
          required
          value={journey.product.projectName}
          error={errorFor(errors, 'projectName')}
          onBlur={markTouched('projectName')}
          onChange={update('projectName')}
          placeholder="Ex.: Growth B2B"
        />
        <TextField
          label="Produto"
          required
          value={journey.product.name}
          error={errorFor(errors, 'name')}
          onBlur={markTouched('name')}
          onChange={update('name')}
          placeholder="Nome do produto"
        />
        <TextField
          label="Time / squad"
          value={journey.product.teamName}
          onChange={update('teamName')}
          placeholder="Nome do time"
        />
        <TextField
          label="PM"
          value={journey.product.pm}
          onChange={update('pm')}
        />
        <TextField
          label="PD"
          value={journey.product.pd}
          onChange={update('pd')}
        />
        <TextField
          label="TM"
          value={journey.product.tm}
          onChange={update('tm')}
        />
        <TextField
          label="TL"
          value={journey.product.tl}
          onChange={update('tl')}
        />
      </div>

      <BusinessContextSources
        sources={journey.product.businessContextSources}
        onChange={update('businessContextSources')}
        error={errors.businessContextSources}
      />

      <GithubRepositorySelector
        owner={journey.product.githubOwner}
        repositories={journey.product.repositories}
        onOwnerChange={update('githubOwner')}
        onRepositoriesChange={update('repositories')}
        error={errors.repositories}
      />

      <StepActions blockers={blockers} onNext={onNext} nextLabel="Salvar configuração do projeto" />
    </>
  );
}
