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
  timers: StoredTimerState[];
  version: typeof TIMER_DECK_VERSION;
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

const normalizeTimerDeck = (parsed: any): StoredTimerDeck => {
  if (Array.isArray(parsed?.timers)) {
    const timers = parsed.timers.map(normalizeTimer);
    const activeTimerId = timers.some(
      timer => timer.id === parsed.activeTimerId
    )
      ? parsed.activeTimerId
      : timers[0]?.id || DEFAULT_TIMER_ID;

    return {
      activeTimerId,
      timers: timers.length ? timers : [defaultTimerState()],
      version: TIMER_DECK_VERSION,
    };
  }

  const migratedTimer = normalizeTimer(parsed || {});

  return {
    activeTimerId: migratedTimer.id,
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

  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(deck));
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
    timers: [...pausedTimers, timer],
    version: TIMER_DECK_VERSION,
  });
};
