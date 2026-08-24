function normalizeOwner(value) {
  const input = String(value ?? '').trim();
  if (!input) return '';

  try {
    const url = new URL(input);
    if (url.hostname === 'github.com') {
      return url.pathname.split('/').filter(Boolean)[0] ?? '';
    }
  } catch {
    // O campo também aceita somente o nome da organização ou usuário.
  }

  return input.replace(/^@/, '').replace(/^\/|\/$/g, '');
}

export async function fetchGithubRepositories(ownerInput) {
  const owner = normalizeOwner(ownerInput);
  if (!owner) {
    throw new Error('Informe a organização ou o usuário do GitHub.');
  }

  const options = {
    headers: { Accept: 'application/vnd.github+json' },
  };
  let response = await fetch(
    `https://api.github.com/orgs/${encodeURIComponent(owner)}/repos?per_page=100&sort=updated`,
    options,
  );

  if (response.status === 404) {
    response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(owner)}/repos?per_page=100&sort=updated`,
      options,
    );
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('O GitHub limitou as consultas. Aguarde alguns minutos e tente novamente.');
    }
    throw new Error(`Não foi possível carregar os repositórios de "${owner}".`);
  }

  const repositories = await response.json();

  return repositories
    .filter((repository) => !repository.fork)
    .map((repository) => ({
      id: repository.id,
      fullName: repository.full_name,
      url: repository.html_url,
      description: repository.description ?? '',
      defaultBranch: repository.default_branch,
      private: Boolean(repository.private),
      selected: false,
    }));
}

