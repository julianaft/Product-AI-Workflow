import { Component } from 'react';
import { BUTTON } from './ui.js';

// Sem barreira, qualquer erro de render deixa a página totalmente em branco e o
// diagnóstico só aparece no console do navegador.
export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white border border-line rounded-2xl overflow-hidden">
          <div className="bg-orange p-6">
            <p className="text-xs font-extrabold uppercase tracking-widest mb-2">
              PM Builder
            </p>
            <h1 className="text-2xl font-extrabold">A plataforma não conseguiu abrir</h1>
          </div>

          <div className="p-6">
            <p className="text-sm mb-4">
              Um erro interrompeu a renderização. A mensagem abaixo ajuda a identificar a
              causa.
            </p>
            <pre className="border border-line rounded-xl p-3 text-xs whitespace-pre-wrap mb-5">
              {String(error?.message ?? error)}
            </pre>
            <button
              type="button"
              className={`${BUTTON.primary} w-full`}
              onClick={() => window.location.reload()}
            >
              Recarregar a página
            </button>
          </div>
        </div>
      </main>
    );
  }
}
