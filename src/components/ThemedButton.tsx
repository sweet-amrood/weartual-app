import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/shellTheme";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "outline";
};

export default function ThemedButton({ title, onPress, disabled, loading, variant = "primary" }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const outline = variant === "outline";
  const inactive = disabled || loading;
  return (
    <Pressable
      style={[styles.base, outline ? styles.outline : styles.primary, inactive && styles.disabled]}
      onPress={onPress}
      disabled={inactive}
    >
      {loading ? (
        <ActivityIndicator color={outline ? theme.gold : "#ffffff"} />
      ) : (
        <Text style={[styles.label, outline ? styles.labelOutline : styles.labelPrimary]}>{title}</Text>
      )}
    </Pressable>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  primary: {
    backgroundColor: theme.gold,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.border,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  labelPrimary: {
    color: "#ffffff",
  },
  labelOutline: {
    color: theme.textSecondary,
  },
});
