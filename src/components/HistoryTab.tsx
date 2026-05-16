import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { ImageRecord } from "../services/imageApi";
import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/shellTheme";
import ThemedButton from "./ThemedButton";

const GRID_GAP = 12;
const SCREEN_W = Dimensions.get("window").width;
const CARD_W = (SCREEN_W - 48 - GRID_GAP) / 2;

type Props = {
  username: string;
  lookCount: number | null;
  images: ImageRecord[];
  historyMessage: string | null;
  historyDeletingId: string | null;
  onReload: () => void;
  onOpenStudio: () => void;
  onFullscreen: (url: string) => void;
  onOpenVideo: (url: string) => void;
  onDelete: (item: ImageRecord) => void;
};

function itemTitle(item: ImageRecord) {
  return item.resultType === "video" ? "Video try-on" : "Generated outfit look";
}

function itemImageUrl(item: ImageRecord) {
  return item.resultUrl || item.imageUrl || null;
}

export default function HistoryTab(props: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={20} color={theme.gold} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.pageTitle}>Outfit History</Text>
          <Text style={styles.pageSubtitle}>
            Saved looks for <Text style={styles.pageSubtitleBold}>{props.username}</Text>
            {props.lookCount !== null ? (
              <Text style={styles.pageSubtitle}> · Your looks: {props.lookCount}</Text>
            ) : null}
          </Text>
        </View>
      </View>

      <ThemedButton title="Reload history" onPress={props.onReload} variant="outline" />

      {props.historyMessage ? <Text style={styles.errorText}>{props.historyMessage}</Text> : null}

      {props.images.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="images-outline" size={40} color={theme.muted2} />
          <Text style={styles.emptyTitle}>No outfits yet</Text>
          <Text style={styles.emptyBody}>Generate a try-on result in Studio to start building your history.</Text>
          <ThemedButton title="Go to Try-On Studio" onPress={props.onOpenStudio} />
        </View>
      ) : (
        <View style={styles.grid}>
          {props.images.map((item) => {
            const mediaUrl = itemImageUrl(item);
            const isVideo = item.resultType === "video";
            const deleting = props.historyDeletingId === item.id;

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.mediaWrap}>
                  {mediaUrl && !isVideo ? (
                    <Pressable style={styles.mediaPress} onPress={() => props.onFullscreen(mediaUrl)}>
                      <Image source={{ uri: mediaUrl }} style={styles.media} resizeMode="cover" />
                      <View style={styles.fullscreenChip}>
                        <Ionicons name="expand-outline" size={12} color="#ffffff" />
                        <Text style={styles.fullscreenChipText}>Full screen</Text>
                      </View>
                    </Pressable>
                  ) : isVideo && mediaUrl ? (
                    <View style={styles.videoBox}>
                      <Text style={styles.videoLabel}>Video output</Text>
                      <ThemedButton title="Open video" onPress={() => props.onOpenVideo(mediaUrl)} variant="outline" />
                    </View>
                  ) : (
                    <View style={styles.mediaPlaceholder}>
                      <Ionicons name="image-outline" size={28} color={theme.muted2} />
                    </View>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {itemTitle(item)}
                  </Text>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={13} color={theme.muted2} />
                    <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleString()}</Text>
                  </View>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => props.onDelete(item)}
                    disabled={deleting}
                  >
                    <Text style={styles.deleteText}>{deleting ? "Deleting…" : "Delete result"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    page: {
      gap: 14,
      paddingBottom: 12,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "rgba(79,70,229,0.12)",
      borderWidth: 1,
      borderColor: "rgba(79,70,229,0.25)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    pageTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.3,
    },
    pageSubtitle: {
      fontSize: 13,
      color: theme.muted,
      lineHeight: 18,
    },
    pageSubtitleBold: {
      fontWeight: "700",
      color: theme.textSecondary,
    },
    errorText: {
      color: theme.danger,
      fontSize: 13,
      textAlign: "center",
    },
    emptyCard: {
      borderRadius: 20,
      padding: 28,
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    emptyBody: {
      fontSize: 14,
      color: theme.muted,
      textAlign: "center",
      lineHeight: 21,
      marginBottom: 6,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: GRID_GAP,
    },
    card: {
      width: CARD_W,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
    },
    mediaWrap: {
      aspectRatio: 4 / 5,
      backgroundColor: theme.bgInput,
    },
    mediaPress: {
      flex: 1,
    },
    media: {
      width: "100%",
      height: "100%",
    },
    fullscreenChip: {
      position: "absolute",
      top: 8,
      right: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
    },
    fullscreenChipText: {
      color: "#ffffff",
      fontSize: 11,
      fontWeight: "600",
    },
    videoBox: {
      flex: 1,
      padding: 12,
      justifyContent: "center",
      gap: 8,
    },
    videoLabel: {
      fontSize: 12,
      color: theme.muted,
      textAlign: "center",
    },
    mediaPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    cardBody: {
      padding: 12,
      gap: 6,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.textSecondary,
      minHeight: 36,
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    timeText: {
      fontSize: 11,
      color: theme.muted2,
      flex: 1,
    },
    deleteBtn: {
      marginTop: 4,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    deleteText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.danger,
    },
  });
