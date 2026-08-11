import { useCallback, useState } from 'react';

/**
 * Estado de uma chamada de skill: carregando, erro e execucao.
 * Erro de contrato e erro de rede chegam aqui como mensagem exibivel.
 */
export function useSkill(skillFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(
    async (payload) => {
      setLoading(true);
      setError('');

      try {
        return await skillFn(payload);
      } catch (caught) {
        setError(caught?.message ?? 'A skill nao respondeu como esperado.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [skillFn],
  );

  return { run, loading, error };
}
