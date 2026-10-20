import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Rect,
  Line,
} from "@react-pdf/renderer";
import type { TiragesExportReport } from "@/lib/export-report";
import { formatGap, formatParisTime } from "@/lib/time";

const colors = {
  cream: "#faf6f2",
  blush: "#f3e8e4",
  roseMist: "#e8c9c4",
  roseSoft: "#d4a5a0",
  roseDust: "#c9918f",
  roseDeep: "#8f5e5c",
  ink: "#4a3332",
  inkMuted: "#8a6f6d",
  line: "#ead9d4",
  surface: "#fffaf7",
  bar: "#c9918f",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.cream,
    color: colors.ink,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
  },
  brand: {
    fontFamily: "Helvetica-Bold",
    fontSize: 28,
    color: colors.roseDeep,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  range: {
    fontSize: 11,
    color: colors.ink,
    lineHeight: 1.45,
    marginBottom: 22,
    maxWidth: 480,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: colors.roseDeep,
    marginBottom: 8,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statCard: {
    flexGrow: 1,
    width: "30%",
    marginRight: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statLabel: {
    fontSize: 8,
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: colors.ink,
  },
  statUnit: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.inkMuted,
  },
  chartWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  chartCaption: {
    fontSize: 8,
    color: colors.inkMuted,
    marginBottom: 8,
  },
  dayBlock: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: colors.blush,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dayTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: colors.ink,
    textTransform: "capitalize",
  },
  dayMeta: {
    fontSize: 8,
    color: colors.inkMuted,
    marginTop: 2,
  },
  dayTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: colors.roseDeep,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  colTime: { width: "12%", color: colors.ink },
  colVol: { width: "12%", color: colors.ink },
  colDuration: { width: "12%", color: colors.ink },
  colGap: { width: "20%", color: colors.inkMuted },
  colNotes: { width: "44%", color: colors.ink, paddingRight: 4 },
  th: {
    fontSize: 8,
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 24,
    fontSize: 8,
    color: colors.inkMuted,
    textAlign: "center",
  },
});

function formatFrNumber(n: number): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function VolumeHistogram({
  points,
}: {
  points: TiragesExportReport["dailyVolumes"];
}) {
  const width = 515;
  const height = 140;
  const padL = 28;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const max = Math.max(...points.map((p) => p.volumeMl), 1);
  const n = points.length;
  const gap = n > 40 ? 0.5 : n > 20 ? 1 : 2;
  const barW = Math.max(1, (plotW - gap * Math.max(n - 1, 0)) / n);
  const labelEvery = Math.max(1, Math.ceil(n / 10));

  return (
    <View style={styles.chartWrap}>
      <Text style={styles.chartCaption}>Volume tiré par jour (ml)</Text>
      <Svg width={width} height={height}>
        <Line
          x1={padL}
          y1={padT + plotH}
          x2={padL + plotW}
          y2={padT + plotH}
          stroke={colors.line}
          strokeWidth={1}
        />
        <Line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={padT + plotH}
          stroke={colors.line}
          strokeWidth={1}
        />
        {points.map((p, i) => {
          const h = (p.volumeMl / max) * plotH;
          const x = padL + i * (barW + gap);
          const y = padT + plotH - h;
          return (
            <Rect
              key={p.dateKey}
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, p.volumeMl > 0 ? 1 : 0)}
              fill={colors.bar}
            />
          );
        })}
        {/* Labels d’axe : densifiés pour rester lisibles */}
        {points.map((p, i) => {
          if (i % labelEvery !== 0 && i !== n - 1) return null;
          const x = padL + i * (barW + gap) + barW / 2;
          return (
            <Text
              key={`lbl-${p.dateKey}`}
              x={x}
              y={padT + plotH + 12}
              fill={colors.inkMuted}
              textAnchor="middle"
              style={{ fontSize: 6 }}
            >
              {p.label}
            </Text>
          );
        })}
        <Text
          x={padL - 4}
          y={padT + 6}
          fill={colors.inkMuted}
          textAnchor="end"
          style={{ fontSize: 6 }}
        >
          {String(max)}
        </Text>
        <Text
          x={padL - 4}
          y={padT + plotH}
          fill={colors.inkMuted}
          textAnchor="end"
          style={{ fontSize: 6 }}
        >
          0
        </Text>
      </Svg>
    </View>
  );
}

function Footer({ exportedAtLabel }: { exportedAtLabel: string }) {
  return (
    <Text style={styles.footer} fixed>
      Document généré par lactae.app — {exportedAtLabel}
    </Text>
  );
}

export function TiragesPdfDocument({ report }: { report: TiragesExportReport }) {
  return (
    <Document
      title={`Tirages Lactae — ${report.displayName}`}
      author="Lactae"
      subject={report.rangeLabel}
      creator="lactae.app"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>Lactae</Text>
        <Text style={styles.range}>{report.rangeLabel}</Text>

        <Text style={styles.sectionTitle}>Trois derniers jours complets</Text>
        <View style={styles.statsRow}>
          <StatCard
            label="Tirages / jour"
            value={formatFrNumber(report.recent.avgTiragesPerDay)}
          />
          <StatCard
            label="Volume / jour"
            value={formatFrNumber(report.recent.avgVolumeMlPerDay)}
            unit="ml"
          />
        </View>

        <Text style={styles.sectionTitle}>Depuis le départ</Text>
        <View style={styles.statsRow}>
          <StatCard
            label="Tirages / jour"
            value={formatFrNumber(report.overall.avgTiragesPerDay)}
          />
          <StatCard
            label="Volume / jour"
            value={formatFrNumber(report.overall.avgVolumeMlPerDay)}
            unit="ml"
          />
          <StatCard
            label="Jours de tirage"
            value={formatFrNumber(report.overall.daysWithTirages ?? 0)}
          />
        </View>

        <VolumeHistogram points={report.dailyVolumes} />
        <Footer exportedAtLabel={report.exportedAtLabel} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Détail des tirages</Text>
        {report.days.map((day) => (
          <View key={day.dateKey} style={styles.dayBlock} wrap>
            <View style={styles.dayHeader}>
              <View>
                <Text style={styles.dayTitle}>{day.label}</Text>
                <Text style={styles.dayMeta}>
                  {day.count} tirage{day.count > 1 ? "s" : ""}
                </Text>
              </View>
              <Text style={styles.dayTotal}>{day.totalMl} ml</Text>
            </View>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colTime]}>Heure</Text>
              <Text style={[styles.th, styles.colVol]}>Volume</Text>
              <Text style={[styles.th, styles.colDuration]}>Durée</Text>
              <Text style={[styles.th, styles.colGap]}>Écart précédent</Text>
              <Text style={[styles.th, styles.colNotes]}>Notes</Text>
            </View>
            {day.tirages.map((t) => (
              <View key={t.id} style={styles.tableRow} wrap={false}>
                <Text style={styles.colTime}>{formatParisTime(t.datetime)}</Text>
                <Text style={styles.colVol}>{t.quantityMl} ml</Text>
                <Text style={styles.colDuration}>
                  {t.duration > 0 ? `${t.duration} min` : "—"}
                </Text>
                <Text style={styles.colGap}>{formatGap(t.gapMinutes)}</Text>
                <Text style={styles.colNotes}>{t.notes ?? ""}</Text>
              </View>
            ))}
          </View>
        ))}
        <Footer exportedAtLabel={report.exportedAtLabel} />
      </Page>
    </Document>
  );
}
