import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/shellTheme";
import ThemedButton from "./ThemedButton";

const TEAM = [
  {
    name: "Anila Amjad",
    role: "Supervisor",
    details:
      "Leads research direction, quality benchmarks, and project mentoring with focus on eastern-wear realism and evaluation standards.",
  },
  {
    name: "Musharib Rehman",
    role: "Project Developer",
    details:
      "Builds backend pipeline integration, filename-preserving data flow, and StableVITON input bundle orchestration.",
  },
  {
    name: "Muddasir Yaseen",
    role: "Project Developer",
    details:
      "Develops frontend experience and interaction flows to make virtual try-on understandable, fast, and user-friendly.",
  },
] as const;

type Props = {
  contactName: string;
  setContactName: (v: string) => void;
  contactEmail: string;
  setContactEmail: (v: string) => void;
  contactSubject: string;
  setContactSubject: (v: string) => void;
  contactText: string;
  setContactText: (v: string) => void;
  contactMessage: string | null;
  contactSubmitting: boolean;
  onSubmit: () => void;
};

export default function ContactTab(props: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [activeMember, setActiveMember] = useState<number | null>(null);

  return (
    <View style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Contact</Text>
        <Text style={styles.pageIntro}>
          Have questions about the Virtual Try-On system? Reach out to our team.
        </Text>
      </View>

      <View style={styles.teamGrid}>
        {TEAM.map((m, idx) => {
          const expanded = activeMember === idx;
          return (
            <Pressable
              key={m.name}
              onPress={() => setActiveMember((prev) => (prev === idx ? null : idx))}
              style={[styles.teamCard, expanded && styles.teamCardActive]}
            >
              <View style={styles.teamAvatar}>
                <Text style={styles.teamAvatarLetter}>{m.name[0]}</Text>
              </View>
              <Text style={styles.teamName}>{m.name}</Text>
              <Text style={styles.teamRole}>{m.role}</Text>
              <Text style={styles.teamHint}>{expanded ? "Click to collapse" : "Click to view details"}</Text>
              {expanded ? (
                <View style={styles.teamDetails}>
                  <Text style={styles.teamDetailsText}>{m.details}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Share Your Feedback</Text>
        <Text style={styles.formIntro}>
          Your suggestions help us improve eastern-wear virtual try-on quality, fitting realism, and overall user
          experience. Tell us what worked well and what we should improve next.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={props.contactName}
            onChangeText={props.setContactName}
            placeholder="Enter your full name"
            placeholderTextColor={theme.placeholder}
            autoCapitalize="words"
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={props.contactEmail}
            onChangeText={props.setContactEmail}
            placeholder="you@example.com"
            placeholderTextColor={theme.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            value={props.contactSubject}
            onChangeText={props.setContactSubject}
            placeholder="Ex: Fit quality for long kurtas"
            placeholderTextColor={theme.placeholder}
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Feedback Message</Text>
          <TextInput
            value={props.contactText}
            onChangeText={props.setContactText}
            placeholder="Share your feedback, bug report, or feature request..."
            placeholderTextColor={theme.placeholder}
            multiline
            numberOfLines={5}
            style={[styles.input, styles.textArea]}
          />
        </View>
        <ThemedButton
          title={props.contactSubmitting ? "Sending..." : "Send Feedback"}
          onPress={props.onSubmit}
          loading={props.contactSubmitting}
          disabled={props.contactSubmitting}
        />
        {props.contactMessage ? (
          <Text
            style={[
              styles.formHint,
              props.contactMessage.toLowerCase().includes("success") ? styles.formHintOk : styles.formHintWarn,
            ]}
          >
            {props.contactMessage}
          </Text>
        ) : null}
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Expected Response Time</Text>
          <Text style={styles.infoBody}>
            We usually review feedback within 24 to 48 hours. Priority is given to reproducible issues affecting
            eastern-wear fitting realism, garment alignment, and texture consistency.
          </Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Feedback That Helps Most</Text>
          <Text style={styles.infoBullet}>• Outfit category (kurta, festive top, layered look)</Text>
          <Text style={styles.infoBullet}>• What looked off (sleeves, hemline, drape, embroidery)</Text>
          <Text style={styles.infoBullet}>• Whether issue is repeated across multiple uploads</Text>
        </View>
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
      gap: 8,
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.4,
    },
    pageIntro: {
      fontSize: 15,
      color: theme.muted,
      textAlign: "center",
      lineHeight: 23,
    },
    teamGrid: {
      gap: 10,
      marginBottom: 8,
    },
    teamCard: {
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 4,
    },
    teamCardActive: {
      borderColor: "rgba(79,70,229,0.45)",
    },
    teamAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(79,70,229,0.15)",
      borderWidth: 2,
      borderColor: "rgba(79,70,229,0.35)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    teamAvatarLetter: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.gold,
    },
    teamName: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.text,
    },
    teamRole: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.gold,
    },
    teamHint: {
      fontSize: 11,
      color: theme.muted2,
      marginTop: 2,
    },
    teamDetails: {
      marginTop: 10,
      width: "100%",
      borderRadius: 12,
      padding: 12,
      backgroundColor: theme.bgInput,
      borderWidth: 1,
      borderColor: theme.border,
    },
    teamDetailsText: {
      fontSize: 13,
      color: theme.muted,
      lineHeight: 20,
      textAlign: "left",
    },
    formCard: {
      marginTop: 16,
      borderRadius: 18,
      padding: 18,
      gap: 14,
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
    },
    formTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
    },
    formIntro: {
      fontSize: 14,
      color: theme.muted,
      lineHeight: 21,
    },
    field: {
      gap: 6,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "ios" ? 14 : 12,
      backgroundColor: theme.bgInput,
      color: theme.textSecondary,
      fontSize: 16,
    },
    textArea: {
      minHeight: 120,
      textAlignVertical: "top",
    },
    formHint: {
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
    },
    formHintOk: {
      color: theme.success,
    },
    formHintWarn: {
      color: theme.danger,
    },
    infoGrid: {
      marginTop: 16,
      gap: 10,
    },
    infoCard: {
      borderRadius: 16,
      padding: 16,
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 8,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    infoBody: {
      fontSize: 13,
      color: theme.muted,
      lineHeight: 20,
    },
    infoBullet: {
      fontSize: 13,
      color: theme.muted,
      lineHeight: 20,
    },
  });
