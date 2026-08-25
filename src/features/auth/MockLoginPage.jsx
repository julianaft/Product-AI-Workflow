import { useState } from 'react';
import { BUTTON, INPUT } from '../../components/ui.js';
import { useJourney } from '../../state/JourneyProvider.jsx';

export function MockLoginPage() {
  const { login } = useJourney();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError('Informe um e-mail Google válido.');
      return;
    }
    login({ email: normalized, name: name.trim() });
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-line rounded-2xl overflow-hidden">
        <div className="bg-lime p-6">
          <p className="text-xs font-extrabold uppercase tracking-widest mb-2">
            PM Builder
          </p>
          <h1 className="text-3xl font-extrabold">Entre na sua plataforma de produto</h1>
          <p className="text-sm mt-3">
            Cada conta acessa somente os projetos e as iniciativas cadastrados por ela.
          </p>
        </div>

        <form onSubmit={submit} className="p-6">
          <label className="block text-sm font-bold mb-1" htmlFor="account-name">
            Nome
          </label>
          <input
            id="account-name"
            className={`${INPUT} mb-4`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Seu nome"
          />

          <label className="block text-sm font-bold mb-1" htmlFor="account-email">
            E-mail Google
          </label>
          <input
            id="account-email"
            type="email"
            className={INPUT}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@empresa.com"
            required
          />

          {error ? (
            <p role="alert" className="text-sm font-semibold text-ember mt-2">
              {error}
            </p>
          ) : null}

          <button type="submit" className={`${BUTTON.primary} w-full mt-5`}>
            <span className="inline-block bg-white text-blue rounded-full w-6 h-6 mr-2 leading-6">
              G
            </span>
            Continuar com Google
          </button>
        </form>
      </div>
    </main>
  );
}

