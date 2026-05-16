import { Ionicons } from "@expo/vector-icons";
import { APP_ICON } from "../config/branding";
import { StatusBar } from "expo-status-bar";
import {  useEffect, useRef, useState , useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { requestPasswordReset } from "../services/authApi";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ShellBackground from "./ShellBackground";
import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/shellTheme";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  username: string;
  setUsername: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
};

export default function AuthScreen(props: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 520,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const openForgot = () => {
    setForgotEmail(props.email.trim());
    setForgotMessage(null);
    setForgotError(null);
    setForgotOpen(true);
  };

  const submitForgot = async () => {
    const em = forgotEmail.trim();
    if (!em) {
      setForgotError("Enter your email.");
      return;
    }
    setForgotBusy(true);
    setForgotError(null);
    try {
      await requestPasswordReset({ email: em });
      setForgotMessage("If an account exists for that email, you will receive reset instructions.");
    } catch (e) {
      setForgotError(e instanceof Error ? e.message : "Could not send reset email.");
    } finally {
      setForgotBusy(false);
    }
  };

  const isSignup = props.mode === "signup";

  return (
    <View style={styles.wrap}>
      <ShellBackground />
      <View style={[styles.safeArea, { paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
            <Image source={APP_ICON} style={styles.brandMark} resizeMode="contain" />
            <Text style={styles.headline}>{isSignup ? "Create an account" : "Welcome back"}</Text>
            <Text style={styles.subline}>
              {isSignup
                ? "Join Weartual and experience the future of digital fashion."
                : "Enter your details to access your virtual try-on experience."}
            </Text>
          </Animated.View>

          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <View style={styles.tabRow}>
              <Pressable
                style={[styles.tab, props.mode === "login" && styles.tabActive]}
                onPress={() => props.setMode("login")}
              >
                <Text style={[styles.tabText, props.mode === "login" && styles.tabTextActive]}>Sign In</Text>
              </Pressable>
              <Pressable
                style={[styles.tab, props.mode === "signup" && styles.tabActive]}
                onPress={() => props.setMode("signup")}
              >
                <Text style={[styles.tabText, props.mode === "signup" && styles.tabTextActive]}>Sign up</Text>
              </Pressable>
            </View>

            {isSignup ? (
              <View style={styles.field}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={theme.muted} style={styles.inputIcon} />
                  <TextInput
                    value={props.username}
                    onChangeText={props.setUsername}
                    placeholder="Choose a username"
                    placeholderTextColor={theme.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>{isSignup ? "Email" : "Email Address"}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={theme.muted} style={styles.inputIcon} />
                <TextInput
                  value={props.email}
                  onChangeText={props.setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.placeholder}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                {!isSignup ? (
                  <Pressable onPress={openForgot} hitSlop={8}>
                    <Text style={styles.link}>Forgot password?</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.muted} style={styles.inputIcon} />
                <TextInput
                  value={props.password}
                  onChangeText={props.setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.placeholder}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                />
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  style={styles.eyeBtn}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.muted2} />
                </Pressable>
              </View>
            </View>

            {isSignup ? (
              <View style={styles.field}>
                <Text style={styles.label}>Confirm password</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={theme.muted} style={styles.inputIcon} />
                  <TextInput
                    value={props.confirmPassword}
                    onChangeText={props.setConfirmPassword}
                    placeholder="Repeat password"
                    placeholderTextColor={theme.placeholder}
                    secureTextEntry={!showConfirm}
                    style={styles.input}
                  />
                  <Pressable
                    onPress={() => setShowConfirm((s) => !s)}
                    style={styles.eyeBtn}
                    accessibilityLabel={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={theme.muted2} />
                  </Pressable>
                </View>
              </View>
            ) : null}

            {props.error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={theme.danger} />
                <Text style={styles.errorText}>{props.error}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.primaryBtn, props.submitting && styles.primaryBtnDisabled]}
              onPress={props.onSubmit}
              disabled={props.submitting}
            >
              {props.submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>{isSignup ? "Create Account" : "Sign In"}</Text>
              )}
            </Pressable>
          </Animated.View>

          <Pressable onPress={() => props.setMode(isSignup ? "login" : "signup")} style={styles.footerLink}>
            <Text style={styles.footer}>
              {isSignup ? "Already have an account? " : "Don't have an account? "}
              <Text style={styles.footerLinkAccent}>{isSignup ? "Sign In" : "Sign up for free"}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={forgotOpen} transparent animationType="fade" onRequestClose={() => setForgotOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setForgotOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Reset password</Text>
            <Text style={styles.modalBody}>We will email a reset link if this address is registered.</Text>
            <TextInput
              value={forgotEmail}
              onChangeText={setForgotEmail}
              placeholder="Email"
              placeholderTextColor={theme.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.modalInput}
            />
            {forgotError ? <Text style={styles.modalError}>{forgotError}</Text> : null}
            {forgotMessage ? <Text style={styles.modalOk}>{forgotMessage}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondary} onPress={() => setForgotOpen(false)}>
                <Text style={styles.modalSecondaryText}>Close</Text>
              </Pressable>
              <Pressable style={styles.modalPrimary} onPress={() => void submitForgot()} disabled={forgotBusy}>
                {forgotBusy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.modalPrimaryText}>Send link</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
    zIndex: 2,
  },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "android" ? 48 : 56,
    paddingBottom: 40,
    gap: 20,
  },
  hero: {
    gap: 10,
    marginBottom: 8,
  },
  brandMark: {
    alignSelf: "flex-start",
    width: 56,
    height: 56,
    marginBottom: 4,
    borderRadius: 16,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: theme.goldDeep,
    fontWeight: "600",
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.text,
    letterSpacing: -0.5,
  },
  subline: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.muted,
    maxWidth: 340,
  },
  card: {
    backgroundColor: theme.bgElevated,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 14,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: theme.chipBg,
    borderRadius: 14,
    padding: 4,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.muted,
  },
  tabTextActive: {
    color: theme.goldDeep,
  },
  field: {
    gap: 6,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.textSecondary,
  },
  link: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.gold,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.bgInput,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 16,
    color: theme.text,
  },
  eyeBtn: {
    padding: 8,
    marginRight: -4,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.dangerBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    flex: 1,
    color: theme.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: theme.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  footerLink: {
    marginTop: 8,
    alignItems: "center",
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
    color: theme.muted,
    lineHeight: 20,
  },
  footerLinkAccent: {
    fontWeight: "700",
    color: theme.gold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: theme.bgElevated,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.text,
  },
  modalBody: {
    fontSize: 14,
    color: theme.muted,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: theme.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 16,
    color: theme.text,
    marginTop: 4,
  },
  modalError: {
    color: theme.danger,
    fontSize: 13,
  },
  modalOk: {
    color: theme.success,
    fontSize: 13,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalSecondaryText: {
    color: theme.muted,
    fontWeight: "600",
    fontSize: 15,
  },
  modalPrimary: {
    backgroundColor: theme.gold,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: "center",
  },
  modalPrimaryText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },
});
