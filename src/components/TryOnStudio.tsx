import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useMemo } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { ImageRecord } from "../services/imageApi";
import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/shellTheme";
import LiveTryOnPanel from "./LiveTryOnPanel";
import ThemedButton from "./ThemedButton";

export type PersonInputMode = "image" | "video" | "live";

export const STUDIO_PROGRESS_STAGES = ["Detecting pose...", "Applying cloth...", "Refining output..."];

type Props = {
  token: string;
  imageAsset: ImagePicker.ImagePickerAsset | null;
  garmentAsset: ImagePicker.ImagePickerAsset | null;
  personInputMode: PersonInputMode;
  onPersonInputModeChange: (mode: PersonInputMode) => void;
  onPickPerson: () => void;
  onPickGarment: () => void;
  onLiveCapturedFrame: (uri: string) => void;
  onGenerate: () => void;
  uploading: boolean;
  uploadMessage: string | null;
  studioStageIndex: number;
  studioResult: ImageRecord | null;
  studioResultAspect: number;
  onClearResult: () => void;
  onOpenHistory: () => void;
  onOpenVideo: (url: string) => void;
};

function assetIsVideo(asset: ImagePicker.ImagePickerAsset | null) {
  if (!asset) return false;
  const mime = String(asset.mimeType || "").toLowerCase();
  if (mime.startsWith("video/")) return true;
  return /\.(mp4|webm|mov|m4v)$/i.test(asset.fileName || asset.uri || "");
}

/** Soft pulse behind hero — only while generating. */
function GeneratingHeroGlow() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const pulse = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    b.start();
    return () => b.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[
        styles.heroGlow,
        {
          opacity: pulse,
        },
      ]}
    />
  );
}

/** Expanding rings behind the hero icon — only while output is generating. */
function HeroWaveRings() {
  const delays = [0, 650, 1300];
  return (
    <>
      {delays.map((delay) => (
        <WaveRing key={delay} delayMs={delay} />
      ))}
    </>
  );
}

function WaveRing({ delayMs }: { delayMs: number }) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const scale = useRef(new Animated.Value(0.96)).current;
  const opacity = useRef(new Animated.Value(0.42)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.38,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0.96, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.42, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delayMs, opacity, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.heroWaveRing,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

export default function TryOnStudio(props: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const personIsVideo = assetIsVideo(props.imageAsset);
  const bothReady =
    props.personInputMode !== "live" &&
    !!(props.imageAsset && props.garmentAsset) &&
    !props.uploading;

  const tips = [
    "Natural light helps edge detail.",
    "Face the camera for cleaner fit.",
    "Flat-lay garments map best.",
  ];
  const tipIndex = props.studioStageIndex % tips.length;

  return (
    <View style={styles.card}>
      <View style={styles.heroBlock}>
        {props.uploading ? <GeneratingHeroGlow /> : null}

        <View style={styles.heroRingWrap}>
          {props.uploading ? <HeroWaveRings /> : null}
          <View style={styles.heroIconInner}>
            <Ionicons name="shirt-outline" size={30} color="#ffffff" />
          </View>
        </View>

        <Text style={styles.studioBadge}>Weartual Neural Engine v2.0</Text>
        <Text style={styles.cardTitle}>Achieve flawless fits.</Text>
        <Text style={styles.cardTitleSub}>Powered by WEARTUAL.</Text>
        <Text style={styles.helperText}>
          Upload your person frame and garment still, then generate a realistic try-on preview.
        </Text>
      </View>

      {props.uploading ? (
        <View style={styles.tipBanner}>
          <Animated.Text style={styles.tipBannerText}>{tips[tipIndex]}</Animated.Text>
        </View>
      ) : null}

      <View style={styles.inputStack}>
        <View style={styles.inputCard}>
          <Text style={styles.inputCardLabel}>Person input</Text>
          <View style={styles.modeTabs} accessibilityRole="tablist">
            {(
              [
                { id: "image" as const, label: "Image", icon: "image-outline" as const },
                { id: "video" as const, label: "Video", icon: "videocam-outline" as const },
                { id: "live" as const, label: "Live try-on", icon: "camera-outline" as const },
              ] as const
            ).map((tab) => {
              const active = props.personInputMode === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[styles.modeTab, active && styles.modeTabActive]}
                  onPress={() => props.onPersonInputModeChange(tab.id)}
                >
                  <Ionicons name={tab.icon} size={14} color={active ? theme.text : theme.muted} />
                  <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {props.personInputMode === "live" ? (
            <LiveTryOnPanel
              token={props.token}
              garmentAsset={props.garmentAsset}
              onCapturedFrame={props.onLiveCapturedFrame}
            />
          ) : props.imageAsset ? (
            personIsVideo ? (
              <Video
                source={{ uri: props.imageAsset.uri }}
                style={styles.previewImageLarge}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
              />
            ) : (
              <Image source={{ uri: props.imageAsset.uri }} style={styles.previewImageLarge} />
            )
          ) : (
            <Pressable style={styles.placeholderBox} onPress={props.onPickPerson}>
              <Ionicons name="person-outline" size={32} color={theme.muted2} />
              <Text style={styles.placeholderText}>Click to upload</Text>
            </Pressable>
          )}

          {props.personInputMode !== "live" ? (
            <ThemedButton
              title={props.imageAsset ? "Replace person" : "Upload person"}
              onPress={props.onPickPerson}
              variant="outline"
            />
          ) : null}
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputCardLabel}>Garment Image</Text>
          {props.garmentAsset ? (
            <Image source={{ uri: props.garmentAsset.uri }} style={styles.previewImageLarge} />
          ) : (
            <View style={styles.placeholderBox}>
              <Ionicons name="shirt-outline" size={32} color={theme.muted2} />
              <Text style={styles.placeholderText}>Click to upload</Text>
            </View>
          )}
          <ThemedButton title={props.garmentAsset ? "Replace garment" : "Upload garment"} onPress={props.onPickGarment} variant="outline" />
        </View>
      </View>

      <View style={[styles.generateWrap, bothReady && styles.generateWrapReady]}>
        <ThemedButton
          title={props.uploading ? "Generating..." : "Generate Try-On"}
          onPress={props.onGenerate}
          disabled={props.uploading}
          loading={props.uploading}
        />
      </View>

      {props.uploading ? (
        <View style={styles.progressRow}>
          {STUDIO_PROGRESS_STAGES.map((stage, idx) => (
            <View
              key={stage}
              style={[styles.progressPill, props.studioStageIndex === idx ? styles.progressPillActive : null]}
            >
              <Text style={props.studioStageIndex === idx ? styles.progressTextActive : styles.progressText}>{stage}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {props.uploadMessage ? <Text style={styles.msgText}>{props.uploadMessage}</Text> : null}

      {props.studioResult ? (
        <View style={styles.resultWrap}>
          <Text style={styles.resultSectionLabel}>Result Preview</Text>
          <Text style={styles.helperText}>
            {props.studioResult.resultType === "video" ? "Video try-on is ready." : "Image try-on is ready."}
          </Text>
          {props.studioResult.resultType === "video" && props.studioResult.resultUrl ? (
            <ThemedButton title="Open video" onPress={() => props.onOpenVideo(props.studioResult!.resultUrl!)} />
          ) : props.studioResult.resultUrl ? (
            <Image
              source={{ uri: props.studioResult.resultUrl }}
              style={[styles.studioResultImage, { aspectRatio: props.studioResultAspect }]}
            />
          ) : null}
          <View style={styles.resultActionsRow}>
            <View style={styles.resultActionBtn}>
              <ThemedButton title="History" onPress={props.onOpenHistory} variant="outline" />
            </View>
            <View style={styles.resultActionBtn}>
              <ThemedButton title="New try-on" onPress={props.onClearResult} variant="outline" />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    gap: 14,
    backgroundColor: theme.bgElevated + "cc",
    borderWidth: 1,
    borderColor: theme.border,
  },
  heroBlock: {
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  heroGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(79,70,229,0.18)",
    top: -40,
  },
  heroRingWrap: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroWaveRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: "rgba(79,70,229,0.38)",
  },
  heroIconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(51,65,85,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.22)",
  },
  studioBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.gold,
    backgroundColor: "rgba(79,70,229,0.12)",
    borderWidth: 1,
    borderColor: "rgba(79,70,229,0.35)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.text,
    textAlign: "center",
  },
  cardTitleSub: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.gold,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  inputStack: {
    gap: 14,
  },
  inputCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    backgroundColor: theme.bgInput,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inputCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.muted,
  },
  modeTabs: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    gap: 4,
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 9,
  },
  modeTabActive: {
    backgroundColor: theme.bgInput,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modeTabText: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.muted,
  },
  modeTabTextActive: {
    color: theme.text,
    fontWeight: "700",
  },
  helperText: {
    textAlign: "center",
    color: theme.muted,
    lineHeight: 20,
    fontSize: 14,
  },
  tipBanner: {
    backgroundColor: "rgba(79,70,229,0.08)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(79,70,229,0.2)",
  },
  tipBannerText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  previewImageLarge: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    backgroundColor: theme.bgInput,
    borderWidth: 1,
    borderColor: theme.border,
  },
  placeholderBox: {
    height: 160,
    borderRadius: 14,
    backgroundColor: theme.bgInput,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  placeholderText: {
    color: theme.muted2,
    fontSize: 12,
    fontWeight: "600",
  },
  generateWrap: {
    borderRadius: 16,
    padding: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  generateWrapReady: {
    borderColor: "rgba(79,70,229,0.55)",
    backgroundColor: "rgba(79,70,229,0.04)",
  },
  progressRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  progressPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: theme.bgInput,
    borderWidth: 1,
    borderColor: theme.border,
  },
  progressPillActive: {
    borderColor: theme.gold,
    backgroundColor: "rgba(79,70,229,0.1)",
  },
  progressText: {
    fontSize: 11,
    color: theme.muted,
    fontWeight: "600",
  },
  progressTextActive: {
    fontSize: 11,
    color: theme.gold,
    fontWeight: "800",
  },
  msgText: {
    textAlign: "center",
    color: theme.muted,
    fontSize: 13,
  },
  resultSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.muted,
  },
  resultWrap: {
    marginTop: 6,
    gap: 12,
    backgroundColor: theme.bgInput,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  studioResultImage: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: theme.bgInput,
    borderWidth: 1,
    borderColor: theme.border,
  },
  resultActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  resultActionBtn: {
    flex: 1,
  },
});
