import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
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
import { fetchTimeTracking, fetchWorkspaces, login } from "./src/api";
import { apiBaseUrl } from "./src/config";
import type { MobileLoginResponse, TimeTrackingResponse, Workspace } from "./src/types";

const tabs = ["Today", "Week", "Activity", "More"] as const;

type Tab = (typeof tabs)[number];

const demoSession: MobileLoginResponse = {
  notice: "Signed in successfully",
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

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("Today");
  const [email, setEmail] = useState("vipul@saeloun.com");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<MobileLoginResponse | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [timeTracking, setTimeTracking] = useState<TimeTrackingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fullName = useMemo(() => {
    if (!session) return "";

    return [session.user.firstName, session.user.lastName].filter(Boolean).join(" ");
  }, [session]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const nextSession = await login(email.trim(), password);
      const [nextWorkspaces, nextTimeTracking] = await Promise.all([
        fetchWorkspaces(nextSession.user.email, nextSession.user.token),
        fetchTimeTracking(nextSession.user.email, nextSession.user.token),
      ]);
      setSession(nextSession);
      setWorkspaces(nextWorkspaces);
      setTimeTracking(nextTimeTracking);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPreview = () => {
    setError(null);
    setSession(demoSession);
    setWorkspaces(demoWorkspaces);
    setTimeTracking(demoTimeTracking);
    setActiveTab("Today");
  };

  const dayKeys = useMemo(() => {
    if (!timeTracking) return [];

    return Object.keys(timeTracking.entries || {}).sort((left, right) => dateFromKey(left).getTime() - dateFromKey(right).getTime());
  }, [timeTracking]);

  const allEntries = useMemo(() => {
    if (!timeTracking) return [];

    return dayKeys.flatMap(key => timeTracking.entries?.[key] || []);
  }, [dayKeys, timeTracking]);

  const totalEntries = useMemo(() => {
    return allEntries.length;
  }, [allEntries]);

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

    return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0];
  }, [todayEntries]);

  const sourceGroups = useMemo(() => {
    const grouped = new Map<string, number>();

    allEntries.forEach(entry => {
      const label = entry.sourceLabel || entry.source || "Manual";
      grouped.set(label, (grouped.get(label) || 0) + 1);
    });

    return Array.from(grouped.entries()).sort((left, right) => right[1] - left[1]);
  }, [allEntries]);

  const latestEntries = useMemo(() => {
    return [...allEntries]
      .sort((left, right) => {
        const leftValue = dateFromKey(left.workDate || left.leaveDate || todayKey || formatDateKey(new Date())).getTime();
        const rightValue = dateFromKey(right.workDate || right.leaveDate || todayKey || formatDateKey(new Date())).getTime();
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
            Expo app for mobile-first time tracking. Web stays the control center.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!session ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardBody}>
              This uses the new `miru-mobile` auth contract against {apiBaseUrl}.
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
            <Pressable disabled={loading || !email || !password} onPress={handleSignIn} style={styles.primaryButton}>
              {loading ? <ActivityIndicator color="#020617" /> : <Text style={styles.primaryButtonText}>Continue</Text>}
            </Pressable>
            <Pressable onPress={handleDemoPreview} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Preview demo</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Signed in</Text>
              <Text style={styles.cardBody}>
                {fullName || session.user.email} · {session.company?.name || "No workspace"}
              </Text>
              <Text style={styles.metaText}>Role: {session.companyRole || "unknown"}</Text>
              <Text style={styles.metaText}>Workspaces: {workspaces.length}</Text>
            </View>

            <View style={styles.tabRow}>
              {tabs.map(tab => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tab, tab === activeTab && styles.tabActive]}
                >
                  <Text style={[styles.tabLabel, tab === activeTab && styles.tabLabelActive]}>{tab}</Text>
                </Pressable>
              ))}
            </View>

            {activeTab === "Today" ? (
              <>
                <View style={styles.heroCard}>
                  <Text style={styles.heroEyebrow}>Today</Text>
                  <Text style={styles.heroTitle}>{todayKey ? formatLongDate(todayKey) : "No entries yet"}</Text>
                  <Text style={styles.cardBody}>
                    {todayEntries.length > 0
                      ? `${todayEntries.length} entries loaded. ${
                          topProjectToday ? `${topProjectToday} leads the day.` : "Ready for the next log."
                        }`
                      : "No entries loaded for today yet. This is where the timer and quick capture flow will live."}
                  </Text>
                  <View style={styles.statGrid}>
                    <MetricCard label="Today" value={formatMinutes(todayEntries.reduce((sum, entry) => sum + entry.duration, 0))} />
                    <MetricCard label="Entries" value={`${todayEntries.length}`} />
                    <MetricCard label="Week" value={formatMinutes(weekTotalMinutes)} />
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Latest entries</Text>
                  {latestEntries.length > 0 ? (
                    latestEntries.map(entry => (
                      <EntryRow key={entry.id} entry={entry} />
                    ))
                  ) : (
                    <Text style={styles.cardBody}>Once entries exist, the newest work shows up here first.</Text>
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
                        <Text style={styles.weekDayLabel}>{formatWeekday(day.date)}</Text>
                        <Text style={styles.weekDayDate}>{formatShortDate(day.key)}</Text>
                      </View>
                      <View style={styles.weekDayTotals}>
                        <Text style={styles.weekDayHours}>{formatMinutes(day.totalMinutes)}</Text>
                        <Text style={styles.weekDayEntries}>{day.entries.length} entries</Text>
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
                  <Text style={styles.cardBody}>Miru can already surface CLI, MCP, and automation metadata in entries.</Text>
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
                    <Text style={styles.cardBody}>Recent activity will appear here after the first synced entry.</Text>
                  )}
                </View>
              </>
            ) : null}

            {activeTab === "More" ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Workspace switcher</Text>
                  {workspaces.map(workspace => (
                    <View key={workspace.id} style={styles.workspaceRow}>
                      <Text style={styles.workspaceName}>{workspace.name}</Text>
                      <Text style={styles.workspaceMeta}>#{workspace.id}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Profile</Text>
                  <Text style={styles.cardBody}>{session.user.email}</Text>
                  <Text style={styles.metaText}>Role: {session.companyRole || "unknown"}</Text>
                  <Text style={styles.metaText}>Entries loaded: {totalEntries}</Text>
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

function EntryRow({ entry }: { entry: NonNullable<TimeTrackingResponse["entries"]>[string][number] }) {
  return (
    <View style={styles.workspaceRow}>
      <View style={styles.entryCopy}>
        <Text style={styles.workspaceName}>{entry.project || entry.client || entry.type}</Text>
        <Text style={styles.entryMeta}>{entry.note || entry.sourceLabel || "No note"}</Text>
      </View>
      <View style={styles.entryRight}>
        <Text style={styles.workspaceMeta}>{formatMinutes(entry.duration)}</Text>
        <Text style={styles.entryDate}>{formatShortDate(entry.workDate || entry.leaveDate)}</Text>
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

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
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
