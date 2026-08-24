import { BUTTON } from '../../components/ui.js';
import { useJourney } from '../../state/JourneyProvider.jsx';

function initiativeStatus(journey) {
  if (journey.prd?.status === 'approved') return 'PRD aprovado';
  if (journey.prd?.document) return `PRD versão ${journey.prd.document.revision ?? 1}`;
  if (journey.discovery?.approved) return 'Discovery aprovado';
  if (journey.discovery?.framework) return 'Discovery em andamento';
  if (journey.classification?.confirmedAt) return 'Iniciativa classificada';
  return 'Rascunho';
}

function lastUpdate(journey) {
  const date =
    journey.prd?.document?.generatedAt ??
    journey.classification?.confirmedAt ??
    null;
  if (!date) return 'Ainda sem geração';
  return new Date(date).toLocaleString('pt-BR');
}

export function WorkspaceDashboard() {
  const {
    session,
    workspace,
    createInitiative,
    openInitiative,
    editSetup,
    logout,
  } = useJourney();
  const initiatives = workspace?.initiatives ?? [];

  return (
    <div className="min-h-screen py-10 px-4 md:px-8">
      <header className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <p className="text-sm font-bold text-blue">
            {session.name} · {session.email}
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold">
            {workspace.setup.projectName}
          </h1>
          <p className="mt-2">
            {workspace.setup.name}
            {workspace.setup.teamName ? ` · ${workspace.setup.teamName}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BUTTON.secondary} onClick={editSetup}>
            Configurações do projeto
          </button>
          <button type="button" className={BUTTON.quiet} onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <section className="bg-white border border-line rounded-2xl overflow-hidden mb-8">
          <div className="bg-sky p-5 md:p-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest">Iniciativas</p>
              <h2 className="text-2xl font-extrabold">Seus discoveries e PRDs</h2>
              <p className="text-sm mt-1">
                Cada nova iniciativa reutiliza o setup do projeto, sem pedir membros,
                documentação ou repositórios novamente.
              </p>
            </div>
            <button type="button" className={BUTTON.primary} onClick={createInitiative}>
              Nova iniciativa
            </button>
          </div>

          {initiatives.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-bold mb-2">Nenhuma iniciativa cadastrada.</p>
              <p className="text-sm mb-5">
                O setup está pronto. Crie a primeira iniciativa para começar o discovery.
              </p>
              <button type="button" className={BUTTON.primary} onClick={createInitiative}>
                Criar primeira iniciativa
              </button>
            </div>
          ) : (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {initiatives.map((journey) => (
                <article key={journey.id} className="border border-line rounded-2xl p-5">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-blue">
                    {initiativeStatus(journey)}
                  </p>
                  <h3 className="text-xl font-extrabold mt-1 mb-2">
                    {journey.initiative?.name || 'Nova iniciativa'}
                  </h3>
                  <p className="text-sm min-h-10">
                    {journey.initiative?.problem || 'Complete o problema e a entrega desta iniciativa.'}
                  </p>
                  <p className="text-xs mt-4 mb-4">Última referência: {lastUpdate(journey)}</p>
                  <button
                    type="button"
                    className={BUTTON.quiet}
                    onClick={() => openInitiative(journey.id)}
                  >
                    Continuar iniciativa
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="text-sm border border-line rounded-xl bg-white p-4">
          Isolamento do MVP: os dados desta conta ficam em uma chave local própria para{' '}
          <strong>{session.email}</strong>. Em produção, o SSO e a autorização devem ser validados
          no backend.
        </p>
      </main>
    </div>
  );
}

