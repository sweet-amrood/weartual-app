import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { DEFAULT_AVATAR_OPTIONS, findPreset } from "../config/avatarPresets";
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from "../config/legal";
import {
  removeProfileAvatar,
  updateAvatarPreset,
  updateProfile,
  uploadProfileAvatar,
  type User,
} from "../services/authApi";
import type { ImageRecord } from "../services/imageApi";
import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/shellTheme";
import { resolveMediaUrl } from "../utils/mediaUrl";
import FashionShareCardsSection from "./FashionShareCardsSection";
import ThemedButton from "./ThemedButton";

type Props = {
  user: User;
  token: string;
  images: ImageRecord[];
  lookCount: number | null;
  onLogout: () => void;
  onAuthRefresh: (result: { user: User; token?: string }) => Promise<void>;
};

async function openLegal(url: string, label: string) {
  try {
    const ok = await Linking.canOpenURL(url);
    if (!ok) {
      Alert.alert(label, `No app can open this URL:\n${url}`);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert(label, "Could not open the link.");
  }
}

export default function ProfileTab(props: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const { user, token } = props;
  const [editUsername, setEditUsername] = useState(user.username);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPassword, setEditPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileBanner, setProfileBanner] = useState<string | null>(null);
  const [presetBusy, setPresetBusy] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [removeBusy, setRemoveBusy] = useState(false);

  const avatarUri = resolveMediaUrl(user.avatarUrl ?? undefined);
  const activePreset = findPreset(user.avatarPreset);
  const hasCustomPhoto = !!user.avatarUrl;

  const applyAuth = useCallback(
    async (result: { user: User; token?: string }) => {
      await props.onAuthRefresh(result);
    },
    [props]
  );

  const onSaveProfile = async () => {
    setProfileBanner(null);
    const u = editUsername.trim();
    const e = editEmail.trim();
    if (!u || !e) {
      setProfileBanner("Username and email are required.");
      return;
    }
    const changed = u !== user.username || e !== user.email;
    if (changed && !editPassword.trim()) {
      setProfileBanner("Enter your current password to change username or email.");
      return;
    }
    setSavingProfile(true);
    try {
      const result = await updateProfile(token, {
        username: u,
        email: e,
        ...(changed ? { currentPassword: editPassword.trim() } : {}),
      });
      await applyAuth(result);
      setEditPassword("");
      setProfileBanner("Profile updated.");
    } catch (err) {
      setProfileBanner(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const onPickPreset = async (id: string) => {
    setProfileBanner(null);
    setPresetBusy(id);
    try {
      const result = await updateAvatarPreset(token, id);
      await applyAuth(result);
      setProfileBanner("Default avatar applied.");
    } catch (err) {
      setProfileBanner(err instanceof Error ? err.message : "Could not set avatar.");
    } finally {
      setPresetBusy(null);
    }
  };

  const onPickPhoto = async () => {
    setProfileBanner(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setProfileBanner("Photo library access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadBusy(true);
    try {
      const res = await uploadProfileAvatar(token, {
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
      await applyAuth(res);
      setProfileBanner("Photo updated.");
    } catch (err) {
      setProfileBanner(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadBusy(false);
    }
  };

  const renderAvatar = (size: number) => {
    const radius = Math.round(size * 0.14);
    const imgStyle = { width: size, height: size, borderRadius: radius };
    if (avatarUri) {
      return <Image source={{ uri: avatarUri }} style={imgStyle} />;
    }
    if (activePreset) {
      return <Image source={{ uri: activePreset.url }} style={imgStyle} resizeMode="cover" />;
    }
    return (
      <LinearGradient colors={["#4f46e5", "#7c3aed"]} style={[imgStyle, styles.avatarImgInner]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={[styles.avatarLetter, { fontSize: size * 0.38 }]}>{user.username?.[0]?.toUpperCase() || "U"}</Text>
      </LinearGradient>
    );
  };

  const onRemovePhoto = async () => {
    setProfileBanner(null);
    setRemoveBusy(true);
    try {
      const res = await removeProfileAvatar(token);
      await applyAuth(res);
      setProfileBanner("Photo removed.");
    } catch (err) {
      setProfileBanner(err instanceof Error ? err.message : "Could not remove photo.");
    } finally {
      setRemoveBusy(false);
    }
  };

  return (
    <View style={styles.page}>
      {profileBanner ? (
        <Text
          style={[
            styles.banner,
            profileBanner.includes("updated") ||
            profileBanner.includes("avatar") ||
            profileBanner.includes("Avatar") ||
            profileBanner.includes("uploaded") ||
            profileBanner.includes("Photo") ||
            profileBanner.includes("removed") ||
            profileBanner.includes("applied")
              ? styles.bannerOk
              : null,
          ]}
        >
          {profileBanner}
        </Text>
      ) : null}

      <View style={styles.pageHeader}>
        <View style={styles.headerAvatarWrap}>{renderAvatar(72)}</View>
        <View style={styles.pageHeaderText}>
          <Text style={styles.pageTitle}>Profile</Text>
          <Text style={styles.pageHeaderName} numberOfLines={1}>
            {user.username}
          </Text>
          <Text style={styles.pageSubtitle}>Manage your account, photo, and share your looks.</Text>
        </View>
      </View>

      <View style={styles.cardBlock}>
        <View style={styles.sectionLabelRow}>
          <Ionicons name="camera-outline" size={16} color={theme.muted} />
          <Text style={styles.sectionLabel}>Photo</Text>
        </View>

        <Text style={styles.photoHint}>
          Upload a square-ish image for best results (max 5MB, JPEG/PNG/WebP/GIF).
        </Text>

        <Text style={styles.presetLabel}>Default avatars</Text>
        <View style={styles.presetGrid}>
          {DEFAULT_AVATAR_OPTIONS.map((p) => {
            const active = user.avatarPreset === p.id && !user.avatarUrl;
            const busy = presetBusy === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => void onPickPreset(p.id)}
                disabled={busy || uploadBusy || removeBusy}
                style={[styles.presetTile, active && styles.presetTileActive]}
                accessibilityLabel={p.label}
              >
                {busy ? (
                  <ActivityIndicator color={theme.gold} size="small" />
                ) : (
                  <Image source={{ uri: p.url }} style={styles.presetThumb} resizeMode="cover" />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.photoActions}>
          <View style={styles.photoActionBtn}>
            <ThemedButton
              title={uploadBusy ? "Uploading…" : "Upload photo"}
              onPress={() => void onPickPhoto()}
              disabled={uploadBusy || presetBusy !== null || removeBusy}
              loading={uploadBusy}
            />
          </View>
          {hasCustomPhoto ? (
            <View style={styles.photoActionBtn}>
              <ThemedButton
                title={removeBusy ? "Removing…" : "Remove"}
                variant="outline"
                onPress={() => void onRemovePhoto()}
                disabled={removeBusy || uploadBusy || presetBusy !== null}
                loading={removeBusy}
              />
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.cardBlock}>
        <View style={styles.sectionLabelRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={theme.muted} />
          <Text style={styles.sectionLabel}>Account details</Text>
        </View>
        <Text style={styles.fieldLabel}>Username</Text>
        <TextInput
          value={editUsername}
          onChangeText={setEditUsername}
          autoCapitalize="none"
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={theme.placeholder}
        />
        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          value={editEmail}
          onChangeText={setEditEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.placeholder}
        />
        <Text style={styles.fieldLabel}>Current password</Text>
        <TextInput
          value={editPassword}
          onChangeText={setEditPassword}
          secureTextEntry
          style={styles.input}
          placeholder="Required only when changing username or email"
          placeholderTextColor={theme.placeholder}
        />
        <ThemedButton
          title={savingProfile ? "Saving…" : "Save changes"}
          onPress={() => void onSaveProfile()}
          loading={savingProfile}
          disabled={savingProfile}
        />
      </View>

      <FashionShareCardsSection username={user.username} token={token} />

      <Text style={styles.sectionTitle}>Legal</Text>
      <View style={styles.cardBlock}>
        <Pressable style={[styles.rowItem, styles.borderBottom]} onPress={() => void openLegal(PRIVACY_POLICY_URL, "Privacy")}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(100,116,139,0.15)" }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.muted2} />
        </Pressable>
        <Pressable style={styles.rowItem} onPress={() => void openLegal(TERMS_OF_SERVICE_URL, "Terms")}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(100,116,139,0.15)" }]}>
            <Ionicons name="document-text-outline" size={20} color={theme.textSecondary} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.muted2} />
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={props.onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>

      <Text style={styles.signedInFooter}>
        Signed in as <Text style={styles.signedInEmail}>{user.email}</Text>
        {props.lookCount !== null ? (
          <Text style={styles.signedInFooter}>{"\n"}Saved try-ons: {props.lookCount}</Text>
        ) : null}
      </Text>
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    page: {
      gap: 0,
      paddingBottom: 20,
    },
    banner: {
      textAlign: "center",
      color: theme.danger,
      fontSize: 13,
      marginBottom: 10,
      lineHeight: 19,
    },
    bannerOk: {
      color: theme.success,
    },
    pageHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 20,
    },
    headerAvatarWrap: {
      borderRadius: 16,
      padding: 3,
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.gold,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    avatarImgInner: {
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    pageHeaderText: {
      flex: 1,
      gap: 2,
    },
    pageTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.3,
    },
    pageHeaderName: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    pageSubtitle: {
      fontSize: 13,
      color: theme.muted,
      marginTop: 2,
      lineHeight: 19,
    },
    sectionLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.muted,
    },
    avatarLetter: {
      color: "#ffffff",
      fontWeight: "800",
    },
    photoHint: {
      fontSize: 13,
      color: theme.muted,
      lineHeight: 19,
      marginBottom: 14,
    },
    presetLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      color: theme.muted2,
      marginBottom: 10,
    },
    presetGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 14,
    },
    presetTile: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.chipBg,
      borderWidth: 2,
      borderColor: theme.border,
    },
    presetTileActive: {
      borderColor: theme.gold,
      backgroundColor: "rgba(79,70,229,0.1)",
    },
    presetThumb: {
      width: "100%",
      height: "100%",
    },
    photoActions: {
      flexDirection: "row",
      gap: 10,
    },
    photoActionBtn: {
      flex: 1,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 6,
      marginTop: 4,
    },
    signedInFooter: {
      textAlign: "center",
      fontSize: 11,
      color: theme.muted2,
      lineHeight: 17,
      marginBottom: 16,
    },
    signedInEmail: {
      fontWeight: "600",
      color: theme.muted,
    },
    sectionTitle: {
      marginBottom: 10,
      marginLeft: 4,
      fontSize: 16,
      fontWeight: "700",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    cardBlock: {
      backgroundColor: theme.bgElevated,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16,
    },
    rowItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 12,
    },
    borderBottom: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    logoutButton: {
      marginTop: 10,
      marginBottom: 20,
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.dangerBg,
    },
    logoutText: {
      color: theme.danger,
      fontSize: 16,
      fontWeight: "700",
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === "ios" ? 14 : 12,
      backgroundColor: theme.bgInput,
      color: theme.text,
      fontSize: 16,
      marginBottom: 4,
    },
  });
