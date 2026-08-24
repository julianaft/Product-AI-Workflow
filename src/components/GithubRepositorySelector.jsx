import { useMemo, useState } from 'react';
import { fetchGithubRepositories } from '../services/github.js';
import { BUTTON, INPUT } from './ui.js';

export function GithubRepositorySelector({
  owner,
  repositories,
  onOwnerChange,
  onRepositoriesChange,
  error,
}) {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [filter, setFilter] = useState('');

  const selectedCount = repositories.filter((repository) => repository.selected).length;
  const visibleRepositories = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return repositories;
    return repositories.filter((repository) =>
      `${repository.fullName} ${repository.description}`.toLowerCase().includes(query),
    );
  }, [filter, repositories]);

  async function loadRepositories() {
    setLoading(true);
    setLocalError('');

    try {
      const loaded = await fetchGithubRepositories(owner);
      const selectedUrls = new Set(
        repositories.filter((repository) => repository.selected).map((repository) => repository.url),
      );

      onRepositoriesChange(
        loaded.map((repository) => ({
          ...repository,
          selected: selectedUrls.has(repository.url),
        })),
      );
    } catch (caught) {
      setLocalError(caught.message ?? 'Não foi possível carregar os repositórios.');
    } finally {
      setLoading(false);
    }
  }

  function toggle(repositoryId) {
    onRepositoriesChange(
      repositories.map((repository) =>
        repository.id === repositoryId
          ? { ...repository, selected: !repository.selected }
          : repository,
      ),
    );
  }

  return (
    <section className="border border-line rounded-2xl p-5 mb-6">
      <h3 className="font-extrabold mb-1">Contexto técnico</h3>
      <p className="text-sm mb-4">
        Carregue os repositórios públicos de uma organização ou usuário e selecione os que
        pertencem ao contexto técnico geral deste projeto/time. Eles serão reutilizados em novas
        iniciativas. Nesta versão, a seleção registra o escopo; a leitura do código será feita por
        uma integração posterior. Repositórios privados exigirão autenticação no backend.
      </p>

      <div className="grid gap-3 md:grid-cols-[1fr_auto] mb-4">
        <input
          className={INPUT}
          aria-label="Organização ou usuário do GitHub"
          placeholder="organização, usuário ou URL do GitHub"
          value={owner}
          onChange={(event) => onOwnerChange(event.target.value)}
        />
        <button
          type="button"
          className={BUTTON.primary}
          onClick={loadRepositories}
          disabled={loading || !owner.trim()}
        >
          {loading ? 'Carregando...' : 'Carregar repositórios'}
        </button>
      </div>

      {repositories.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <input
              className={INPUT}
              aria-label="Filtrar repositórios"
              placeholder="Filtrar repositórios"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
            <span className="text-sm font-bold text-blue">
              {selectedCount} selecionado(s)
            </span>
          </div>

          <div className="border border-line rounded-xl max-h-80 overflow-y-auto">
            {visibleRepositories.map((repository) => (
              <label
                key={repository.id}
                className="flex items-start gap-3 p-4 border-b border-line cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={repository.selected}
                  onChange={() => toggle(repository.id)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-bold">{repository.fullName}</span>
                  {repository.description ? (
                    <span className="block text-sm">{repository.description}</span>
                  ) : null}
                  <span className="block text-xs text-blue">
                    Branch padrão: {repository.defaultBranch}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </>
      ) : null}

      {localError || error ? (
        <p role="alert" className="text-sm font-semibold text-ember mt-3">
          {localError || error}
        </p>
      ) : null}
    </section>
  );
}

