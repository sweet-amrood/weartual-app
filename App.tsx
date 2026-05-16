import { APP_ICON } from "./src/config/branding";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AboutTab from "./src/components/AboutTab";
import ContactTab from "./src/components/ContactTab";
import { getMe, login, signup, type User } from "./src/services/authApi";
import AuthScreen from "./src/components/AuthScreen";
import HomeTab from "./src/components/HomeTab";
import HistoryTab from "./src/components/HistoryTab";
import ProfileTab from "./src/components/ProfileTab";
import TryOnStudio, { STUDIO_PROGRESS_STAGES, type PersonInputMode } from "./src/components/TryOnStudio";
import ShellBackground from "./src/components/ShellBackground";
import TabButton from "./src/components/TabButton";
import ThemedButton from "./src/components/ThemedButton";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import type { Theme } from "./src/theme/shellTheme";
import { Ionicons } from "@expo/vector-icons";
import { submitFeedback } from "./src/services/feedbackApi";
import { deleteMyImage, getMyLookCount, listMyImages, uploadMyImage, type ImageRecord } from "./src/services/imageApi";
import { clearToken, readToken, saveToken } from "./src/storage/session";

type Mode = "login" | "signup";
type Tab = "home" | "about" | "studio" | "history" | "contact" | "profile";
const NAV_TABS: Tab[] = ["home", "about", "studio", "history", "contact", "profile"];
const SCREEN_WIDTH = Dimensions.get("window").width;

function AppInner() {
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const headerTopPad = insets.top + 10;
  const tabBarBottom = insets.bottom + 10;
  const scrollBottomPad = 96 + insets.bottom;
  const [mode, setMode] = useState<Mode>("login");
  const [tab, setTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [images, setImages] = useState<ImageRecord[]>([]);
  /** Server-side total (User.lookCount / DB) — same source as website history header. */
  const [lookCount, setLookCount] = useState<number | null>(null);
  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [garmentAsset, setGarmentAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [personInputMode, setPersonInputMode] = useState<PersonInputMode>("image");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);
  const [historyDeletingId, setHistoryDeletingId] = useState<string | null>(null);
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studioStageIndex, setStudioStageIndex] = useState(0);
  const [studioResult, setStudioResult] = useState<ImageRecord | null>(null);
  const [studioResultAspect, setStudioResultAspect] = useState(1);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const tabAnim = useRef(new Animated.Value(1)).current;
  const swipeX = useRef(new Animated.Value(0)).current;
  const swipeLock = useRef(false);
  const tabRef = useRef<Tab>("home");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactText, setContactText] = useState("");

  const animateSwipeNavigate = (direction: 1 | -1) => {
    if (swipeLock.current) return;
    const index = NAV_TABS.indexOf(tabRef.current);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= NAV_TABS.length) {
      Animated.spring(swipeX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
        tension: 90,
      }).start();
      return;
    }

    swipeLock.current = true;
    Animated.timing(swipeX, {
      toValue: -direction * SCREEN_WIDTH * 0.22,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      const nextTab = NAV_TABS[nextIndex];
      tabRef.current = nextTab;
      setTab(nextTab);
      swipeX.setValue(direction * SCREEN_WIDTH * 0.12);
      Animated.spring(swipeX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 85,
      }).start(() => {
        swipeLock.current = false;
      });
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > 16 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.35,
      onPanResponderMove: (_evt, gestureState) => {
        swipeX.setValue(gestureState.dx * 0.28);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dx < -70 || gestureState.vx < -0.45) {
          animateSwipeNavigate(1);
          return;
        }
        if (gestureState.dx > 70 || gestureState.vx > 0.45) {
          animateSwipeNavigate(-1);
          return;
        }
        Animated.spring(swipeX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 7,
          tension: 90,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await readToken();
        if (!storedToken) {
          return;
        }

        const me = await getMe(storedToken);
        setToken(storedToken);
        setUser(me.user);
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const refreshImages = async (activeToken: string) => {
    setHistoryMessage(null);
    try {
      const data = await listMyImages(activeToken);
      setImages(data);
    } catch (err) {
      setImages([]);
      setHistoryMessage(err instanceof Error ? err.message : "Failed to load history");
    }
  };

  const refreshLookCount = async (activeToken: string) => {
    try {
      const n = await getMyLookCount(activeToken);
      setLookCount(n);
    } catch {
      setLookCount(null);
    }
  };

  const confirmDeleteHistoryItem = (item: ImageRecord) => {
    Alert.alert("Delete result", "Remove this try-on from your history? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteHistoryItem(item.id);
        },
      },
    ]);
  };

  const deleteHistoryItem = async (imageId: string) => {
    if (!token) return;
    setHistoryMessage(null);
    setHistoryDeletingId(imageId);
    try {
      const { lookCount: nextLc } = await deleteMyImage(token, imageId);
      if (typeof nextLc === "number") {
        setLookCount(nextLc);
      } else {
        void refreshLookCount(token);
      }
      setStudioResult((cur) => (cur?.id === imageId ? null : cur));
      try {
        const data = await listMyImages(token);
        setImages(data);
      } catch (listErr) {
        setImages((prev) => prev.filter((x) => x.id !== imageId));
        setHistoryMessage(
          listErr instanceof Error
            ? `${listErr.message} (Removed on server — list will fully sync when you reload.)`
            : "Could not reload history after delete."
        );
      }
    } catch (err) {
      setHistoryMessage(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setHistoryDeletingId(null);
    }
  };

  useEffect(() => {
    if (!token) {
      setImages([]);
      setLookCount(null);
      return;
    }
    void refreshImages(token);
    void refreshLookCount(token);
  }, [token]);

  useEffect(() => {
    tabRef.current = tab;
    tabAnim.setValue(0.92);
    Animated.spring(tabAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
  }, [tab, tabAnim]);

  useEffect(() => {
    if (!uploading) {
      setStudioStageIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setStudioStageIndex((prev) => (prev + 1) % STUDIO_PROGRESS_STAGES.length);
    }, 1400);
    return () => clearInterval(timer);
  }, [uploading]);

  useEffect(() => {
    if (!studioResult?.resultUrl || studioResult.resultType === "video") {
      setStudioResultAspect(1);
      return;
    }
    Image.getSize(
      studioResult.resultUrl,
      (width, height) => {
        if (width > 0 && height > 0) {
          setStudioResultAspect(width / height);
        }
      },
      () => {
        setStudioResultAspect(1);
      }
    );
  }, [studioResult?.resultUrl, studioResult?.resultType]);

  const handleAuth = async () => {
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "signup") {
        if (!username.trim()) {
          setError("Please enter a username.");
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
      }

      const response =
        mode === "login"
          ? await login({ email, password })
          : await signup({ username: username.trim(), email, password });

      await saveToken(response.token);
      setToken(response.token);
      setUser(response.user);
      setPassword("");
      setConfirmPassword("");
      setTab("home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await clearToken();
    setToken(null);
    setUser(null);
    setImages([]);
    setLookCount(null);
    setTab("home");
  };

  const applyAuthRefresh = async (result: { user: User; token?: string }) => {
    setUser(result.user);
    if (result.token) {
      await saveToken(result.token);
      setToken(result.token);
    }
  };

  const assignPersonAsset = (asset: ImagePicker.ImagePickerAsset | undefined) => {
    if (asset) setImageAsset(asset);
  };

  const assignGarmentAsset = (asset: ImagePicker.ImagePickerAsset | undefined) => {
    if (asset) setGarmentAsset(asset);
  };

  const openPersonLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setUploadMessage("Photo library access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: personInputMode === "video" ? ["videos"] : ["images"],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) assignPersonAsset(result.assets[0]);
  };

  const openPersonCameraPhoto = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      setUploadMessage("Camera access is required to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) assignPersonAsset(result.assets[0]);
  };

  const openPersonCameraVideo = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      setUploadMessage("Camera access is required to record video.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: 120,
    });
    if (!result.canceled && result.assets[0]) assignPersonAsset(result.assets[0]);
  };

  const openGarmentLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setUploadMessage("Photo library access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) assignGarmentAsset(result.assets[0]);
  };

  const openGarmentCamera = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      setUploadMessage("Camera access is required to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) assignGarmentAsset(result.assets[0]);
  };

  const handlePersonInputModeChange = (mode: PersonInputMode) => {
    if (mode === personInputMode) return;
    setPersonInputMode(mode);
    setImageAsset(null);
    setUploadMessage(null);
  };

  const handleLiveCapturedFrame = (uri: string) => {
    setImageAsset({
      uri,
      width: 0,
      height: 0,
      mimeType: "image/jpeg",
      fileName: `live-tryon-${Date.now()}.jpg`,
    });
    setPersonInputMode("image");
    setUploadMessage("Frame captured — tap Generate Try-On to save this look.");
  };

  const pickImage = (kind: "person" | "garment") => {
    setUploadMessage(null);
    if (kind === "garment") {
      Alert.alert("Garment image", "Choose where to get the outfit image from.", [
        { text: "Photo library", onPress: () => void openGarmentLibrary() },
        { text: "Take photo", onPress: () => void openGarmentCamera() },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }

    if (personInputMode === "video") {
      Alert.alert("Person video", "Choose a try-on video clip.", [
        { text: "Video library", onPress: () => void openPersonLibrary() },
        { text: "Record video", onPress: () => void openPersonCameraVideo() },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }

    Alert.alert("Person image", "Choose a photo for try-on.", [
      { text: "Photo library", onPress: () => void openPersonLibrary() },
      { text: "Take photo", onPress: () => void openPersonCameraPhoto() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleUpload = async () => {
    if (!token) return;
    if (!imageAsset || !garmentAsset) {
      setUploadMessage("Please select both person image and garment image.");
      return;
    }

    setUploading(true);
    setUploadMessage(null);
    try {
      const { job, lookCount: lc } = await uploadMyImage({
        token,
        imageAsset,
        garmentAsset,
      });
      setStudioResult(job);
      if (typeof lc === "number") {
        setLookCount(lc);
      }
      setImageAsset(null);
      setGarmentAsset(null);
      setUploadMessage("Upload successful. Your new outfit job was created.");
      await refreshImages(token);
    } catch (err) {
      setUploadMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleContactSubmit = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactSubject.trim() || !contactText.trim()) {
      setContactMessage("Please fill name, email, subject, and message.");
      return;
    }
    setContactSubmitting(true);
    setContactMessage(null);
    try {
      const body = `Subject: ${contactSubject.trim()}\n\n${contactText.trim()}`;
      await submitFeedback({
        name: contactName.trim(),
        email: contactEmail.trim(),
        message: body,
      });
      setContactMessage("Feedback submitted successfully.");
      setContactSubject("");
      setContactText("");
    } catch (err) {
      setContactMessage(err instanceof Error ? err.message : "Could not submit feedback");
    } finally {
      setContactSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.shellRoot}>
        <ShellBackground />
        <View style={[styles.center, styles.layerMain, { paddingTop: headerTopPad, paddingBottom: insets.bottom }]}>
          <ActivityIndicator size="large" color={theme.gold} />
          <Text style={styles.helperText}>Checking your session...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        mode={mode}
        setMode={setMode}
        username={username}
        setUsername={setUsername}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        submitting={submitting}
        error={error}
        onSubmit={handleAuth}
      />
    );
  }

  return (
    <View style={styles.shellRoot}>
      <ShellBackground />
      <View style={[styles.layerMain]}>
          <View
            style={[
              styles.header,
              {
                flexDirection: "row",
                justifyContent: "space-between",
                paddingRight: 16,
                paddingTop: headerTopPad,
              },
            ]}
          >
            <View style={styles.brandCenter}>
              <Image source={APP_ICON} style={styles.logoMark} resizeMode="contain" />
              <View>
                <Text style={styles.brandText}>Weartual</Text>
                <Text style={styles.brandSubText}>Virtual Try-On</Text>
              </View>
            </View>
            <Pressable onPress={toggleTheme}>
              <Ionicons name={isDark ? "sunny" : "moon"} size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPad }]}>
        <Animated.View
          {...panResponder.panHandlers}
          style={{ transform: [{ scale: tabAnim }, { translateX: swipeX }], opacity: tabAnim }}
        >
          {tab === "home" ? (
            <HomeTab onOpenStudio={() => setTab("studio")} onLearnMore={() => setTab("about")} />
          ) : null}

          {tab === "about" ? <AboutTab /> : null}

          {tab === "studio" ? (
            <TryOnStudio
              token={token!}
              imageAsset={imageAsset}
              garmentAsset={garmentAsset}
              personInputMode={personInputMode}
              onPersonInputModeChange={handlePersonInputModeChange}
              onPickPerson={() => pickImage("person")}
              onPickGarment={() => pickImage("garment")}
              onLiveCapturedFrame={handleLiveCapturedFrame}
              onGenerate={handleUpload}
              uploading={uploading}
              uploadMessage={uploadMessage}
              studioStageIndex={studioStageIndex}
              studioResult={studioResult}
              studioResultAspect={studioResultAspect}
              onClearResult={() => setStudioResult(null)}
              onOpenHistory={() => setTab("history")}
              onOpenVideo={(url) => Linking.openURL(url)}
            />
          ) : null}

          {tab === "history" ? (
            <HistoryTab
              username={user.username}
              lookCount={lookCount}
              images={images}
              historyMessage={historyMessage}
              historyDeletingId={historyDeletingId}
              onReload={() => {
                if (!token) return;
                void refreshImages(token);
                void refreshLookCount(token);
              }}
              onOpenStudio={() => setTab("studio")}
              onFullscreen={(url) => setFullscreenImageUrl(url)}
              onOpenVideo={(url) => Linking.openURL(url)}
              onDelete={confirmDeleteHistoryItem}
            />
          ) : null}

          {tab === "profile" && token ? (
            <ProfileTab
              user={user}
              token={token}
              images={images}
              lookCount={lookCount}
              onLogout={handleLogout}
              onAuthRefresh={applyAuthRefresh}
            />
          ) : null}

          {tab === "contact" ? (
            <ContactTab
              contactName={contactName}
              setContactName={setContactName}
              contactEmail={contactEmail}
              setContactEmail={setContactEmail}
              contactSubject={contactSubject}
              setContactSubject={setContactSubject}
              contactText={contactText}
              setContactText={setContactText}
              contactMessage={contactMessage}
              contactSubmitting={contactSubmitting}
              onSubmit={handleContactSubmit}
            />
          ) : null}
        </Animated.View>
      </ScrollView>
      <View style={[styles.tabBar, { bottom: tabBarBottom }]}>
        <TabButton label="Home" icon="home-outline" active={tab === "home"} onPress={() => setTab("home")} />
        <TabButton label="About" icon="information-circle-outline" active={tab === "about"} onPress={() => setTab("about")} />
        <TabButton label="Studio" icon="sparkles-outline" active={tab === "studio"} onPress={() => setTab("studio")} />
        <TabButton label="History" icon="images-outline" active={tab === "history"} onPress={() => setTab("history")} />
        <TabButton label="Contact" icon="mail-outline" active={tab === "contact"} onPress={() => setTab("contact")} />
        <TabButton label="Profile" icon="person-outline" active={tab === "profile"} onPress={() => setTab("profile")} />
      </View>
      <Modal visible={!!fullscreenImageUrl} transparent animationType="fade" onRequestClose={() => setFullscreenImageUrl(null)}>
        <Pressable style={styles.fullscreenOverlay} onPress={() => setFullscreenImageUrl(null)}>
          {fullscreenImageUrl ? <Image source={{ uri: fullscreenImageUrl }} style={styles.fullscreenImage} resizeMode="contain" /> : null}
          <Text style={styles.fullscreenHint}>Tap anywhere to close</Text>
        </Pressable>
      </Modal>
      <StatusBar style={isDark ? "light" : "dark"} />
      </View>
    </View>
  );
}

const getStyles = (shellTheme: Theme) => StyleSheet.create({
  shellRoot: {
    flex: 1,
    backgroundColor: shellTheme.bg,
  },
  layerMain: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    minHeight: 56,
    paddingBottom: 12,
    backgroundColor: shellTheme.bgInput,
    justifyContent: "center",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: shellTheme.border,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  brandCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 16,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  brandText: {
    color: shellTheme.text,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  brandSubText: {
    color: shellTheme.muted2,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 0,
  },
  container: {
    flexGrow: 1,
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    color: shellTheme.text,
  },
  helperText: {
    textAlign: "center",
    color: shellTheme.muted,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: shellTheme.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    backgroundColor: shellTheme.bgInput,
    color: shellTheme.textSecondary,
    fontSize: 16,
  },
  errorText: {
    color: shellTheme.danger,
    textAlign: "center",
  },
  card: {
    borderRadius: 22,
    padding: 18,
    gap: 14,
    backgroundColor: shellTheme.bgElevated + "cc",
    borderWidth: 1,
    borderColor: shellTheme.border,
  },
  historyItem: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
    backgroundColor: shellTheme.bgInput,
    borderWidth: 1,
    borderColor: shellTheme.border,
    marginBottom: 12,
  },
  historyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  historyTitle: {
    fontWeight: "700",
    color: shellTheme.textSecondary,
  },
  historySub: {
    color: shellTheme.muted2,
    fontSize: 12,
  },
  historyImage: {
    width: "100%",
    height: 190,
    borderRadius: 12,
    backgroundColor: shellTheme.bgInput,
    borderWidth: 1,
    borderColor: shellTheme.border,
  },
  historyActionsRow: {
    marginTop: 4,
  },
  videoResultBox: {
    borderRadius: 12,
    padding: 12,
    gap: 10,
    backgroundColor: shellTheme.bgElevated,
    borderWidth: 1,
    borderColor: shellTheme.border,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: "rgba(251,191,36,0.12)",
    borderColor: "rgba(251,191,36,0.45)",
  },
  statusDone: {
    backgroundColor: "rgba(124,156,255,0.12)",
    borderColor: "rgba(124,156,255,0.45)",
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
    color: shellTheme.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: shellTheme.bgElevated,
    borderWidth: 1,
    borderColor: shellTheme.border,
  },
  metaChipText: {
    fontSize: 11,
    color: shellTheme.muted,
    fontWeight: "600",
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,10,18,0.94)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  fullscreenImage: {
    width: "100%",
    height: "85%",
  },
  fullscreenHint: {
    color: shellTheme.muted,
    marginTop: 10,
    fontSize: 12,
  },
  tabBar: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    zIndex: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: shellTheme.border,
    backgroundColor: shellTheme.tabBar,
    paddingBottom: 10,
    paddingTop: 6,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  infoBlock: {
    borderRadius: 14,
    padding: 0,
    backgroundColor: "transparent",
    gap: 6,
  },
  infoTitle: {
    fontWeight: "700",
    color: shellTheme.textSecondary,
    fontSize: 16,
  },
  infoBody: {
    color: shellTheme.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: shellTheme.text,
    letterSpacing: -0.3,
  },
  statText: {
    color: shellTheme.gold,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
