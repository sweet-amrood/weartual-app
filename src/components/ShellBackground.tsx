import React, { useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, View } from "react-native";

import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/shellTheme";

const GRID_LINES = [72, 132, 192, 252, 312];

/** Full-screen light gradient + angular décor (website tones). */
export default function ShellBackground() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <>
      <LinearGradient
        colors={[theme.bg, theme.bgGradientMid, theme.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.decoCanvas} pointerEvents="none">
        <LinearGradient
          colors={["transparent", "rgba(79,70,229,0.10)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.decoBeamGold}
        />
        <LinearGradient
          colors={["transparent", "rgba(124,58,237,0.07)", "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.decoBeamBlue}
        />
        <View style={styles.shardGoldVert} />
        <View style={styles.shardGoldHoriz} />
        <View style={styles.shardBlueHoriz} />
        <View style={styles.shardSteps}>
          <View style={[styles.shardStep, { opacity: 0.5 }]} />
          <View style={[styles.shardStep, styles.shardStepMid, { opacity: 0.38 }]} />
          <View style={[styles.shardStep, styles.shardStepLow, { opacity: 0.28 }]} />
        </View>
        <View style={styles.cornerTL}>
          <View style={styles.cornerH} />
          <View style={styles.cornerV} />
        </View>
        <View style={styles.cornerBR}>
          <View style={styles.cornerHBr} />
          <View style={styles.cornerVBr} />
        </View>
        {GRID_LINES.map((top) => (
          <View key={top} style={[styles.gridHairline, { top }]} />
        ))}
      </View>
    </>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  decoCanvas: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 0,
  },
  decoBeamGold: {
    position: "absolute",
    width: 900,
    height: 140,
    top: "12%",
    left: "-35%",
    transform: [{ rotate: "-28deg" }],
    opacity: 0.85,
  },
  decoBeamBlue: {
    position: "absolute",
    width: 160,
    height: "85%",
    bottom: "-8%",
    right: "-6%",
    transform: [{ rotate: "12deg" }],
    opacity: 0.9,
  },
  shardGoldVert: {
    position: "absolute",
    width: 3,
    height: 220,
    top: "18%",
    right: 36,
    backgroundColor: "rgba(79,70,229,0.35)",
  },
  shardGoldHoriz: {
    position: "absolute",
    width: 100,
    height: 3,
    top: "28%",
    right: 36,
    backgroundColor: "rgba(79,70,229,0.28)",
  },
  shardBlueHoriz: {
    position: "absolute",
    width: 160,
    height: 2,
    bottom: "22%",
    left: 28,
    backgroundColor: "rgba(124,58,237,0.28)",
  },
  shardSteps: {
    position: "absolute",
    bottom: "14%",
    right: 52,
    alignItems: "flex-end",
  },
  shardStep: {
    width: 56,
    height: 4,
    marginBottom: 10,
    backgroundColor: "rgba(79,70,229,0.4)",
  },
  shardStepMid: {
    width: 40,
    backgroundColor: "rgba(148,163,184,0.35)",
  },
  shardStepLow: {
    width: 24,
    backgroundColor: "rgba(124,58,237,0.38)",
  },
  cornerTL: {
    position: "absolute",
    top: Platform.OS === "android" ? 36 : 44,
    left: 18,
    width: 44,
    height: 44,
  },
  cornerH: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 2,
    backgroundColor: "rgba(79,70,229,0.45)",
  },
  cornerV: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 2,
    height: 40,
    backgroundColor: "rgba(79,70,229,0.45)",
  },
  cornerBR: {
    position: "absolute",
    bottom: 100,
    right: 22,
    width: 44,
    height: 44,
  },
  cornerHBr: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 2,
    backgroundColor: "rgba(124,58,237,0.4)",
  },
  cornerVBr: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 2,
    height: 40,
    backgroundColor: "rgba(124,58,237,0.4)",
  },
  gridHairline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(226,232,240,0.9)",
  },
});
