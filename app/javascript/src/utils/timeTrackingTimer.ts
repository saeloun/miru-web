export const TIMER_STORAGE_KEY = "miru_timer_state";
export const TIMER_SYNC_EVENT = "miru:timer-sync";

export interface StoredTimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
  project: string;
  client: string;
  description: string;
  projectId: number;
}

export const defaultTimerState = (): StoredTimerState => ({
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
  project: "",
  client: "",
  description: "",
  projectId: 0,
});

const dispatchTimerSync = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TIMER_SYNC_EVENT));
  }
};

export const loadStoredTimerState = (): StoredTimerState => {
  if (typeof window === "undefined") return defaultTimerState();

  const saved = localStorage.getItem(TIMER_STORAGE_KEY);
  if (!saved) return defaultTimerState();

  try {
    const parsed = JSON.parse(saved);

    return {
      ...defaultTimerState(),
      ...parsed,
      startTime:
        parsed.isRunning && parsed.startTime
          ? parsed.startTime
          : parsed.isRunning
          ? Date.now() - (parsed.elapsedTime || 0)
          : null,
    };
  } catch {
    return defaultTimerState();
  }
};

export const persistTimerState = (timer: StoredTimerState) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
  dispatchTimerSync();
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

  persistTimerState({
    isRunning: true,
    startTime: startedAt,
    elapsedTime: 0,
    client,
    project,
    description: description || "",
    projectId,
  });
};
