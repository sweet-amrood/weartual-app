import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { buildLiveTryOnHtml } from "../liveTryOn/buildLiveTryOnHtml";
import {
  formatLiveSessionDuration,
  resolveDecartRealtimeApiKey,
} from "../services/decartRealtime";
import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/shellTheme";
import { sanitizePublicErrorMessage } from "../utils/publicErrorMessage";

type GarmentAsset = {
  uri: string;
  mimeType?: string | null;
};

type Props = {
  token: string;
  garmentAsset: GarmentAsset | null;
  onCapturedFrame: (uri: string) => void;
  onDisconnect?: () => void;
};

type WebMessage =
  | { type: "ready" }
  | { type: "status"; message: string }
  | { type: "connected" }
  | { type: "tick"; totalSeconds: number }
  | { type: "sessionEnd"; generationSeconds: number; wallSeconds: number }
  | { type: "capture"; dataUrl: string }
  | { type: "error"; message: string };

/**
 * Must match an entry in the server's Decart allowedOrigins (CLIENT_URL / DECART_REALTIME_ALLOWED_ORIGINS).
 * Default aligns with Vite dev: http://localhost:5173
 */
const WEBVIEW_BASE_URL = (() => {
  const raw = process.env.EXPO_PUBLIC_WEB_CLIENT_URL?.trim();
  if (raw) {
    return raw.endsWith("/") ? raw : `${raw}/`;
  }
  return "http://localhost:5173/";
})();

export default function LiveTryOnPanel(props: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const webRef = useRef<WebView>(null);
  const html = useMemo(() => buildLiveTryOnHtml(), []);
  const pendingConnectRef = useRef<{
    apiKey: string;
    modelId: string;
    garmentDataUrl: string;
  } | null>(null);

  const [webReady, setWebReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
  const [liveError, setLiveError] = useState("");
  const [liveStatus, setLiveStatus] = useState("");
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [sessionSummary, setSessionSummary] = useState("");

  const sessionOpen = connecting || liveActive;

  const postToWeb = useCallback((payload: Record<string, unknown>) => {
    const js = `
      (function() {
        try {
          const data = ${JSON.stringify(payload)};
          if (!window.__liveTryOn) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Live engine still loading. Wait a moment and tap Connect again.'
            }));
            return;
          }
          if (data.type === 'connect') window.__liveTryOn.connect(data);
          else if (data.type === 'disconnect') window.__liveTryOn.disconnect();
          else if (data.type === 'captureFrame') window.__liveTryOn.captureFrame();
        } catch (e) {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: String(e) }));
        }
      })();
      true;
    `;
    webRef.current?.injectJavaScript(js);
  }, []);

  const flushPendingConnect = useCallback(() => {
    const pending = pendingConnectRef.current;
    if (!pending || !webReady) return;
    postToWeb({ type: "connect", ...pending });
    pendingConnectRef.current = null;
  }, [postToWeb, webReady]);

  useEffect(() => {
    flushPendingConnect();
  }, [flushPendingConnect, webReady]);

  const garmentToDataUrl = useCallback(async (asset: GarmentAsset) => {
    const mime = asset.mimeType || "image/jpeg";
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:${mime};base64,${base64}`;
  }, []);

  const ensureCameraPermission = async () => {
    const current = await Camera.getCameraPermissionsAsync();
    if (current.granted) return true;
    const requested = await Camera.requestCameraPermissionsAsync();
    return requested.granted;
  };

  const handleConnect = useCallback(async () => {
    if (!props.garmentAsset) {
      setLiveError("Add a garment image first — live try-on needs a reference outfit.");
      return;
    }

    const cameraOk = await ensureCameraPermission();
    if (!cameraOk) {
      setLiveError("Camera permission is required for live try-on. Enable it in Settings and try again.");
      return;
    }

    setConnecting(true);
    setLiveActive(false);
    setLiveError("");
    setSessionSummary("");
    setLiveSeconds(0);
    setLiveStatus("Starting live session…");

    try {
      const { apiKey, modelId } = await resolveDecartRealtimeApiKey(props.token);
      const garmentDataUrl = await garmentToDataUrl(props.garmentAsset);
      const payload = { apiKey, modelId, garmentDataUrl };

      if (!webReady) {
        pendingConnectRef.current = payload;
        setLiveStatus("Loading live engine…");
        return;
      }

      postToWeb({ type: "connect", ...payload });
    } catch (e) {
      setConnecting(false);
      setLiveActive(false);
      setLiveStatus("");
      setLiveError(sanitizePublicErrorMessage(e instanceof Error ? e.message : "Could not start live try-on."));
    }
  }, [garmentToDataUrl, postToWeb, props.garmentAsset, props.token, webReady]);

  const handleDisconnect = useCallback(() => {
    pendingConnectRef.current = null;
    postToWeb({ type: "disconnect" });
    setLiveActive(false);
    setConnecting(false);
    setLiveStatus("");
    props.onDisconnect?.();
  }, [postToWeb, props]);

  const handleCapture = useCallback(() => {
    postToWeb({ type: "captureFrame" });
  }, [postToWeb]);

  const onWebMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let data: WebMessage;
      try {
        data = JSON.parse(event.nativeEvent.data) as WebMessage;
      } catch {
        return;
      }

      if (data.type === "ready") {
        setWebReady(true);
        setLiveStatus((s) => (s === "Loading live engine…" ? "Opening camera…" : s));
        return;
      }

      if (data.type === "status") {
        setLiveStatus(data.message);
        return;
      }

      if (data.type === "connected") {
        setConnecting(false);
        setLiveActive(true);
        setLiveError("");
        setLiveStatus("Live try-on active");
        return;
      }

      if (data.type === "tick") {
        setLiveSeconds(Math.max(0, Number(data.totalSeconds) || 0));
        return;
      }

      if (data.type === "sessionEnd") {
        setLiveActive(false);
        setConnecting(false);
        setLiveStatus("");
        const durationSec =
          data.generationSeconds > 0 ? data.generationSeconds : data.wallSeconds;
        if (durationSec > 0) {
          setSessionSummary(`Live try-on ended · ${formatLiveSessionDuration(durationSec)}`);
        }
        props.onDisconnect?.();
        return;
      }

      if (data.type === "capture") {
        (async () => {
          try {
            const match = /^data:image\/\w+;base64,(.+)$/.exec(data.dataUrl);
            if (!match) throw new Error("Invalid capture data");
            const path = `${FileSystem.cacheDirectory}live-tryon-${Date.now()}.jpg`;
            await FileSystem.writeAsStringAsync(path, match[1], {
              encoding: FileSystem.EncodingType.Base64,
            });
            handleDisconnect();
            props.onCapturedFrame(path);
          } catch {
            setLiveError("Could not save captured frame.");
          }
        })();
        return;
      }

      if (data.type === "error") {
        pendingConnectRef.current = null;
        setConnecting(false);
        setLiveActive(false);
        setLiveStatus("");
        setLiveError(sanitizePublicErrorMessage(data.message));
      }
    },
    [handleDisconnect, props]
  );

  useEffect(() => {
    return () => {
      postToWeb({ type: "disconnect" });
    };
  }, [postToWeb]);

  const androidWebViewProps =
    Platform.OS === "android"
      ? ({
          onPermissionRequest: (event: {
            nativeEvent: { resources: string[]; grant: (r: string[]) => void };
          }) => {
            event.nativeEvent.grant(event.nativeEvent.resources);
          },
        } as Record<string, unknown>)
      : {};

  return (
    <View style={styles.wrap}>
      <View style={styles.videoShell}>
        <WebView
          ref={webRef}
          source={{ html, baseUrl: WEBVIEW_BASE_URL }}
          style={styles.webview}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType="grant"
          mixedContentMode="always"
          onMessage={onWebMessage}
          {...androidWebViewProps}
        />
        {connecting && !liveActive ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={theme.gold} size="large" />
            {liveStatus ? <Text style={styles.overlayStatus}>{liveStatus}</Text> : null}
          </View>
        ) : null}
      </View>

      {!sessionOpen ? (
        <Text style={styles.hint}>
          {sessionSummary ||
            "Add a garment image, then connect. Preview shows your camera with the outfit applied in real time."}
        </Text>
      ) : (
        <View style={styles.liveMeta}>
          {liveSeconds > 0 ? (
            <Text style={styles.liveTimer}>Live session · {formatLiveSessionDuration(liveSeconds)}</Text>
          ) : liveStatus ? (
            <Text style={styles.liveTimer}>{liveStatus}</Text>
          ) : null}
          {liveActive ? (
            <Text style={styles.hint}>Capture a frame to run offline Generate with the same look.</Text>
          ) : null}
        </View>
      )}

      {liveError ? <Text style={styles.error}>{liveError}</Text> : null}

      <View style={styles.actions}>
        {!sessionOpen ? (
          <Pressable
            style={[styles.btn, styles.btnPrimary, !props.garmentAsset && styles.btnDisabled]}
            onPress={() => void handleConnect()}
            disabled={!props.garmentAsset}
          >
            <Ionicons name="videocam-outline" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>Connect live try-on</Text>
          </Pressable>
        ) : (
          <>
            {liveActive ? (
              <Pressable style={[styles.btn, styles.btnAccent]} onPress={handleCapture}>
                <Ionicons name="camera-outline" size={18} color="#fff" />
                <Text style={styles.btnPrimaryText}>Capture frame</Text>
              </Pressable>
            ) : null}
            <Pressable style={[styles.btn, styles.btnDisconnect]} onPress={handleDisconnect}>
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.btnPrimaryText}>{connecting && !liveActive ? "Cancel" : "Disconnect"}</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      gap: 10,
      alignItems: "center",
    },
    videoShell: {
      width: "100%",
      height: 280,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: "#000",
    },
    webview: {
      flex: 1,
      backgroundColor: "#000",
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: 16,
    },
    overlayStatus: {
      color: "#e2e8f0",
      fontSize: 12,
      textAlign: "center",
    },
    hint: {
      fontSize: 12,
      color: theme.muted,
      textAlign: "center",
      lineHeight: 18,
      paddingHorizontal: 4,
    },
    liveMeta: {
      gap: 4,
      alignItems: "center",
    },
    liveTimer: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.gold,
      textAlign: "center",
    },
    error: {
      fontSize: 12,
      color: theme.danger,
      textAlign: "center",
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 8,
      width: "100%",
    },
    btn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      minWidth: 120,
    },
    btnPrimary: {
      backgroundColor: "rgba(51,65,85,0.95)",
      flex: 1,
    },
    btnAccent: {
      backgroundColor: "rgba(79,70,229,0.9)",
      flex: 1,
    },
    btnDisconnect: {
      backgroundColor: "rgba(185,28,28,0.88)",
      flex: 1,
    },
    btnDisabled: {
      opacity: 0.45,
    },
    btnPrimaryText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "700",
    },
  });
