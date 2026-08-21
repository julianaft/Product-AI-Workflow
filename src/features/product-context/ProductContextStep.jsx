import { TextAreaField, TextField } from '../../components/Field.jsx';
import { LinkAttachments } from '../../components/LinkAttachments.jsx';
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
          label="Produto"
          required
          value={journey.product.name}
          error={errorFor(errors, 'name')}
          onBlur={markTouched('name')}
          onChange={update('name')}
          placeholder="GCAM"
        />
        <TextField
          label="Squad"
          required
          value={journey.product.squad}
          error={errorFor(errors, 'squad')}
          onBlur={markTouched('squad')}
          onChange={update('squad')}
          placeholder="GCAM"
        />
        <TextField
          label="Diretoria"
          value={journey.product.directorate}
          onChange={update('directorate')}
          placeholder="Tech Experiencia"
        />
        <TextField
          label="Tribo"
          value={journey.product.tribe}
          onChange={update('tribe')}
          placeholder="RGM"
        />
        <TextField
          label="PM / GPM"
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
        <TextField
          label="Redatores"
          hint="Separe os nomes por virgula."
          value={journey.product.writers}
          onChange={update('writers')}
        />
        <TextField
          label="Responsaveis da squad"
          hint="Separe os nomes por virgula."
          value={journey.product.owners}
          onChange={update('owners')}
        />
      </div>

      <TextAreaField
        label="Contexto de negocio"
        hint="O que o produto faz hoje, para quem, e quais processos existem."
        required
        rows={5}
        value={journey.product.businessContext}
        error={errorFor(errors, 'businessContext')}
        onBlur={markTouched('businessContext')}
        onChange={update('businessContext')}
      />

      <TextAreaField
        label="Contexto tecnico resumido"
        hint="Sistemas envolvidos e integracoes conhecidas."
        rows={4}
        value={journey.product.technicalContext}
        onChange={update('technicalContext')}
      />

      <LinkAttachments
        scope="product"
        links={journey.links}
        onAdd={(link) => dispatch({ type: 'addLink', link })}
        onRemove={(id) => dispatch({ type: 'removeLink', id })}
      />

      <StepActions blockers={blockers} onNext={onNext} nextLabel="Salvar contexto e seguir" />
    </>
  );
}
