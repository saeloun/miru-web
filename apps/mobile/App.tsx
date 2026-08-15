import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  fetchBootstrap,
  fetchCurrentTimer,
  fetchTimeTracking,
  fetchWorkspaces,
  login,
  selectWorkspace,
  updateCurrentTimer,
} from "./src/api";
import { apiBaseUrl } from "./src/config";
import type {
  CurrentTimer,
  MobileBootstrapResponse,
  TimeTrackingResponse,
  Workspace,
} from "./src/types";

const tabs = ["Today", "Week", "Activity", "More"] as const;

type Tab = (typeof tabs)[number];

const SESSION_STORAGE_KEY = "miru-mobile-session";

type StoredSession = {
  email: string;
  token: string;
  workspaceId: number;
};

const demoSession: MobileBootstrapResponse = {
  companyRole: "owner",
  company: {
    id: 1,
    name: "Miru Labs",
    dateFormat: "YYYY-MM-DD",
    planTier: "free",
  },
  user: {
    id: 1,
    email: "vipul@miru.so",
    firstName: "Vipul",
    lastName: "Amler",
    currentWorkspaceId: 1,
    token: "demo-token",
    avatarUrl: null,
    confirmed: true,
  },
  capabilities: {
    time_tracking: true,
    projects: true,
    expenses: true,
    invoices: true,
  },
  workspace: {
    id: 1,
    name: "Miru Labs",
    baseCurrency: "USD",
    dateFormat: "YYYY-MM-DD",
  },
};

const demoWorkspaces: Workspace[] = [
  { id: 1, name: "Miru Labs" },
  { id: 2, name: "Client Ops" },
];

const demoTimeTracking: TimeTrackingResponse = {
  entries: {
    "2026-03-23": [
      {
        id: 101,
        type: "timesheet",
        project: "Miru Mobile",
        client: "Miru",
        duration: 95,
        note: "Outlined Expo v1 scope and mobile auth contract",
        workDate: "2026-03-23",
        billStatus: "non_billable",
        source: "manual",
        sourceLabel: "Manual",
      },
    ],
    "2026-03-24": [
      {
        id: 102,
        type: "timesheet",
        project: "Miru Mobile",
        client: "Miru",
        duration: 140,
        note: "Built Today and Week summaries for the Expo shell",
        workDate: "2026-03-24",
        billStatus: "non_billable",
        source: "automation",
        sourceLabel: "Codex via Automation",
      },
      {
        id: 103,
        type: "timesheet",
        project: "AI Time Tracking",
        client: "Miru",
        duration: 45,
        note: "Tested MCP source metadata rendering",
        workDate: "2026-03-24",
        billStatus: "non_billable",
        source: "mcp",
        sourceLabel: "Github via MCP",
      },
    ],
    "2026-03-26": [
      {
        id: 104,
        type: "timesheet",
        project: "Client Billing",
        client: "Acme Co",
        duration: 60,
        note: "Reviewed invoice ordering regression on production",
        workDate: "2026-03-26",
        billStatus: "unbilled",
        source: "cli",
        sourceLabel: "CLI",
      },
    ],
    "2026-03-27": [
      {
        id: 105,
        type: "timesheet",
        project: "Miru Mobile",
        client: "Miru",
        duration: 180,
        note: "Hooked Expo shell to workspaces and time-tracking bootstrap",
        workDate: "2026-03-27",
        billStatus: "non_billable",
        source: "manual",
        sourceLabel: "Manual",
      },
      {
        id: 106,
        type: "timesheet",
        project: "Miru Mobile",
        client: "Miru",
        duration: 75,
        note: "Polished demo mode for responsive browser verification",
        workDate: "2026-03-27",
        billStatus: "non_billable",
        source: "automation",
        sourceLabel: "Codex via Automation",
      },
    ],
  },
};

const demoCurrentTimer: CurrentTimer = {
  billable: false,
  elapsed_ms: 0,
  notes: "",
  project_name: "",
  running: false,
  started_at: null,
  synced_at: null,
  task_name: "",
  timer_deck: null,
};

async function fetchAppData(email: string, token: string) {
  const [session, workspaces, timeTracking, currentTimer] = await Promise.all([
    fetchBootstrap(email, token),
    fetchWorkspaces(email, token),
    fetchTimeTracking(email, token),
    fetchCurrentTimer(email, token),
  ]);

  return { currentTimer, session, timeTracking, workspaces };
}

function parseStoredSession(value: string | null): StoredSession | null {
  if (!value) return null;

  try {
    const stored = JSON.parse(value) as Partial<StoredSession>;
    if (
      typeof stored.email !== "string" ||
      typeof stored.token !== "string" ||
      typeof stored.workspaceId !== "number"
    ) {
      return null;
    }

    return stored as StoredSession;
  } catch {
    return null;
  }
}

function persistSession(session: MobileBootstrapResponse) {
  const workspace = session.workspace;
  if (!workspace) return Promise.resolve();

  return SecureStore.isAvailableAsync().then(available => {
    if (!available) return;

    return SecureStore.setItemAsync(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        email: session.user.email,
        token: session.user.token,
        workspaceId: workspace.id,
      } satisfies StoredSession)
    );
  });
}

async function storedSession() {
  if (!(await SecureStore.isAvailableAsync())) return null;

  return parseStoredSession(
    await SecureStore.getItemAsync(SESSION_STORAGE_KEY)
  );
}

async function clearStoredSession() {
  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("Today");
  const [email, setEmail] = useState("vipul@saeloun.com");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<MobileBootstrapResponse | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [timeTracking, setTimeTracking] = useState<TimeTrackingResponse | null>(
    null
  );
  const [currentTimer, setCurrentTimer] = useState<CurrentTimer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [timerUpdating, setTimerUpdating] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const stored = await storedSession();
        if (!stored) return;

        await selectWorkspace(stored.email, stored.token, stored.workspaceId);
        const data = await fetchAppData(stored.email, stored.token);
        if (!active) return;

        setSession(data.session);
        setWorkspaces(data.workspaces);
        setTimeTracking(data.timeTracking);
        setCurrentTimer(data.currentTimer);
        await persistSession(data.session);
      } catch {
        await clearStoredSession();
      } finally {
        if (active) setRestoring(false);
      }
    };

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!currentTimer?.running) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, [currentTimer?.running]);

  const fullName = useMemo(() => {
    if (!session) return "";

    return [session.user.firstName, session.user.lastName]
      .filter(Boolean)
      .join(" ");
  }, [session]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const credentials = await login(email.trim(), password);
      const data = await fetchAppData(
        credentials.user.email,
        credentials.user.token
      );
      await persistSession(data.session);
      setSession(data.session);
      setWorkspaces(data.workspaces);
      setTimeTracking(data.timeTracking);
      setCurrentTimer(data.currentTimer);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Unable to sign in"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPreview = () => {
    setError(null);
    setSession(demoSession);
    setWorkspaces(demoWorkspaces);
    setTimeTracking(demoTimeTracking);
    setCurrentTimer(demoCurrentTimer);
    setActiveTab("Today");
  };

  const handleWorkspaceSelect = async (workspaceId: number) => {
    if (!session || session.workspace?.id === workspaceId) return;

    setLoading(true);
    setError(null);

    try {
      await selectWorkspace(
        session.user.email,
        session.user.token,
        workspaceId
      );
      const data = await fetchAppData(session.user.email, session.user.token);
      await persistSession(data.session);
      setSession(data.session);
      setWorkspaces(data.workspaces);
      setTimeTracking(data.timeTracking);
      setCurrentTimer(data.currentTimer);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to switch workspace"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearStoredSession();
    setSession(null);
    setWorkspaces([]);
    setTimeTracking(null);
    setCurrentTimer(null);
    setPassword("");
    setActiveTab("Today");
  };

  const elapsedMs = useMemo(() => {
    if (!currentTimer) return 0;
    if (!currentTimer.running || !currentTimer.started_at) {
      return currentTimer.elapsed_ms;
    }

    const startedAt = Date.parse(currentTimer.started_at);
    if (Number.isNaN(startedAt)) return currentTimer.elapsed_ms;

    return currentTimer.elapsed_ms + Math.max(now - startedAt, 0);
  }, [currentTimer, now]);

  const handleTimerToggle = async () => {
    if (!session || !currentTimer) return;

    setTimerUpdating(true);
    setError(null);

    try {
      const timestamp = new Date().toISOString();
      const nextTimer = await updateCurrentTimer(
        session.user.email,
        session.user.token,
        {
          ...currentTimer,
          elapsed_ms: currentTimer.running
            ? elapsedMs
            : currentTimer.elapsed_ms,
          running: !currentTimer.running,
          source: "miru-mobile",
          started_at: currentTimer.running ? null : timestamp,
          synced_at: timestamp,
        }
      );
      setCurrentTimer(nextTimer);
      setNow(Date.now());
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to update timer"
      );
    } finally {
      setTimerUpdating(false);
    }
  };

  const dayKeys = useMemo(() => {
    if (!timeTracking) return [];

    return Object.keys(timeTracking.entries || {}).sort(
      (left, right) =>
        dateFromKey(left).getTime() - dateFromKey(right).getTime()
    );
  }, [timeTracking]);

  const allEntries = useMemo(() => {
    if (!timeTracking) return [];

    return dayKeys.flatMap(key => timeTracking.entries?.[key] || []);
  }, [dayKeys, timeTracking]);

  const todayKey = useMemo(() => {
    const currentDateKey = formatDateKey(new Date());

    if (timeTracking?.entries?.[currentDateKey]?.length) return currentDateKey;

    return dayKeys[dayKeys.length - 1];
  }, [dayKeys, timeTracking]);

  const todayEntries = useMemo(() => {
    if (!timeTracking || !todayKey) return [];

    return timeTracking.entries?.[todayKey] || [];
  }, [timeTracking, todayKey]);

  const weekDays = useMemo(() => {
    const anchorDate = todayKey ? dateFromKey(todayKey) : new Date();
    const weekStart = startOfWeek(anchorDate);

    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      const key = formatDateKey(date);
      const entries = timeTracking?.entries?.[key] || [];

      return {
        date,
        key,
        entries,
        totalMinutes: entries.reduce((sum, entry) => sum + entry.duration, 0),
      };
    });
  }, [timeTracking, todayKey]);

  const weekTotalMinutes = useMemo(() => {
    return weekDays.reduce((sum, day) => sum + day.totalMinutes, 0);
  }, [weekDays]);

  const topProjectToday = useMemo(() => {
    const counts = new Map<string, number>();

    todayEntries.forEach(entry => {
      const label = entry.project || entry.client || entry.type;
      counts.set(label, (counts.get(label) || 0) + entry.duration);
    });

    return Array.from(counts.entries()).sort(
      (left, right) => right[1] - left[1]
    )[0]?.[0];
  }, [todayEntries]);

  const sourceGroups = useMemo(() => {
    const grouped = new Map<string, number>();

    allEntries.forEach(entry => {
      const label = entry.sourceLabel || entry.source || "Manual";
      grouped.set(label, (grouped.get(label) || 0) + 1);
    });

    return Array.from(grouped.entries()).sort(
      (left, right) => right[1] - left[1]
    );
  }, [allEntries]);

  const latestEntries = useMemo(() => {
    return [...allEntries]
      .sort((left, right) => {
        const leftValue = dateFromKey(
          left.workDate ||
            left.leaveDate ||
            todayKey ||
            formatDateKey(new Date())
        ).getTime();
        const rightValue = dateFromKey(
          right.workDate ||
            right.leaveDate ||
            todayKey ||
            formatDateKey(new Date())
        ).getTime();
        return rightValue - leftValue;
      })
      .slice(0, 6);
  }, [allEntries, todayKey]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Miru Mobile</Text>
          <Text style={styles.title}>Capture work anywhere</Text>
          <Text style={styles.subtitle}>
            Expo app for mobile-first time tracking. Web stays the control
            center.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {restoring ? (
          <View style={styles.card}>
            <ActivityIndicator color="#67e8f9" />
            <Text style={styles.loadingText}>Restoring session</Text>
          </View>
        ) : !session ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardBody}>
              This uses the new `miru-mobile` auth contract against {apiBaseUrl}
              .
            </Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@company.com"
                placeholderTextColor="#64748b"
                style={styles.input}
                value={email}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#64748b"
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable
              disabled={loading || !email || !password}
              onPress={handleSignIn}
              style={styles.primaryButton}
            >
              {loading ? (
                <ActivityIndicator color="#020617" />
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
              )}
            </Pressable>
            <Pressable
              onPress={handleDemoPreview}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Preview demo</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Signed in</Text>
              <Text style={styles.cardBody}>
                {fullName || session.user.email} ·{" "}
                {session.company?.name || "No workspace"}
              </Text>
              <Text style={styles.metaText}>
                Role: {session.companyRole || "unknown"}
              </Text>
              <Text style={styles.metaText}>
                Workspaces: {workspaces.length}
              </Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.tabRow}>
              {tabs.map(tab => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tab, tab === activeTab && styles.tabActive]}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      tab === activeTab && styles.tabLabelActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              ))}
            </View>

            {activeTab === "Today" ? (
              <>
                <View style={styles.timerCard}>
                  <Text style={styles.heroEyebrow}>
                    {currentTimer?.running ? "Timer running" : "Timer stopped"}
                  </Text>
                  <Text style={styles.timerElapsed}>
                    {formatElapsed(elapsedMs)}
                  </Text>
                  <Text style={styles.cardBody}>
                    {currentTimer?.project_name ||
                      currentTimer?.task_name ||
                      "Ready to track work"}
                  </Text>
                  <Pressable
                    disabled={timerUpdating || !currentTimer}
                    onPress={handleTimerToggle}
                    style={styles.primaryButton}
                  >
                    {timerUpdating ? (
                      <ActivityIndicator color="#020617" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {currentTimer?.running ? "Stop timer" : "Start timer"}
                      </Text>
                    )}
                  </Pressable>
                </View>

                <View style={styles.heroCard}>
                  <Text style={styles.heroEyebrow}>Today</Text>
                  <Text style={styles.heroTitle}>
                    {todayKey ? formatLongDate(todayKey) : "No entries yet"}
                  </Text>
                  <Text style={styles.cardBody}>
                    {todayEntries.length > 0
                      ? `${todayEntries.length} entries loaded. ${
                          topProjectToday
                            ? `${topProjectToday} leads the day.`
                            : "Ready for the next log."
                        }`
                      : "No entries loaded for today yet. This is where the timer and quick capture flow will live."}
                  </Text>
                  <View style={styles.statGrid}>
                    <MetricCard
                      label="Today"
                      value={formatMinutes(
                        todayEntries.reduce(
                          (sum, entry) => sum + entry.duration,
                          0
                        )
                      )}
                    />
                    <MetricCard
                      label="Entries"
                      value={`${todayEntries.length}`}
                    />
                    <MetricCard
                      label="Week"
                      value={formatMinutes(weekTotalMinutes)}
                    />
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Latest entries</Text>
                  {latestEntries.length > 0 ? (
                    latestEntries.map(entry => (
                      <EntryRow key={entry.id} entry={entry} />
                    ))
                  ) : (
                    <Text style={styles.cardBody}>
                      Once entries exist, the newest work shows up here first.
                    </Text>
                  )}
                </View>
              </>
            ) : null}

            {activeTab === "Week" ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>This week</Text>
                <Text style={styles.cardBody}>{formatWeekRange(weekDays)}</Text>
                <View style={styles.weekList}>
                  {weekDays.map(day => (
                    <View key={day.key} style={styles.weekDayCard}>
                      <View>
                        <Text style={styles.weekDayLabel}>
                          {formatWeekday(day.date)}
                        </Text>
                        <Text style={styles.weekDayDate}>
                          {formatShortDate(day.key)}
                        </Text>
                      </View>
                      <View style={styles.weekDayTotals}>
                        <Text style={styles.weekDayHours}>
                          {formatMinutes(day.totalMinutes)}
                        </Text>
                        <Text style={styles.weekDayEntries}>
                          {day.entries.length} entries
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {activeTab === "Activity" ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Capture sources</Text>
                  <Text style={styles.cardBody}>
                    Miru can already surface CLI, MCP, and automation metadata
                    in entries.
                  </Text>
                  <View style={styles.badgeWrap}>
                    {sourceGroups.map(([label, count]) => (
                      <View key={label} style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {label} · {count}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Recent activity</Text>
                  {latestEntries.length > 0 ? (
                    latestEntries.map(entry => (
                      <EntryRow key={`activity-${entry.id}`} entry={entry} />
                    ))
                  ) : (
                    <Text style={styles.cardBody}>
                      Recent activity will appear here after the first synced
                      entry.
                    </Text>
                  )}
                </View>
              </>
            ) : null}

            {activeTab === "More" ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Workspace switcher</Text>
                  {workspaces.map(workspace => (
                    <Pressable
                      disabled={loading}
                      key={workspace.id}
                      onPress={() => handleWorkspaceSelect(workspace.id)}
                      style={styles.workspaceRow}
                    >
                      <Text style={styles.workspaceName}>{workspace.name}</Text>
                      <Text style={styles.workspaceMeta}>
                        {session.workspace?.id === workspace.id
                          ? "Selected"
                          : `#${workspace.id}`}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Account</Text>
                  <Text style={styles.cardBody}>{session.user.email}</Text>
                  <Text style={styles.metaText}>
                    Workspace:{" "}
                    {session.workspace?.name || session.company?.name || "None"}
                  </Text>
                  <Text style={styles.metaText}>
                    Role: {session.companyRole || "unknown"}
                  </Text>
                  <Text style={styles.metaText}>
                    Currency:{" "}
                    {session.workspace?.baseCurrency ||
                      session.company?.baseCurrency ||
                      "unknown"}
                  </Text>
                  <Text style={styles.capabilityTitle}>Capabilities</Text>
                  <View style={styles.badgeWrap}>
                    {Object.entries(session.capabilities)
                      .filter(([, enabled]) => enabled)
                      .map(([capability]) => (
                        <View key={capability} style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {capability.replaceAll("_", " ")}
                          </Text>
                        </View>
                      ))}
                  </View>
                  <Pressable
                    onPress={handleLogout}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>Log out</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function EntryRow({
  entry,
}: {
  entry: NonNullable<TimeTrackingResponse["entries"]>[string][number];
}) {
  return (
    <View style={styles.workspaceRow}>
      <View style={styles.entryCopy}>
        <Text style={styles.workspaceName}>
          {entry.project || entry.client || entry.type}
        </Text>
        <Text style={styles.entryMeta}>
          {entry.note || entry.sourceLabel || "No note"}
        </Text>
      </View>
      <View style={styles.entryRight}>
        <Text style={styles.workspaceMeta}>
          {formatMinutes(entry.duration)}
        </Text>
        <Text style={styles.entryDate}>
          {formatShortDate(entry.workDate || entry.leaveDate)}
        </Text>
      </View>
    </View>
  );
}

function formatMinutes(minutes: number) {
  if (!minutes) return "0m";

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (!hours) return `${remainder}m`;
  if (!remainder) return `${hours}h`;

  return `${hours}h ${remainder}m`;
}

function formatElapsed(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(value => value.toString().padStart(2, "0"))
    .join(":");
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateFromKey(key: string) {
  return new Date(`${key}T00:00:00`);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function formatLongDate(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    weekday: "long",
  }).format(dateFromKey(value));
}

function formatShortDate(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(dateFromKey(value));
}

function formatWeekday(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(value);
}

function formatWeekRange(weekDays: Array<{ date: Date }>) {
  if (!weekDays.length) return "";

  const firstDay = weekDays[0].date;
  const lastDay = weekDays[weekDays.length - 1].date;

  return `${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(firstDay)} - ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(lastDay)}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  eyebrow: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  tab: {
    backgroundColor: "#111827",
    borderColor: "#1f2937",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  tabActive: {
    backgroundColor: "#164e63",
    borderColor: "#22d3ee",
  },
  tabLabel: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#ecfeff",
  },
  content: {
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  formGroup: {
    gap: 8,
    marginTop: 16,
  },
  label: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#020617",
    borderColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    color: "#f8fafc",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: "#0f172a",
    borderColor: "#1e293b",
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  timerCard: {
    backgroundColor: "#0f172a",
    borderColor: "#22d3ee",
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  timerElapsed: {
    color: "#ecfeff",
    fontSize: 36,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    marginVertical: 8,
  },
  heroCard: {
    backgroundColor: "#083344",
    borderColor: "#22d3ee",
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  heroEyebrow: {
    color: "#a5f3fc",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#ecfeff",
    fontSize: 24,
    fontWeight: "700",
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardBody: {
    color: "#94a3b8",
    fontSize: 15,
    lineHeight: 22,
  },
  metaText: {
    color: "#67e8f9",
    fontSize: 13,
    marginTop: 10,
  },
  capabilityTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 18,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 14,
    marginTop: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#67e8f9",
    borderRadius: 16,
    marginTop: 18,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#020617",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#155e75",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: "#67e8f9",
    fontSize: 15,
    fontWeight: "700",
  },
  workspaceRow: {
    alignItems: "center",
    borderTopColor: "#1e293b",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 14,
  },
  workspaceName: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "600",
  },
  entryCopy: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  entryMeta: {
    color: "#94a3b8",
    fontSize: 13,
  },
  entryRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  entryDate: {
    color: "#64748b",
    fontSize: 12,
  },
  workspaceMeta: {
    color: "#94a3b8",
    fontSize: 13,
  },
  statGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  metricCard: {
    backgroundColor: "#0f172a",
    borderColor: "#155e75",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    padding: 14,
  },
  metricLabel: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  weekList: {
    gap: 10,
    marginTop: 12,
  },
  weekDayCard: {
    alignItems: "center",
    backgroundColor: "#020617",
    borderColor: "#1e293b",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  weekDayLabel: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "700",
  },
  weekDayDate: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4,
  },
  weekDayTotals: {
    alignItems: "flex-end",
    gap: 4,
  },
  weekDayHours: {
    color: "#ecfeff",
    fontSize: 16,
    fontWeight: "700",
  },
  weekDayEntries: {
    color: "#67e8f9",
    fontSize: 12,
  },
  badgeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  badge: {
    backgroundColor: "#111827",
    borderColor: "#1f2937",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  badgeText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "600",
  },
});
