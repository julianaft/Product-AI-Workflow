import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { journeyReducer } from './journeyReducer.js';
import {
  clearJourney,
  clearSession,
  loadJourney,
  loadSession,
  loadWorkspace,
  saveSession,
  saveWorkspace,
} from '../services/storage.js';
import {
  activeJourney,
  createInitiativeForWorkspace,
  createWorkspace,
  mergeWorkspace,
  setupIsComplete,
  userIdFromEmail,
} from './workspaceModel.js';

const JourneyContext = createContext(null);

function initialState() {
  const session = loadSession();
  if (!session?.email) {
    return { session: null, workspace: null, view: 'login' };
  }

  const stored = loadWorkspace(userIdFromEmail(session.email));
  const workspace = mergeWorkspace(stored, session);
  return {
    session,
    workspace,
    view: setupIsComplete(workspace.setup) ? 'dashboard' : 'setup',
  };
}

export function JourneyProvider({ children }) {
  const [platform, setPlatform] = useState(initialState);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!platform.session?.email || !platform.workspace) return undefined;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () =>
        saveWorkspace(
          userIdFromEmail(platform.session.email),
          platform.workspace,
        ),
      400,
    );
    return () => clearTimeout(timerRef.current);
  }, [platform.session, platform.workspace]);

  const login = useCallback((profile) => {
    const session = {
      id: userIdFromEmail(profile.email),
      email: userIdFromEmail(profile.email),
      name: String(profile.name ?? '').trim() || profile.email.split('@')[0],
      picture: profile.picture ?? null,
      provider: 'google-mock',
    };
    saveSession(session);

    const stored = loadWorkspace(session.id);
    const legacy = stored ? null : loadJourney();
    const workspace = stored
      ? mergeWorkspace(stored, session)
      : createWorkspace(session, legacy);
    if (legacy) clearJourney();

    setPlatform({
      session,
      workspace,
      view: setupIsComplete(workspace.setup) ? 'dashboard' : 'setup',
    });
  }, []);

  const logout = useCallback(() => {
    setPlatform((current) => {
      if (current.session?.email && current.workspace) {
        saveWorkspace(
          userIdFromEmail(current.session.email),
          current.workspace,
        );
      }
      return { session: null, workspace: null, view: 'login' };
    });
    clearSession();
  }, []);

  const dispatch = useCallback((action) => {
    setPlatform((current) => {
      if (!current.workspace) return current;

      if (action.type === 'updateProduct') {
        const setup = {
          ...current.workspace.setup,
          [action.field]: action.value,
        };
        const initiatives = current.workspace.initiatives.map((initiative) => {
          const updated = journeyReducer(
            { ...initiative, product: current.workspace.setup },
            action,
          );
          return { ...updated, product: setup };
        });
        return {
          ...current,
          workspace: {
            ...current.workspace,
            setup,
            initiatives,
            updatedAt: new Date().toISOString(),
          },
        };
      }

      const index = current.workspace.initiatives.findIndex(
        (initiative) => initiative.id === current.workspace.activeInitiativeId,
      );
      if (index < 0) return current;

      const initiatives = [...current.workspace.initiatives];
      const source = {
        ...initiatives[index],
        product: current.workspace.setup,
      };
      initiatives[index] = {
        ...journeyReducer(source, action),
        product: current.workspace.setup,
      };

      return {
        ...current,
        workspace: {
          ...current.workspace,
          initiatives,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const completeSetup = useCallback(() => {
    setPlatform((current) => ({
      ...current,
      view: 'dashboard',
      workspace: {
        ...current.workspace,
        setupCompletedAt:
          current.workspace.setupCompletedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const editSetup = useCallback(() => {
    setPlatform((current) => ({ ...current, view: 'setup' }));
  }, []);

  const createInitiative = useCallback(() => {
    setPlatform((current) => {
      const initiative = createInitiativeForWorkspace(current.workspace);
      return {
        ...current,
        view: 'journey',
        workspace: {
          ...current.workspace,
          initiatives: [...current.workspace.initiatives, initiative],
          activeInitiativeId: initiative.id,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const openInitiative = useCallback((initiativeId) => {
    setPlatform((current) => ({
      ...current,
      view: 'journey',
      workspace: {
        ...current.workspace,
        activeInitiativeId: initiativeId,
      },
    }));
  }, []);

  const goDashboard = useCallback(() => {
    setPlatform((current) => ({ ...current, view: 'dashboard' }));
  }, []);

  const journey = useMemo(
    () => activeJourney(platform.workspace),
    [platform.workspace],
  );
  const value = useMemo(
    () => ({
      session: platform.session,
      workspace: platform.workspace,
      view: platform.view,
      journey,
      dispatch,
      login,
      logout,
      completeSetup,
      editSetup,
      createInitiative,
      openInitiative,
      goDashboard,
      setupComplete: setupIsComplete(platform.workspace?.setup),
    }),
    [
      platform,
      journey,
      dispatch,
      login,
      logout,
      completeSetup,
      editSetup,
      createInitiative,
      openInitiative,
      goDashboard,
    ],
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourney precisa estar dentro de JourneyProvider.');
  }
  return context;
}
