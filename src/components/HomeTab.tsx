import React, { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/shellTheme";
import ThemedButton from "./ThemedButton";

type Props = {
  onOpenStudio: () => void;
  onLearnMore: () => void;
};

const HOW_IT_WORKS = [
  { icon: "cloud-upload-outline" as const, title: "Upload Photo", desc: "Use a clear full-body image." },
  { icon: "shirt-outline" as const, title: "Choose Garment", desc: "Pick from samples or upload your own." },
  { icon: "sparkles-outline" as const, title: "Generate Result", desc: "AI renders your styled output in seconds." },
];

const FEATURES = [
  { icon: "flash-outline" as const, label: "Fast generation", text: "Get results quickly with guided progress." },
  { icon: "layers-outline" as const, label: "Detail retention", text: "Maintains original character and framing." },
  { icon: "download-outline" as const, label: "Export ready", text: "Download generated outputs directly." },
];

const FEATURE_IMAGE =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80";

export default function HomeTab(props: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={styles.page}>
      <View style={styles.heroSection}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={["rgba(79,70,229,0.12)", "transparent", "rgba(124,58,237,0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.heroBadge}>AI-Powered Virtual Try-On</Text>
          <Text style={styles.heroTitle}>Try Before You Buy —</Text>
          <Text style={styles.heroTitleAccent}>Virtually</Text>
          <Text style={styles.heroSubtitle}>
            Upload your photo, pick any outfit, and generate realistic try-on previews in seconds.
          </Text>
          <View style={styles.heroActions}>
            <View style={styles.heroBtnWrap}>
              <ThemedButton title="Open Try-On Studio" onPress={props.onOpenStudio} />
            </View>
            <View style={styles.heroBtnWrap}>
              <ThemedButton title="Learn More" onPress={props.onLearnMore} variant="outline" />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.sectionSubtitle}>Three quick steps from upload to realistic fit preview.</Text>
      </View>
      <View style={styles.howGrid}>
        {HOW_IT_WORKS.map((item) => (
          <View key={item.title} style={styles.howCard}>
            <View style={styles.howIconWrap}>
              <Ionicons name={item.icon} size={26} color={theme.gold} />
            </View>
            <Text style={styles.howCardTitle}>{item.title}</Text>
            <Text style={styles.howCardDesc}>{item.desc}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Built for realistic styling output</Text>
        <Text style={styles.sectionSubtitle}>
          The Weartual engine preserves identity, pose, and visual details while adapting garments naturally.
        </Text>
      </View>
      <View style={styles.featuresBlock}>
        {FEATURES.map((f) => (
          <View key={f.label} style={styles.featureRow}>
            <View style={styles.featureIconWrap}>
              <Ionicons name={f.icon} size={20} color={theme.gold} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Text style={styles.featureBody}>{f.text}</Text>
            </View>
          </View>
        ))}
        <Image source={{ uri: FEATURE_IMAGE }} style={styles.featureImage} resizeMode="cover" />
      </View>

      <View style={styles.ctaBand}>
        <Text style={styles.ctaTitle}>Ready to try your next look?</Text>
        <Text style={styles.ctaSubtitle}>Jump into studio mode and generate your first try-on now.</Text>
        <ThemedButton title="Go to Try-On Studio" onPress={props.onOpenStudio} />
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
    heroSection: {
      paddingTop: 8,
      paddingBottom: 8,
    },
    heroCard: {
      borderRadius: 22,
      padding: 20,
      gap: 10,
      alignItems: "center",
      backgroundColor: theme.bgElevated + "e6",
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
    },
    heroBadge: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.gold,
      backgroundColor: "rgba(79,70,229,0.12)",
      borderWidth: 1,
      borderColor: "rgba(79,70,229,0.28)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      overflow: "hidden",
      marginBottom: 4,
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      letterSpacing: -0.4,
      lineHeight: 32,
    },
    heroTitleAccent: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.gold,
      textAlign: "center",
      letterSpacing: -0.4,
      lineHeight: 32,
      marginBottom: 4,
    },
    heroSubtitle: {
      color: theme.muted,
      lineHeight: 22,
      fontSize: 15,
      textAlign: "center",
      maxWidth: 340,
    },
    heroActions: {
      width: "100%",
      gap: 10,
      marginTop: 8,
    },
    heroBtnWrap: {
      width: "100%",
    },
    sectionHeader: {
      marginTop: 28,
      marginBottom: 12,
      alignItems: "center",
      gap: 6,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      letterSpacing: -0.3,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: theme.muted,
      textAlign: "center",
      lineHeight: 21,
      maxWidth: 320,
    },
    howGrid: {
      gap: 12,
    },
    howCard: {
      borderRadius: 16,
      padding: 18,
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
    },
    howIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: "rgba(79,70,229,0.12)",
      borderWidth: 1,
      borderColor: "rgba(79,70,229,0.25)",
      alignItems: "center",
      justifyContent: "center",
    },
    howCardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    howCardDesc: {
      fontSize: 13,
      color: theme.muted,
      textAlign: "center",
      lineHeight: 19,
    },
    featuresBlock: {
      gap: 14,
    },
    featureRow: {
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    featureIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    featureText: {
      flex: 1,
      gap: 2,
    },
    featureLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    featureBody: {
      fontSize: 13,
      color: theme.muted,
      lineHeight: 19,
    },
    featureImage: {
      width: "100%",
      height: 200,
      borderRadius: 20,
      backgroundColor: theme.bgInput,
      borderWidth: 1,
      borderColor: theme.border,
      marginTop: 4,
    },
    ctaBand: {
      marginTop: 28,
      borderRadius: 20,
      padding: 22,
      gap: 10,
      alignItems: "center",
      backgroundColor: "rgba(79,70,229,0.15)",
      borderWidth: 1,
      borderColor: "rgba(79,70,229,0.35)",
    },
    ctaTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
    },
    ctaSubtitle: {
      fontSize: 14,
      color: theme.muted,
      textAlign: "center",
      lineHeight: 21,
      marginBottom: 4,
    },
  });
