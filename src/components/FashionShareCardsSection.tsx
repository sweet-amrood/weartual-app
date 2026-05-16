import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { cacheDirectory, downloadAsync } from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";

import { listMyImages, type ImageRecord } from "../services/imageApi";
import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/shellTheme";

const CARD_W = 280;
const CARD_H = Math.round((CARD_W * 1350) / 1080);

const VIDEO_URL_RE = /\.(mp4|webm|mov|m4v)(\?|$)/i;

function jobIsVideo(job: ImageRecord) {
  if (job.resultType === "video") return true;
  const url = String(job.resultUrl || "");
  if (VIDEO_URL_RE.test(url)) return true;
  if (/\/video\/upload\//.test(url)) return true;
  return false;
}

function possessiveName(name: string) {
  const s = String(name || "Stylist").trim() || "Stylist";
  const last = s.slice(-1).toLowerCase();
  if (last === "s") return `${s}'`;
  return `${s}'s`;
}

function FashionCardInterior({
  imageUrl,
  isVideo,
  username,
  onImageLoad,
}: {
  imageUrl: string;
  isVideo: boolean;
  username: string;
  onImageLoad?: () => void;
}) {
  const title = `${possessiveName(username)} Outfit of the Day`;
  const handle = `@${String(username || "weartual").replace(/\s+/g, "")}`;

  return (
    <LinearGradient
      colors={["#12081f", "#2a1545", "#0a0612"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={cardStyles.root}
    >
      <View style={cardStyles.header}>
        <View style={cardStyles.brandRow}>
          <LinearGradient colors={["#4f46e5", "#7c3aed"]} style={cardStyles.logoBox}>
            <Text style={cardStyles.logoLetter}>W</Text>
          </LinearGradient>
          <View>
            <Text style={cardStyles.brandName}>Weartual</Text>
            <Text style={cardStyles.brandTag}>Virtual Try-On</Text>
          </View>
        </View>
        <Ionicons name="sparkles" size={22} color="rgba(251,191,36,0.9)" />
      </View>

      <View style={cardStyles.mediaFrame}>
        {imageUrl ? (
          isVideo ? (
            <View style={cardStyles.videoPlaceholder}>
              <Ionicons name="play-circle" size={56} color="rgba(255,255,255,0.85)" />
              <Text style={cardStyles.videoLabel}>Video look</Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={cardStyles.mediaImage}
              resizeMode="contain"
              onLoad={onImageLoad}
              onError={onImageLoad}
            />
          )
        ) : (
          <View style={cardStyles.emptyMedia}>
            <Ionicons name="image-outline" size={48} color="rgba(167,139,250,0.4)" />
          </View>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.88)"]}
          style={cardStyles.mediaGradient}
          pointerEvents="none"
        />
        <View style={cardStyles.mediaCaption}>
          <Text style={cardStyles.outfitTitle}>{title}</Text>
          <Text style={cardStyles.handle}>{handle}</Text>
        </View>
      </View>

      <View style={cardStyles.footer}>
        <View style={cardStyles.footerLine} />
        <Text style={cardStyles.footerText}>Made with Weartual</Text>
      </View>
    </LinearGradient>
  );
}

const cardStyles = StyleSheet.create({
  root: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 4,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    fontStyle: "italic",
  },
  brandName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  brandTag: {
    color: "rgba(196,181,253,0.9)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 2,
    textTransform: "uppercase",
  },
  mediaFrame: {
    flex: 1,
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(30,20,50,0.9)",
  },
  videoLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyMedia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  mediaCaption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    paddingTop: 40,
  },
  outfitTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    fontStyle: "italic",
    lineHeight: 22,
  },
  handle: {
    marginTop: 6,
    color: "rgba(251,191,36,0.95)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 12,
    paddingHorizontal: 14,
  },
  footerLine: {
    width: "50%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 8,
  },
  footerText: {
    color: "rgba(196,181,253,0.75)",
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});

type Props = {
  username: string;
  token: string;
};

export default function FashionShareCardsSection(props: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [jobs, setJobs] = useState<ImageRecord[]>([]);
  const [loadingLooks, setLoadingLooks] = useState(true);
  const [looksError, setLooksError] = useState("");
  const [lookIndex, setLookIndex] = useState(0);
  const [imageReady, setImageReady] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [socialHint, setSocialHint] = useState("");
  const cardCaptureRef = useRef<View>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLooksError("");
      setLoadingLooks(true);
      try {
        const arr = await listMyImages(props.token);
        if (cancelled) return;
        const withResults = arr.filter((j) => String(j.resultUrl || "").trim().length > 0);
        setJobs(withResults);
        setLookIndex(0);
      } catch (e) {
        if (!cancelled) setLooksError(e instanceof Error ? e.message : "Could not load your looks.");
      } finally {
        if (!cancelled) setLoadingLooks(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.token]);

  const selected = useMemo(() => {
    if (jobs.length === 0) return null;
    const i = Math.min(Math.max(0, lookIndex), jobs.length - 1);
    return jobs[i];
  }, [jobs, lookIndex]);

  const imageUrl = selected?.resultUrl || "";
  const selectedIsVideo = selected ? jobIsVideo(selected) : false;
  const safeUsername = props.username || "stylist";

  const canGoNewer = lookIndex > 0;
  const canGoOlder = jobs.length > 0 && lookIndex < jobs.length - 1;

  useEffect(() => {
    setImageReady(false);
    setSocialHint("");
    if (selectedIsVideo || !imageUrl) {
      setImageReady(true);
    }
  }, [imageUrl, selectedIsVideo]);

  const captureCardPng = useCallback(async () => {
    const node = cardCaptureRef.current;
    if (!node) throw new Error("Card not ready");
    return captureRef(node, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });
  }, []);

  const downloadRemoteVideo = useCallback(async () => {
    if (!imageUrl) throw new Error("Video not ready");
    const slug = String(safeUsername).replace(/[^\w-]+/g, "-");
    const dest = `${cacheDirectory}weartual-${slug}-outfit.mp4`;
    const res = await downloadAsync(imageUrl, dest);
    return res.uri;
  }, [imageUrl, safeUsername]);

  const ensureMediaPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync(true, ["photo", "video"]);
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow photo library access so Weartual can save your try-on card or video."
      );
      return false;
    }
    return true;
  };

  const handleDownload = async () => {
    setSocialHint("");
    setExportBusy(true);
    try {
      const allowed = await ensureMediaPermission();
      if (!allowed) return;

      if (selectedIsVideo) {
        const uri = await downloadRemoteVideo();
        await MediaLibrary.saveToLibraryAsync(uri);
        setSocialHint("Video saved to your gallery.");
      } else {
        const uri = await captureCardPng();
        await MediaLibrary.saveToLibraryAsync(uri);
        setSocialHint("Card saved to your gallery.");
      }
    } catch (e) {
      setSocialHint(e instanceof Error ? e.message : "Could not save to gallery.");
    } finally {
      setExportBusy(false);
    }
  };

  const shareFile = async (dialogTitle: string) => {
    if (selectedIsVideo) {
      const uri = await downloadRemoteVideo();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "video/mp4", dialogTitle });
        return true;
      }
    } else {
      const uri = await captureCardPng();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle });
        return true;
      }
    }
    return false;
  };

  const handleCopyLink = async () => {
    if (!imageUrl) return;
    setSocialHint("");
    try {
      await Clipboard.setStringAsync(imageUrl);
      setSocialHint(
        selectedIsVideo
          ? "Outfit video link copied — paste it in chat, email, or notes."
          : "Outfit image link copied — paste it in chat, email, or notes."
      );
    } catch {
      setSocialHint("Could not copy link.");
    }
  };

  const handleShare = async () => {
    setSocialHint("");
    setExportBusy(true);
    try {
      const shared = await shareFile("Share look");
      if (shared) {
        setSocialHint("Pick an app from the share menu.");
      } else {
        setSocialHint("Sharing is not available on this device.");
      }
    } catch (e) {
      if ((e as { message?: string })?.message !== "User did not share") {
        setSocialHint(e instanceof Error ? e.message : "Could not share.");
      }
    } finally {
      setExportBusy(false);
    }
  };

  const shareActionsDisabled =
    exportBusy || !imageUrl || (!selectedIsVideo && !imageReady);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="share-social-outline" size={16} color={theme.muted} />
        <Text style={styles.sectionLabel}>Shareable fashion cards</Text>
      </View>
      <Text style={styles.sectionDesc}>
        Browse every saved try-on (photos and videos). Images export as a polished 4:5 card; videos download or share as
        MP4 with the same branded preview frame.
      </Text>

      {looksError ? <Text style={styles.errorText}>{looksError}</Text> : null}

      {loadingLooks ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.gold} />
          <Text style={styles.loadingText}>Loading your looks…</Text>
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="images-outline" size={36} color={theme.muted2} />
          <Text style={styles.emptyTitle}>No saved outfit results yet</Text>
          <Text style={styles.emptyBody}>Generate a photo or video look in Try-On Studio — it will appear here for sharing.</Text>
        </View>
      ) : (
        <>
          <View style={styles.previewBlock}>
            <Text style={styles.blockLabel}>Card preview</Text>
            <Text style={styles.carouselHint}>Latest look first — use arrows for older try-ons.</Text>
            <View style={styles.previewShell}>
              <View ref={cardCaptureRef} collapsable={false} style={styles.previewScale}>
                <FashionCardInterior
                  imageUrl={imageUrl}
                  isVideo={selectedIsVideo}
                  username={safeUsername}
                  onImageLoad={() => setImageReady(true)}
                />
              </View>
            </View>
            <View style={styles.navRow}>
              <Pressable
                style={[styles.navBtn, !canGoNewer && styles.navBtnDisabled]}
                onPress={() => setLookIndex((i) => Math.max(0, i - 1))}
                disabled={!canGoNewer}
                accessibilityLabel="Newer look"
              >
                <Ionicons name="chevron-back" size={22} color={theme.textSecondary} />
              </Pressable>
              <Text style={styles.counter}>
                {lookIndex + 1} / {jobs.length} · {selectedIsVideo ? "Video" : "Image"}
              </Text>
              <Pressable
                style={[styles.navBtn, !canGoOlder && styles.navBtnDisabled]}
                onPress={() => setLookIndex((i) => Math.min(jobs.length - 1, i + 1))}
                disabled={!canGoOlder}
                accessibilityLabel="Older look"
              >
                <Ionicons name="chevron-forward" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.previewMeta}>1080×1350 export size</Text>
          </View>

          <View style={styles.downloadBlock}>
            <Pressable
              style={[
                styles.downloadBtn,
                (exportBusy || !imageUrl || (!selectedIsVideo && !imageReady)) && styles.shareTileDisabled,
              ]}
              onPress={() => void handleDownload()}
              disabled={exportBusy || !imageUrl || (!selectedIsVideo && !imageReady)}
            >
              {exportBusy ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="download-outline" size={22} color="#ffffff" />
              )}
              <Text style={styles.downloadBtnText}>
                {exportBusy ? "Preparing…" : selectedIsVideo ? "Download video" : "Download card"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.shareBlock}>
            <Text style={styles.shareToLabel}>Share</Text>
            <View style={styles.shareActionsRow}>
              <Pressable
                style={[styles.shareActionBtn, styles.shareActionPrimary, shareActionsDisabled && styles.shareTileDisabled]}
                onPress={() => void handleShare()}
                disabled={shareActionsDisabled}
              >
                <Ionicons name="share-outline" size={20} color="#ffffff" />
                <Text style={styles.shareActionPrimaryText}>Share</Text>
              </Pressable>
              <Pressable
                style={[styles.shareActionBtn, styles.shareActionOutline, (exportBusy || !imageUrl) && styles.shareTileDisabled]}
                onPress={() => void handleCopyLink()}
                disabled={exportBusy || !imageUrl}
              >
                <Ionicons name="link-outline" size={20} color={theme.gold} />
                <Text style={styles.shareActionOutlineText}>Copy link</Text>
              </Pressable>
            </View>
          </View>

          {!imageReady && imageUrl && !selectedIsVideo ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.muted} />
              <Text style={styles.loadingTextSmall}>Loading outfit preview for export…</Text>
            </View>
          ) : null}
        </>
      )}

      {socialHint ? <Text style={styles.hintOk}>{socialHint}</Text> : null}
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    section: {
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 10,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.muted,
    },
    sectionDesc: {
      fontSize: 13,
      color: theme.muted,
      lineHeight: 20,
    },
    errorText: {
      color: theme.danger,
      fontSize: 13,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 24,
    },
    loadingText: {
      color: theme.muted,
      fontSize: 14,
    },
    loadingTextSmall: {
      color: theme.muted,
      fontSize: 12,
    },
    emptyBox: {
      borderRadius: 14,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.border,
      padding: 24,
      alignItems: "center",
      gap: 8,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    emptyBody: {
      fontSize: 12,
      color: theme.muted,
      textAlign: "center",
      lineHeight: 18,
    },
    previewBlock: {
      borderRadius: 16,
      padding: 14,
      gap: 10,
      backgroundColor: theme.bgInput,
      borderWidth: 1,
      borderColor: theme.border,
    },
    blockLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.7,
      textTransform: "uppercase",
      color: theme.muted2,
    },
    carouselHint: {
      fontSize: 12,
      color: theme.muted,
      textAlign: "center",
      lineHeight: 18,
    },
    previewShell: {
      alignSelf: "center",
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#4f46e5",
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    previewScale: {
      width: CARD_W,
      height: CARD_H,
    },
    navRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
      paddingHorizontal: 8,
    },
    navBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.bgInput,
      borderWidth: 1,
      borderColor: theme.border,
    },
    navBtnDisabled: {
      opacity: 0.35,
    },
    counter: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    previewMeta: {
      textAlign: "center",
      fontSize: 10,
      color: theme.muted2,
      letterSpacing: 0.3,
    },
    downloadBlock: {
      marginTop: 2,
    },
    downloadBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: "rgba(79,70,229,0.9)",
      borderWidth: 1,
      borderColor: "rgba(124,58,237,0.45)",
    },
    downloadBtnText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "700",
    },
    shareBlock: {
      borderRadius: 16,
      padding: 14,
      gap: 12,
      backgroundColor: theme.bgInput,
      borderWidth: 1,
      borderColor: theme.border,
    },
    shareToLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.muted2,
    },
    shareActionsRow: {
      flexDirection: "row",
      gap: 10,
    },
    shareActionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
    },
    shareActionPrimary: {
      backgroundColor: "rgba(79,70,229,0.9)",
      borderWidth: 1,
      borderColor: "rgba(124,58,237,0.45)",
    },
    shareActionPrimaryText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "700",
    },
    shareActionOutline: {
      backgroundColor: theme.bgElevated,
      borderWidth: 1,
      borderColor: theme.border,
    },
    shareActionOutlineText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontWeight: "700",
    },
    shareTileDisabled: {
      opacity: 0.42,
    },
    hintOk: {
      fontSize: 13,
      color: theme.success,
      lineHeight: 19,
    },
  });
