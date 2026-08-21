import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { createJourney, mergeJourney } from './journeyModel.js';
import { journeyReducer } from './journeyReducer.js';
import { loadJourney, saveJourney } from '../services/storage.js';

const JourneyContext = createContext(null);

function init() {
  const stored = loadJourney();
  return stored ? mergeJourney(stored) : createJourney();
}

export function JourneyProvider({ children }) {
  const [journey, dispatch] = useReducer(journeyReducer, undefined, init);
  const timerRef = useRef(null);

  // Autosave com debounce: digitar num textarea nao deve escrever no storage
  // a cada tecla.
  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveJourney(journey), 400);
    return () => clearTimeout(timerRef.current);
  }, [journey]);

  const value = useMemo(() => ({ journey, dispatch }), [journey]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourney precisa estar dentro de JourneyProvider.');
  }
  return context;
}
