import { useCallback, useState } from 'react';

/**
 * Erro de campo obrigatorio so aparece depois que o campo perde o foco.
 * Sem isso, o formulario abriria com todos os campos marcados em vermelho.
 */
export function useTouched() {
  const [touched, setTouched] = useState({});

  const markTouched = useCallback(
    (field) => () => setTouched((current) => ({ ...current, [field]: true })),
    [],
  );

  const errorFor = useCallback(
    (errors, field) => (touched[field] ? errors[field] : undefined),
    [touched],
  );

  return { markTouched, errorFor };
}
