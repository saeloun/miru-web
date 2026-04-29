export const TIMER_STORAGE_KEY = "miru_timer_state";
export const TIMER_SYNC_EVENT = "miru:timer-sync";
export const TIMER_DECK_VERSION = 2;

export interface StoredTimerState {
  id: string;
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
  project: string;
  client: string;
  description: string;
  projectId: number;
}

export interface StoredTimerDeck {
  activeTimerId: string;
  syncedAt?: string | null;
  timers: StoredTimerState[];
  version: typeof TIMER_DECK_VERSION;
}

export interface DesktopCurrentTimer {
  billable?: boolean;
  elapsed_ms?: number;
  notes?: string;
  project_name?: string;
  running?: boolean;
  source?: string | null;
  started_at?: string | null;
  synced_at?: string | null;
  task_name?: string;
  timer_deck?: Partial<StoredTimerDeck> | null;
}

const DEFAULT_TIMER_ID = "default";

const generateTimerId = () => {
  if (globalThis.crypto && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `timer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const defaultTimerState = (): StoredTimerState => ({
  id: DEFAULT_TIMER_ID,
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
  project: "",
  client: "",
  description: "",
  projectId: 0,
});

export const emptyTimerDeck = (): StoredTimerDeck => ({
  activeTimerId: DEFAULT_TIMER_ID,
  timers: [defaultTimerState()],
  version: TIMER_DECK_VERSION,
});

const dispatchTimerSync = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TIMER_SYNC_EVENT));
  }
};

export const createTimerState = (): StoredTimerState => ({
  ...defaultTimerState(),
  id: generateTimerId(),
});

export const timerHasWork = (timer: StoredTimerState) =>
  Boolean(
    timer.isRunning ||
      timer.elapsedTime > 0 ||
      timer.project ||
      timer.client ||
      timer.description ||
      timer.projectId
  );

export const timerElapsedMs = (
  timer: StoredTimerState,
  now = Date.now()
): number => {
  if (!timer.isRunning || !timer.startTime) {
    return Math.max(timer.elapsedTime || 0, 0);
  }

  return Math.max(now - timer.startTime, 0);
};

export const pauseRunningTimers = (
  timers: StoredTimerState[],
  now = Date.now(),
  exceptTimerId?: string
) =>
  timers.map(timer => {
    if (!timer.isRunning || timer.id === exceptTimerId) {
      return timer;
    }

    return {
      ...timer,
      elapsedTime: timerElapsedMs(timer, now),
      isRunning: false,
      startTime: null,
    };
  });

export const formatTimerDuration = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const normalizeTimer = (timer: Partial<StoredTimerState>): StoredTimerState => {
  const normalized = {
    ...defaultTimerState(),
    ...timer,
    id: timer.id || generateTimerId(),
  };

  return {
    ...normalized,
    startTime:
      normalized.isRunning && normalized.startTime
        ? normalized.startTime
        : normalized.isRunning
        ? Date.now() - (normalized.elapsedTime || 0)
        : null,
  };
};

export const normalizeTimerDeck = (parsed: any): StoredTimerDeck => {
  if (Array.isArray(parsed?.timers)) {
    const timers = parsed.timers.map(normalizeTimer);
    const activeTimerId = timers.some(
      timer => timer.id === parsed.activeTimerId
    )
      ? parsed.activeTimerId
      : timers[0]?.id || DEFAULT_TIMER_ID;

    return {
      activeTimerId,
      syncedAt: parsed.syncedAt || parsed.synced_at || null,
      timers: timers.length ? timers : [defaultTimerState()],
      version: TIMER_DECK_VERSION,
    };
  }

  const migratedTimer = normalizeTimer(parsed || {});

  return {
    activeTimerId: migratedTimer.id,
    syncedAt: parsed?.syncedAt || parsed?.synced_at || null,
    timers: [migratedTimer],
    version: TIMER_DECK_VERSION,
  };
};

export const loadStoredTimerDeck = (): StoredTimerDeck => {
  if (typeof window === "undefined") {
    return emptyTimerDeck();
  }

  const saved = localStorage.getItem(TIMER_STORAGE_KEY);
  if (!saved) {
    return emptyTimerDeck();
  }

  try {
    return normalizeTimerDeck(JSON.parse(saved));
  } catch {
    return emptyTimerDeck();
  }
};

export const loadStoredTimerState = (): StoredTimerState => {
  const deck = loadStoredTimerDeck();

  return (
    deck.timers.find(timer => timer.id === deck.activeTimerId) ||
    deck.timers[0] ||
    defaultTimerState()
  );
};

export const persistTimerDeck = (deck: StoredTimerDeck) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    TIMER_STORAGE_KEY,
    JSON.stringify({
      ...deck,
      syncedAt: new Date().toISOString(),
    })
  );
  dispatchTimerSync();
};

export const persistTimerState = (timer: StoredTimerState) => {
  const deck = loadStoredTimerDeck();
  const timers = deck.timers.some(
    existingTimer => existingTimer.id === timer.id
  )
    ? deck.timers.map(existingTimer =>
        existingTimer.id === timer.id ? timer : existingTimer
      )
    : [...deck.timers, timer];

  persistTimerDeck({
    activeTimerId: timer.id,
    syncedAt: new Date().toISOString(),
    timers,
    version: TIMER_DECK_VERSION,
  });
};

export const clearStoredTimerState = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TIMER_STORAGE_KEY);
  dispatchTimerSync();
};

export const startTimerFromEntry = ({
  client,
  project,
  description,
  projectId,
}: {
  client: string;
  project: string;
  description?: string;
  projectId: number;
}) => {
  const startedAt = Date.now();
  const currentDeck = loadStoredTimerDeck();
  const pausedTimers = pauseRunningTimers(
    currentDeck.timers.filter(timerHasWork),
    startedAt
  );

  const timer = {
    id: generateTimerId(),
    isRunning: true,
    startTime: startedAt,
    elapsedTime: 0,
    client,
    project,
    description: description || "",
    projectId,
  };

  persistTimerDeck({
    activeTimerId: timer.id,
    syncedAt: new Date().toISOString(),
    timers: [...pausedTimers, timer],
    version: TIMER_DECK_VERSION,
  });
};

export const timerDeckHasWork = (deck: StoredTimerDeck) =>
  deck.timers.some(timerHasWork);

const parseDesktopStartTime = (value?: string | null) => {
  if (!value) return null;

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? null : parsed;
};

export const timerDeckFromDesktopCurrentTimer = (
  currentTimer?: DesktopCurrentTimer | null
): StoredTimerDeck => {
  if (!currentTimer) return emptyTimerDeck();

  if (currentTimer.timer_deck) {
    return normalizeTimerDeck({
      ...currentTimer.timer_deck,
      syncedAt: currentTimer.synced_at || currentTimer.timer_deck.syncedAt,
    });
  }

  const timer = normalizeTimer({
    client: "",
    description: currentTimer.notes || currentTimer.task_name || "",
    elapsedTime: Math.max(currentTimer.elapsed_ms || 0, 0),
    id: "desktop-current",
    isRunning: Boolean(currentTimer.running),
    project: currentTimer.project_name || "",
    projectId: 0,
    startTime: parseDesktopStartTime(currentTimer.started_at),
  });

  return {
    activeTimerId: timer.id,
    syncedAt: currentTimer.synced_at || null,
    timers: [timer],
    version: TIMER_DECK_VERSION,
  };
};

export const shouldAdoptRemoteTimerDeck = (
  remoteDeck: StoredTimerDeck,
  localDeck: StoredTimerDeck
) => {
  if (!timerDeckHasWork(remoteDeck)) return false;

  if (!timerDeckHasWork(localDeck)) return true;

  const remoteSyncedAt = Date.parse(remoteDeck.syncedAt || "");
  const localSyncedAt = Date.parse(localDeck.syncedAt || "");

  if (Number.isNaN(remoteSyncedAt)) return false;

  if (Number.isNaN(localSyncedAt)) return true;

  return remoteSyncedAt > localSyncedAt;
};

export const currentTimerFromTimerDeck = (
  deck: StoredTimerDeck
): DesktopCurrentTimer => {
  const activeTimer =
    deck.timers.find(timer => timer.id === deck.activeTimerId) ||
    deck.timers[0] ||
    defaultTimerState();
  const elapsedMs = timerElapsedMs(activeTimer);
  const syncedAt = new Date().toISOString();

  return {
    billable: false,
    elapsed_ms: elapsedMs,
    notes: activeTimer.description,
    project_name: activeTimer.project,
    running: activeTimer.isRunning,
    source: "web",
    started_at:
      activeTimer.isRunning && activeTimer.startTime
        ? new Date(activeTimer.startTime).toISOString()
        : null,
    synced_at: syncedAt,
    task_name: activeTimer.description,
    timer_deck: {
      ...deck,
      syncedAt,
      timers: deck.timers.map(timer => ({
        ...timer,
        elapsedTime: timerElapsedMs(timer),
      })),
      version: TIMER_DECK_VERSION,
    },
  };
};
