import { buildBusinessmapStory, businessmapIsConfigured } from '../../../shared/businessmap.js';
import { BUTTON, INPUT } from '../../components/ui.js';
import { useSkill } from '../../hooks/useSkill.js';
import { createBusinessmapStory } from '../../services/businessmap.js';
import { useJourney } from '../../state/JourneyProvider.jsx';

export function BusinessmapStep() {
  const {
    journey,
    dispatch,
    editSetup,
    goDashboard,
  } = useJourney();
  const { run, loading, error } = useSkill(createBusinessmapStory);
  const configured = businessmapIsConfigured(journey.product);
  const createdCard = journey.businessmap.card;
  const story = buildBusinessmapStory({
    prd: journey.prd.document,
    initiative: journey.initiative,
  });

  async function createStory() {
    const card = await run({
      boardUrl: journey.product.businessmapBoardUrl,
      apiKey: journey.product.businessmapApiKey,
      prd: journey.prd.document,
      initiative: journey.initiative,
    });
    if (card) {
      dispatch({ type: 'setBusinessmapCard', card });
    }
  }

  if (createdCard) {
    return (
      <div className="border border-green rounded-2xl p-5">
        <p className="text-xs font-extrabold uppercase tracking-widest mb-1">
          Story criada
        </p>
        <h3 className="text-xl font-extrabold mb-2">{createdCard.title}</h3>
        <p className="text-sm mb-5">
          ID {createdCard.customId || createdCard.cardId} · tipo Story
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={createdCard.boardUrl}
            target="_blank"
            rel="noreferrer"
            className={BUTTON.primary}
          >
            Abrir board no Businessmap
          </a>
          <button type="button" className={BUTTON.quiet} onClick={goDashboard}>
            Voltar ao painel
          </button>
        </div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="border border-orange rounded-2xl p-5">
        <h3 className="text-xl font-extrabold mb-2">Integração não configurada</h3>
        <p className="text-sm mb-5">
          Esta etapa é opcional. Para criar a Story, adicione o link do board e
          a chave de API na configuração geral do projeto.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={BUTTON.primary} onClick={editSetup}>
            Configurar Businessmap
          </button>
          <button type="button" className={BUTTON.quiet} onClick={goDashboard}>
            Pular por agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border border-line rounded-2xl p-5 mb-5">
        <div className="flex flex-wrap justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-blue">
              Prévia do card
            </p>
            <h3 className="text-xl font-extrabold">{story.title}</h3>
          </div>
          <span className="self-start bg-lime rounded-full px-3 py-1 text-xs font-extrabold">
            Tipo: Story
          </span>
        </div>
        <textarea
          aria-label="Descrição da Story"
          className={`${INPUT} resize-y`}
          rows={24}
          value={story.description}
          readOnly
        />
        <p className="text-xs text-blue mt-2">
          A Story será criada no workflow de cards, na primeira lane e coluna
          Requested disponíveis no board.
        </p>
      </div>

      {error ? (
        <p role="alert" className="border border-ember rounded-xl p-3 text-sm font-semibold mb-4">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={BUTTON.success}
          disabled={loading || journey.prd.status !== 'approved'}
          onClick={createStory}
        >
          {loading ? 'Criando Story...' : 'Criar Story no Businessmap'}
        </button>
        <button
          type="button"
          className={BUTTON.quiet}
          disabled={loading}
          onClick={goDashboard}
        >
          Pular por agora
        </button>
      </div>
    </>
  );
}
