import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { FONTS, RADIUS, SIZES, SHADOWS, GRADIENTS } from "../constants/theme";
import PrimaryButton from "../components/PrimaryButton";
import useAuthStore from "../store/useAuthStore";
import useSocketStore from "../store/useSocketStore";
import useThemeStore from "../store/useThemeStore";

const { width } = Dimensions.get("window");

const WatchTogetherScreen = () => {
  const colors = useThemeStore((state) => state.colors);
  const styles = createStyles(colors);
  const { user } = useAuthStore();
  const { syncWatch, setWatchSyncCallback } = useSocketStore();
  const [ytUrl, setYtUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Sanctuary Idle");

  const handlePartnerSync = (data) => {
    if (data.action === "play") {
      setIsPlaying(true);
      setSyncStatus("▶ Partner started the pulse");
    }
    if (data.action === "pause") {
      setIsPlaying(false);
      setSyncStatus("⏸ Partner paused the flow");
    }
  };

  const startSession = () => {
    if (!ytUrl.trim()) {
      Alert.alert("Editorial Insight", "Please provide a connection link to begin.");
      return;
    }
    setIsConnected(true);
    setWatchSyncCallback(handlePartnerSync);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setSyncStatus("▶ Pulse Active");
    syncWatch({ receiverId: user.partnerId, action: "play", url: ytUrl });
  };

  const handlePause = () => {
    setIsPlaying(false);
    setSyncStatus("⏸ Flow Paused");
    syncWatch({ receiverId: user.partnerId, action: "pause", url: ytUrl });
  };

  return (
    <View style={styles.root}>
      {/* Decorative Glow */}
      <View style={styles.glow} />
      
      <View style={styles.container}>
        {/* Asymmetrical Editorial Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>THE SANCTUARY</Text>
          <Text style={styles.heading}>Cinema{"\n"}Sanctuary</Text>
          <Text style={styles.sub}>Experience the rhythm of cinema, synchronized across the void.</Text>
        </View>

        {!isConnected ? (
          <BlurView intensity={35} tint="dark" style={styles.setupCard}>
            <View style={styles.cardInner}>
              <Text style={styles.label}>CONNECTION LINK</Text>
              <TextInput
                style={styles.urlInput}
                value={ytUrl}
                onChangeText={setYtUrl}
                placeholder="Paste YouTube sanctuary link..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              <PrimaryButton
                title="Ignite Session"
                onPress={startSession}
                style={{ marginTop: 24 }}
              />
            </View>
          </BlurView>
        ) : (
          <View style={styles.activeArea}>
            {/* Editorial Video Frame */}
            <View style={styles.videoFrame}>
              <LinearGradient
                colors={[colors.surfaceContainerLowest, colors.surfaceContainerLow]}
                style={styles.videoPlaceholder}
                start={{ x: 0.0, y: 0.0 }}
                end={{ x: 1.0, y: 1.0 }}
                locations={[0.0, 1.0]}
              >
                <View style={[styles.pulseCircle, isPlaying && styles.pulseActive]}>
                  <Text style={styles.videoIcon}>{isPlaying ? "▶" : "⏸"}</Text>
                </View>
                <Text style={styles.videoUrl} numberOfLines={1}>
                  {ytUrl}
                </Text>
              </LinearGradient>
            </View>

            {/* Sync Status - Editorial Tile */}
            <BlurView intensity={25} tint="dark" style={styles.statusTile}>
              <Text style={styles.statusLabel}>ATMOSPHERE</Text>
              <Text style={styles.syncStatusText}>{syncStatus}</Text>
            </BlurView>

            {/* Glass Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.controlBtn, !isPlaying && styles.controlBtnActive]}
                onPress={handlePause}
              >
                <BlurView intensity={isPlaying ? 15 : 40} tint="dark" style={styles.controlBlur}>
                  <Text style={styles.controlText}>PAUSE</Text>
                </BlurView>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlBtn, isPlaying && styles.controlBtnActive]}
                onPress={handlePlay}
              >
                <LinearGradient
                  colors={isPlaying ? GRADIENTS.brand : ["transparent", "transparent"]}
                  style={styles.controlGradient}
                  start={{ x: 0.0, y: 0.0 }}
                  end={{ x: 1.0, y: 1.0 }}
                  locations={[0.0, 1.0]}
                >
                  <Text style={[styles.controlText, isPlaying && styles.controlTextActive]}>
                    PLAY
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.endBtn}
              onPress={() => {
                setIsConnected(false);
                setIsPlaying(false);
                setYtUrl("");
              }}
            >
              <Text style={styles.endText}>Dissolve Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    glow: {
      position: "absolute",
      width: width * 1.2,
      height: width * 1.2,
      borderRadius: width * 0.6,
      backgroundColor: "rgba(138, 43, 226, 0.05)",
      top: -width * 0.4,
      right: -width * 0.3,
    },
    container: { flex: 1, paddingHorizontal: 28, paddingTop: 80 },
    header: { marginBottom: 40 },
    eyebrow: {
      fontFamily: FONTS.label,
      fontSize: 10,
      color: colors.primary,
      letterSpacing: 3,
      marginBottom: 12,
    },
    heading: {
      fontFamily: FONTS.display,
      fontSize: SIZES.display * 0.8,
      color: colors.text,
      lineHeight: SIZES.display * 0.8,
      marginBottom: 16,
    },
    sub: {
      fontFamily: FONTS.body,
      fontSize: SIZES.md,
      color: colors.textSub,
      width: "85%",
      lineHeight: 24,
    },
    setupCard: {
      borderRadius: RADIUS.xxl,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.borderLight,
      ...SHADOWS.ambient,
    },
    cardInner: { padding: 32 },
    label: {
      fontFamily: FONTS.label,
      fontSize: 11,
      color: colors.textMuted,
      letterSpacing: 2,
      marginBottom: 16,
    },
    urlInput: {
      fontFamily: FONTS.body,
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      borderRadius: RADIUS.lg,
      color: colors.text,
      fontSize: SIZES.base,
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.05)",
    },
    activeArea: { flex: 1 },
    videoFrame: {
      borderRadius: RADIUS.xxxl,
      overflow: "hidden",
      marginBottom: 24,
      ...SHADOWS.ambient,
    },
    videoPlaceholder: {
      height: 240,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
    },
    pulseCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    pulseActive: {
      borderColor: colors.primary,
      backgroundColor: "rgba(138, 43, 226, 0.1)",
    },
    videoIcon: { fontSize: 32, color: colors.text },
    videoUrl: {
      fontFamily: FONTS.label,
      color: colors.textMuted,
      fontSize: 10,
      letterSpacing: 1,
    },
    statusTile: {
      padding: 24,
      borderRadius: RADIUS.xl,
      overflow: "hidden",
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    statusLabel: {
      fontFamily: FONTS.label,
      fontSize: 9,
      letterSpacing: 3,
      color: colors.primary,
      marginBottom: 8,
    },
    syncStatusText: {
      fontFamily: FONTS.headline,
      fontSize: SIZES.lg,
      color: colors.text,
    },
    controls: { flexDirection: "row", gap: 16, marginBottom: 32 },
    controlBtn: {
      flex: 1,
      height: 60,
      borderRadius: RADIUS.full,
      overflow: "hidden",
    },
    controlBlur: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.05)",
    },
    controlGradient: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    controlText: {
      fontFamily: FONTS.label,
      fontSize: 12,
      color: colors.textSub,
      letterSpacing: 2,
    },
    controlTextActive: { color: "#FFF", fontFamily: FONTS.headline },
    endBtn: {
      paddingVertical: 16,
      alignItems: "center",
    },
    endText: {
      fontFamily: FONTS.label,
      color: colors.error,
      fontSize: 11,
      letterSpacing: 2,
      textTransform: "uppercase",
    },
  });

export default WatchTogetherScreen;
