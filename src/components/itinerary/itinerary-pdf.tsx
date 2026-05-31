import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PdfImage,
} from "@react-pdf/renderer";
import {
  STEP_COLORS,
  type ItineraryStep,
  type ItineraryStepKind,
  type ItineraryExtras,
} from "@/types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 56,
    fontSize: 11,
    color: "#1d1d1f",
    fontFamily: "Helvetica",
  },
  brand: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: 700,
    color: "#86868b",
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 6 },
  subtitle: { fontSize: 12, color: "#3a3a3c", marginBottom: 24, lineHeight: 1.6 },
  cover: {
    width: "100%",
    height: 220,
    objectFit: "cover",
    borderRadius: 12,
    marginBottom: 24,
  },
  meta: {
    flexDirection: "row",
    gap: 16,
    fontSize: 10,
    color: "#86868b",
    marginBottom: 32,
  },
  divider: { height: 1, backgroundColor: "#e5e5ea", marginVertical: 18 },
  dayHeader: {
    marginTop: 18,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5ea",
  },
  dayLabel: {
    fontSize: 9,
    letterSpacing: 1.6,
    fontWeight: 700,
    color: "#86868b",
  },
  dayTitle: { fontSize: 18, fontWeight: 700, marginTop: 4 },
  stepRow: {
    marginBottom: 18,
    paddingLeft: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#0A84FF",
  },
  stepKind: {
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: 700,
    color: "#0A84FF",
    marginBottom: 2,
  },
  stepTitle: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  stepBody: { fontSize: 10.5, color: "#3a3a3c", lineHeight: 1.6 },
  stepMeta: {
    fontSize: 9,
    color: "#86868b",
    marginTop: 4,
    lineHeight: 1.5,
  },
  stepImage: {
    width: "100%",
    height: 150,
    objectFit: "cover",
    borderRadius: 8,
    marginTop: 8,
  },
  sectionHeader: { fontSize: 22, fontWeight: 700, marginBottom: 14 },
  sectionLead: { fontSize: 10.5, color: "#3a3a3c", marginBottom: 18, lineHeight: 1.6 },
  poiBlockTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 14,
    marginBottom: 6,
  },
  poiRow: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5ea",
  },
  poiName: { fontSize: 11, fontWeight: 700 },
  poiMeta: { fontSize: 9.5, color: "#3a3a3c", lineHeight: 1.5 },
  numberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5ea",
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    fontSize: 9,
    color: "#86868b",
    textAlign: "center",
  },
});

const accentForKind = (kind: ItineraryStepKind) => STEP_COLORS[kind].hex;

export interface PdfItinerary {
  title: string;
  excerpt?: string | null;
  duration?: string | null;
  country?: string | null;
  region?: string | null;
  cover_url?: string | null;
  description?: string | null;
  extras?: ItineraryExtras | null;
}

interface DayBucket {
  day: number;
  title?: string;
  steps: ItineraryStep[];
}

function groupByDay(steps: ItineraryStep[]): DayBucket[] {
  const buckets = new Map<number, DayBucket>();
  for (const step of steps) {
    const day = step.day ?? 1;
    const bucket = buckets.get(day);
    if (bucket) {
      bucket.steps.push(step);
      bucket.title = bucket.title ?? step.dayTitle;
    } else {
      buckets.set(day, {
        day,
        title: step.dayTitle,
        steps: [step],
      });
    }
  }
  for (const bucket of buckets.values()) {
    bucket.steps.sort((a, b) => a.position - b.position);
  }
  return [...buckets.values()].sort((a, b) => a.day - b.day);
}

export function ItineraryPdf({
  itinerary,
  steps,
}: {
  itinerary: PdfItinerary;
  steps: ItineraryStep[];
}) {
  const days = groupByDay(steps);
  const extras = itinerary.extras;
  const hasExtras =
    !!extras &&
    ((extras.pharmacies?.length ?? 0) > 0 ||
      (extras.hospitals?.length ?? 0) > 0 ||
      (extras.emergencyNumbers?.length ?? 0) > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>DEXTGO {"\u2014"} ITINERARY</Text>
        <Text style={styles.title}>{itinerary.title}</Text>
        {itinerary.excerpt && <Text style={styles.subtitle}>{itinerary.excerpt}</Text>}
        {itinerary.cover_url && (
          <PdfImage src={itinerary.cover_url} style={styles.cover} />
        )}
        <View style={styles.meta}>
          {itinerary.duration && <Text>Duration: {itinerary.duration}</Text>}
          {itinerary.country && (
            <Text>
              {itinerary.country}
              {itinerary.region ? ` / ${itinerary.region}` : ""}
            </Text>
          )}
          <Text>{steps.length} steps</Text>
        </View>

        {itinerary.description && (
          <Text style={[styles.subtitle, { marginBottom: 8 }]}>
            {itinerary.description}
          </Text>
        )}

        <View style={styles.divider} />

        {days.length === 0 && (
          <Text style={styles.subtitle}>
            Full day-by-day content for this itinerary is still being prepared.
          </Text>
        )}

        {days.map((bucket) => (
          <View key={`day-${bucket.day}`}>
            <View style={styles.dayHeader} wrap={false}>
              <Text style={styles.dayLabel}>DAY {bucket.day}</Text>
              {bucket.title && <Text style={styles.dayTitle}>{bucket.title}</Text>}
            </View>
            {(() => {
              let stepCounter = 0;
              let placeCounterInStep = 0;
              let audioCounterInStep = 0;
              let tipCounterInStep = 0;
              return bucket.steps.map((step) => {
              const accent = accentForKind(step.kind);
              let itemNumber = 1;
              if (step.kind === "step") {
                stepCounter += 1;
                placeCounterInStep = 0;
                audioCounterInStep = 0;
                tipCounterInStep = 0;
                itemNumber = stepCounter;
              } else if (step.kind === "pin") {
                placeCounterInStep += 1;
                itemNumber = placeCounterInStep;
              } else if (step.kind === "audio") {
                audioCounterInStep += 1;
                itemNumber = audioCounterInStep;
              } else {
                tipCounterInStep += 1;
                itemNumber = tipCounterInStep;
              }
              // Collect all narrative content — body (intro), description_long, info_data, expert_tips
              const fullNarrative = [
                step.body?.trim(),
                step.descriptionAndAudio?.trim(),
                step.infoData?.trim() ? `Info:\n${step.infoData.trim()}` : null,
                step.expertTips?.trim() ? `Expert tips:\n${step.expertTips.trim()}` : null,
              ]
                .filter(Boolean)
                .join("\n\n");

              return (
                <View
                  key={step.id}
                  style={[styles.stepRow, { borderLeftColor: accent }]}
                >
                  <Text style={[styles.stepKind, { color: accent }]}>
                    {STEP_COLORS[step.kind].label.toUpperCase()} {itemNumber}
                  </Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  {fullNarrative ? (
                    <Text style={styles.stepBody}>{fullNarrative}</Text>
                  ) : null}
                  {(step.address || step.officialUrl || step.googleMapsUrl) && (
                    <Text style={styles.stepMeta}>
                      {[
                        step.address ? `Address: ${step.address}` : null,
                        step.officialUrl ? `Official: ${step.officialUrl}` : null,
                        step.googleMapsUrl ? `Maps: ${step.googleMapsUrl}` : null,
                      ]
                        .filter(Boolean)
                        .join("\n")}
                    </Text>
                  )}
                  {step.images?.slice(0, 2).map((src) => (
                    <PdfImage key={`${step.id}-${src}`} src={src} style={styles.stepImage} />
                  ))}
                </View>
              );
              });
            })()}
          </View>
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `dextgo.com   ${"\u2022"}   page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>

      {hasExtras && extras && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.brand}>DEXTGO {"\u2014"} PRACTICAL INFO</Text>
          <Text style={styles.sectionHeader}>Pharmacies, hospitals & emergency</Text>
          <Text style={styles.sectionLead}>
            Save these before you go. Tap any number on the device version of
            this guide to call directly.
          </Text>

          {extras.pharmacies && extras.pharmacies.length > 0 && (
            <View>
              <Text style={styles.poiBlockTitle}>Pharmacies</Text>
              {extras.pharmacies.map((p, i) => (
                <View key={`pharma-${i}`} style={styles.poiRow} wrap={false}>
                  <Text style={styles.poiName}>{p.name}</Text>
                  <Text style={styles.poiMeta}>
                    {[p.address, p.phone, p.hours].filter(Boolean).join("  ·  ")}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {extras.hospitals && extras.hospitals.length > 0 && (
            <View>
              <Text style={styles.poiBlockTitle}>Hospitals</Text>
              {extras.hospitals.map((p, i) => (
                <View key={`hosp-${i}`} style={styles.poiRow} wrap={false}>
                  <Text style={styles.poiName}>{p.name}</Text>
                  <Text style={styles.poiMeta}>
                    {[p.address, p.phone, p.hours].filter(Boolean).join("  ·  ")}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {extras.emergencyNumbers && extras.emergencyNumbers.length > 0 && (
            <View>
              <Text style={styles.poiBlockTitle}>Emergency numbers</Text>
              {extras.emergencyNumbers.map((n, i) => (
                <View key={`num-${i}`} style={styles.numberRow} wrap={false}>
                  <Text style={styles.poiMeta}>{n.label}</Text>
                  <Text style={[styles.poiName, { fontSize: 11 }]}>{n.number}</Text>
                </View>
              ))}
            </View>
          )}

          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `dextgo.com   ${"\u2022"}   page ${pageNumber} of ${totalPages}`
            }
            fixed
          />
        </Page>
      )}
    </Document>
  );
}
