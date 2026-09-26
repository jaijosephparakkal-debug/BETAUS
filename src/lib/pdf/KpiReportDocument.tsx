import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ActivityReport } from "@/lib/kpiReport";
import { kpiScore } from "@/lib/queries";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 2, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#555", marginBottom: 16 },
  sectionTitle: { fontSize: 13, marginTop: 18, marginBottom: 8, fontWeight: 700 },
  statsRow: { flexDirection: "row", gap: 16, marginBottom: 4 },
  stat: { fontSize: 10, color: "#333" },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingBottom: 4,
    borderBottom: "0.5pt solid #e5e5e5",
  },
  eventRow: {
    marginBottom: 6,
    paddingBottom: 6,
    borderBottom: "0.5pt solid #eee",
  },
  eventTime: { fontSize: 8, color: "#888" },
  eventLabel: { fontSize: 10, marginTop: 1 },
  empty: { fontSize: 10, color: "#888" },
});

export function KpiReportDocument({ report }: { report: ActivityReport }) {
  const { membership, kpis, events, completedTasks, avgProgress, tasks } = report;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{membership.user.name} — KPI &amp; Activity Report</Text>
        <Text style={styles.subtitle}>
          {membership.title} · {membership.company.name} · Generated{" "}
          {new Date().toLocaleString()}
        </Text>

        <View style={styles.statsRow}>
          <Text style={styles.stat}>Tasks: {tasks.length}</Text>
          <Text style={styles.stat}>Completed: {completedTasks}</Text>
          <Text style={styles.stat}>Avg. task progress: {avgProgress}%</Text>
        </View>

        <Text style={styles.sectionTitle}>KPIs</Text>
        {kpis.map((k) => (
          <View key={k.id} style={styles.kpiRow}>
            <Text>{k.name}</Text>
            <Text>
              {k.current}
              {k.unit ?? ""} / {k.target}
              {k.unit ?? ""} ({kpiScore(k)}%)
            </Text>
          </View>
        ))}
        {kpis.length === 0 && <Text style={styles.empty}>No KPIs set.</Text>}

        <Text style={styles.sectionTitle}>
          Full activity log ({events.length} event{events.length === 1 ? "" : "s"})
        </Text>
        {events.map((e, i) => (
          <View key={i} style={styles.eventRow}>
            <Text style={styles.eventTime}>{e.at.toLocaleString()}</Text>
            <Text style={styles.eventLabel}>{e.label}</Text>
          </View>
        ))}
        {events.length === 0 && <Text style={styles.empty}>No activity logged yet.</Text>}
      </Page>
    </Document>
  );
}
