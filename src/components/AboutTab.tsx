import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/shellTheme";

type Challenge = "drape" | "embroidery" | "fit";

const STAT_CARDS = [
  { n: "01", label: "Core domain", body: "Eastern wear: kurtas, festive tops, embroidered garments, and layered silhouettes." },
  { n: "02", label: "Technical focus", body: "StableVITON-compatible multimodal bundle generation with deterministic file mapping." },
  { n: "03", label: "Product goal", body: "Reduce uncertainty in online purchase decisions with reliable visual fit previews." },
] as const;

const PIPELINE_STAGES = [
  {
    id: "capture",
    title: "Identity-Preserving Input Capture",
    short: "Exact filenames and paired subject-garment intake.",
    detail:
      "Our intake flow keeps the original filename unchanged across local storage, MongoDB metadata, and cloud assets. This lets us map each person and garment image to the correct dataset references without fragile renaming rules.",
  },
  {
    id: "mapping",
    title: "Eastern-Wear Asset Mapping",
    short: "Prefix-based retrieval for culturally specific silhouettes.",
    detail:
      "After upload, we map filename prefixes to curated dataset folders like image, agnostic-v3.2, agnostic-mask, densepose, cloth, and cloth-mask. This is especially important for eastern garments where drape lines, sleeve length, and layering differ from western tops.",
  },
  {
    id: "bundle",
    title: "StableVITON Input Bundle Assembly",
    short: "Automatic collection of all required modalities.",
    detail:
      "The system automatically gathers jpg, jpeg, png, webp, and json files required by StableVITON. Only required files are uploaded to cloud storage while preserving names and folder-level references for traceability.",
  },
  {
    id: "generation",
    title: "Try-On Generation and Iteration",
    short: "Fast preview loop for practical outfit decisions.",
    detail:
      "Generated results are stored with the same naming lineage, making repeated experiments easy. Teams can later swap in real Graphonomy, DensePose, and OpenPose outputs without changing the overall architecture.",
  },
] as const;

const CHALLENGE_TABS: { id: Challenge; label: string }[] = [
  { id: "drape", label: "Fabric Drape" },
  { id: "embroidery", label: "Embroidery" },
  { id: "fit", label: "Regional Fit" },
];

const CHALLENGE_FOCUS: Record<Challenge, { title: string; points: string[] }> = {
  drape: {
    title: "Complex Fabric Drape",
    points: [
      "Eastern wear often uses flowing fabrics and layered folds that move differently than rigid western garments.",
      "Our mapping-first pipeline helps preserve visually natural fall lines around torso and sleeves.",
      "By retaining dataset-relative references, we can continuously improve drape modules without breaking integration.",
    ],
  },
  embroidery: {
    title: "Embroidery and Surface Detail",
    points: [
      "Kurtas and festive pieces include dense motifs that are easy to blur in generic try-on systems.",
      "We optimize for preserving high-frequency detail so borders, neckwork, and motifs remain recognizable.",
      "This creates previews that are closer to what users expect when shopping eastern wear online.",
    ],
  },
  fit: {
    title: "Regional Fit Variations",
    points: [
      "Eastern silhouettes vary significantly: straight cut, A-line, layered styles, and longer hemlines.",
      "Our modular architecture allows region-specific fit refinement without rewriting upload or storage logic.",
      "That makes the platform practical for scaling to more categories and local brands.",
    ],
  },
};

const FAQ = [
  {
    q: "Why is filename preservation important?",
    a: "It guarantees deterministic mapping between uploaded inputs and related preprocessing assets. This removes ambiguity and makes debugging, reproducibility, and auditability much easier.",
  },
  {
    q: "Can this pipeline move beyond dataset-backed inputs?",
    a: "Yes. The architecture is modular. Dataset-based assets can be replaced by live outputs from Graphonomy, DensePose, and OpenPose while keeping the same bundle contract.",
  },
  {
    q: "What is the main product focus right now?",
    a: "Our current focus is eastern wear virtual try-on where drape quality, cultural silhouette fidelity, and texture detail preservation are critical to user trust.",
  },
] as const;

export default function AboutTab() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [activeStage, setActiveStage] = useState(0);
  const [challenge, setChallenge] = useState<Challenge>("drape");
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const focus = CHALLENGE_FOCUS[challenge];

  return (
    <View style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.researchPill}>Weartual Research Track</Text>
        <Text style={styles.pageTitle}>About Our Eastern-Wear Virtual Try-On System</Text>
        <Text style={styles.pageIntro}>
          We are building a virtual try-on platform focused on eastern wear, where graceful drape, intricate detailing,
          and culturally specific silhouettes matter as much as fit. Our work combines robust input handling,
          dataset-aware asset mapping, and StableVITON-ready bundling to deliver realistic previews users can trust.
        </Text>
      </View>

      <View style={styles.statGrid}>
        {STAT_CARDS.map((card) => (
          <View key={card.n} style={styles.statCard}>
            <Text style={styles.statNum}>{card.n}</Text>
            <Text style={styles.statLabel}>{card.label}</Text>
            <Text style={styles.statBody}>{card.body}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Interactive System Walkthrough</Text>
      <Text style={styles.sectionDesc}>Select a stage to explore how our pipeline works in production.</Text>
      <View style={styles.stageGrid}>
        {PIPELINE_STAGES.map((stage, idx) => {
          const active = activeStage === idx;
          return (
            <Pressable
              key={stage.id}
              onPress={() => setActiveStage(idx)}
              style={[styles.stageBtn, active && styles.stageBtnActive]}
            >
              <Text style={styles.stageKicker}>Stage {idx + 1}</Text>
              <Text style={styles.stageBtnTitle}>{stage.title}</Text>
              <Text style={styles.stageBtnShort}>{stage.short}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.stageDetail}>
        <Text style={styles.stageDetailTitle}>{PIPELINE_STAGES[activeStage].title}</Text>
        <Text style={styles.stageDetailBody}>{PIPELINE_STAGES[activeStage].detail}</Text>
      </View>

      <Text style={styles.sectionTitle}>What Makes Eastern Wear Harder</Text>
      <Text style={styles.sectionDesc}>Switch between focus areas to see where our team is investing effort.</Text>
      <View style={styles.challengeTabs}>
        {CHALLENGE_TABS.map((tab) => {
          const active = challenge === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setChallenge(tab.id)}
              style={[styles.challengeTab, active && styles.challengeTabActive]}
            >
              <Text style={[styles.challengeTabText, active && styles.challengeTabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.challengePanel}>
        <Text style={styles.challengePanelTitle}>{focus.title}</Text>
        {focus.points.map((point) => (
          <Text key={point} style={styles.challengeBullet}>
            • {point}
          </Text>
        ))}
      </View>

      <Text style={styles.sectionTitle}>FAQ</Text>
      <View style={styles.faqList}>
        {FAQ.map((item, idx) => {
          const open = faqOpen === idx;
          return (
            <Pressable
              key={item.q}
              onPress={() => setFaqOpen((prev) => (prev === idx ? null : idx))}
              style={[styles.faqCard, open && styles.faqCardOpen]}
            >
              <View style={styles.faqRow}>
                <Text style={styles.faqQ}>{item.q}</Text>
                <Text style={styles.faqToggle}>{open ? "−" : "+"}</Text>
              </View>
              {open ? <Text style={styles.faqA}>{item.a}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    page: {
      gap: 0,
      paddingBottom: 12,
    },
    pageHeader: {
      alignItems: "center",
      marginBottom: 20,
      gap: 10,
    },
    researchPill: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: theme.gold,
      borderWidth: 1,
      borderColor: "rgba(79,70,229,0.35)",
      backgroundColor: "rgba(79,70,229,0.08)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      overflow: "hidden",
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      letterSpacing: -0.4,
      lineHeight: 30,
    },
    pageIntro: {
      fontSize: 15,
      color: theme.muted,
      textAlign: "center",
      lineHeight: 23,
    },
    statGrid: {
      gap: 10,
      marginBottom: 8,
    },
    statCard: {
      borderRadius: 16,
      padding: 16,
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statNum: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.text,
    },
    statLabel: {
      marginTop: 6,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.muted2,
    },
    statBody: {
      marginTop: 8,
      fontSize: 13,
      color: theme.muted,
      lineHeight: 20,
    },
    sectionTitle: {
      marginTop: 24,
      marginBottom: 6,
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.3,
    },
    sectionDesc: {
      fontSize: 14,
      color: theme.muted,
      lineHeight: 21,
      marginBottom: 12,
    },
    stageGrid: {
      gap: 10,
    },
    stageBtn: {
      borderRadius: 16,
      padding: 14,
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 4,
    },
    stageBtnActive: {
      borderColor: "rgba(79,70,229,0.45)",
      backgroundColor: "rgba(79,70,229,0.06)",
    },
    stageKicker: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase",
      color: theme.muted2,
    },
    stageBtnTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    stageBtnShort: {
      fontSize: 13,
      color: theme.muted,
      lineHeight: 19,
    },
    stageDetail: {
      marginTop: 12,
      borderRadius: 16,
      padding: 16,
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 8,
    },
    stageDetailTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    stageDetailBody: {
      fontSize: 14,
      color: theme.muted,
      lineHeight: 22,
    },
    challengeTabs: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    challengeTab: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bgElevated,
    },
    challengeTabActive: {
      borderColor: "rgba(79,70,229,0.45)",
      backgroundColor: "rgba(79,70,229,0.08)",
    },
    challengeTabText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.muted,
    },
    challengeTabTextActive: {
      color: theme.gold,
      fontWeight: "700",
    },
    challengePanel: {
      borderRadius: 16,
      padding: 16,
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 10,
    },
    challengePanelTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    challengeBullet: {
      fontSize: 13,
      color: theme.muted,
      lineHeight: 20,
    },
    faqList: {
      gap: 10,
      marginBottom: 8,
    },
    faqCard: {
      borderRadius: 14,
      padding: 14,
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
    },
    faqCardOpen: {
      borderColor: "rgba(79,70,229,0.35)",
    },
    faqRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    faqQ: {
      flex: 1,
      fontWeight: "700",
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    faqToggle: {
      fontSize: 20,
      fontWeight: "300",
      color: theme.muted2,
      lineHeight: 22,
    },
    faqA: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
    },
  });
