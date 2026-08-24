import { BUTTON } from '../../components/ui.js';
import { ProductContextStep } from '../product-context/ProductContextStep.jsx';
import { useJourney } from '../../state/JourneyProvider.jsx';

export function ProjectSetupPage() {
  const {
    session,
    workspace,
    completeSetup,
    goDashboard,
    logout,
    setupComplete,
  } = useJourney();
  const isEditing = Boolean(workspace?.setupCompletedAt);

  return (
    <div className="min-h-screen py-10 px-4 md:px-8">
      <header className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <p className="text-sm font-bold text-blue">{session.email}</p>
          <h1 className="text-3xl font-extrabold">
            {isEditing ? 'Configuração do projeto' : 'Setup inicial do projeto'}
          </h1>
        </div>
        <div className="flex gap-2">
          {isEditing && setupComplete ? (
            <button type="button" className={BUTTON.quiet} onClick={goDashboard}>
              Cancelar
            </button>
          ) : null}
          <button type="button" className={BUTTON.quiet} onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto bg-white border border-line rounded-2xl overflow-hidden">
        <div className="bg-lime px-5 py-4">
          <p className="text-xs font-extrabold uppercase tracking-widest">Configuração geral</p>
          <h2 className="text-2xl font-extrabold">Informações reutilizadas em toda iniciativa</h2>
          <p className="text-sm mt-2 max-w-3xl">
            Cadastre uma vez os membros do time, a documentação de negócio e os repositórios.
            Novos discoveries herdam automaticamente este contexto.
          </p>
        </div>
        <div className="p-5 md:p-8">
          <ProductContextStep onNext={completeSetup} />
          {isEditing && setupComplete ? (
            <p className="text-sm text-blue mt-4">
              Alterações nesta configuração passam a valer para todas as iniciativas deste projeto.
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}

