import {  useEffect, useRef , useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/shellTheme";

export default function TabButton(props: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const scaleAnim = useRef(new Animated.Value(props.active ? 1 : 0.92)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: props.active ? 1 : 0.92,
      useNativeDriver: true,
      friction: 7,
      tension: 110,
    }).start();
  }, [props.active, scaleAnim]);

  return (
    <Pressable style={styles.tabButton} onPress={props.onPress}>
      <Animated.View
        style={[
          styles.iconWrap,
          props.active ? styles.tabButtonActive : null,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Ionicons name={props.icon} size={20} color={props.active ? theme.gold : theme.muted2} />
      </Animated.View>
      <Text style={[styles.tabLabel, props.active && styles.tabLabelActive]} numberOfLines={1}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  tabButton: {
    width: "16.66%",
    paddingVertical: 6,
    alignItems: "center",
    gap: 2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: theme.muted2,
    textAlign: "center",
  },
  tabLabelActive: {
    color: theme.gold,
    fontWeight: "700",
  },
  iconWrap: {
    width: 38,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "rgba(79,70,229,0.12)",
    borderWidth: 1,
    borderColor: "rgba(79,70,229,0.28)",
  },
});
