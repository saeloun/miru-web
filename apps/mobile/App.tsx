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

  const dayKeys = useMemo(() => {
    if (!timeTracking) return [];

    return Object.keys(timeTracking.entries || {}).sort();
  }, [timeTracking]);

  const totalEntries = useMemo(() => {
    if (!timeTracking) return 0;

    return Object.values(timeTracking.entries || {}).reduce((sum, entries) => sum + entries.length, 0);
  }, [timeTracking]);

  const currentDayEntries = useMemo(() => {
    if (!timeTracking || dayKeys.length === 0) return [];

    return timeTracking.entries?.[dayKeys[dayKeys.length - 1]] || [];
  }, [dayKeys, timeTracking]);

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

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{activeTab}</Text>
              <Text style={styles.cardBody}>
                {contentFor(activeTab, {
                  currentDayLabel: dayKeys[dayKeys.length - 1],
                  currentDayEntries: currentDayEntries.length,
                  totalEntries,
                })}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Workspace switcher</Text>
              {workspaces.map(workspace => (
                <View key={workspace.id} style={styles.workspaceRow}>
                  <Text style={styles.workspaceName}>{workspace.name}</Text>
                  <Text style={styles.workspaceMeta}>#{workspace.id}</Text>
                </View>
              ))}
            </View>

            {currentDayEntries.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Latest entries</Text>
                {currentDayEntries.slice(0, 5).map(entry => (
                  <View key={entry.id} style={styles.workspaceRow}>
                    <View style={styles.entryCopy}>
                      <Text style={styles.workspaceName}>{entry.project || entry.type}</Text>
                      <Text style={styles.entryMeta}>{entry.note || "No note"}</Text>
                    </View>
                    <Text style={styles.workspaceMeta}>{entry.duration}m</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function contentFor(
  tab: Tab,
  stats: { currentDayLabel?: string; currentDayEntries: number; totalEntries: number }
) {
  if (tab === "Today") {
    return `${stats.currentDayEntries} entries loaded for ${stats.currentDayLabel || "today"}. Next step is native timer start and stop.`;
  }
  if (tab === "Week") {
    return `${stats.totalEntries} entries are available in the current bootstrap payload. Next step is day-by-day week navigation.`;
  }
  if (tab === "Activity") {
    return "Offline queue and retry states still need implementation, but this is where pending sync work will live.";
  }

  return "Profile, workspace switching, and owner summary live here.";
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
  workspaceMeta: {
    color: "#94a3b8",
    fontSize: 13,
  },
});
