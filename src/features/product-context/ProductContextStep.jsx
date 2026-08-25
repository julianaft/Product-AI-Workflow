import { BusinessContextSources } from '../../components/BusinessContextSources.jsx';
import { BusinessmapBrand } from '../../components/BusinessmapBrand.jsx';
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

      <section className="border border-line rounded-2xl p-5 mb-6">
        <BusinessmapBrand />
        <p className="text-xs font-extrabold uppercase tracking-widest text-blue mt-4 mb-1">
          Integração opcional em desenvolvimento
        </p>
        <h3 className="text-xl font-extrabold mb-2">Criação de Story</h3>
        <p className="text-sm mb-5">
          Configure o board uma vez para poder criar uma Story ao final de cada
          PRD. Se não quiser usar a integração, deixe os dois campos vazios.
        </p>

        <TextField
          label="Link do board"
          hint="Ex.: https://grupoboticario.kanbanize.com/ctrl_board/379"
          value={journey.product.businessmapBoardUrl}
          error={errorFor(errors, 'businessmapBoardUrl')}
          onBlur={markTouched('businessmapBoardUrl')}
          onChange={update('businessmapBoardUrl')}
          placeholder="https://grupoboticario.kanbanize.com/ctrl_board/379"
        />
        <TextField
          label="Chave de API"
          hint="No MVP, a chave fica no armazenamento local deste navegador e é enviada somente ao servidor da aplicação."
          value={journey.product.businessmapApiKey}
          error={errorFor(errors, 'businessmapApiKey')}
          onBlur={markTouched('businessmapApiKey')}
          onChange={update('businessmapApiKey')}
          placeholder="Cole a chave de API do Businessmap"
          type="password"
          autoComplete="off"
        />
        <p className="text-xs border border-orange rounded-xl p-3">
          A chave deve ficar em um cofre de segredos no backend, nunca exposta
          no navegador.
        </p>
      </section>

      <StepActions blockers={blockers} onNext={onNext} nextLabel="Salvar configuração do projeto" />
    </>
  );
}
