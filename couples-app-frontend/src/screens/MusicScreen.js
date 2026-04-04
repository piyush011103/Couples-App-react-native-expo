import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { FONTS, RADIUS, SIZES, SHADOWS, GRADIENTS } from "../constants/theme";

import useMusicStore from "../store/useMusicStore";
import useSocketStore from "../store/useSocketStore";
import useAuthStore from "../store/useAuthStore";
import useThemeStore from "../store/useThemeStore";

const { width } = Dimensions.get("window");

const TRACKS = [
  {
    id: "1",
    title: "Midnight Resonance",
    artist: "Celestial Echo",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Eternal Bloom",
    artist: "Serene Waves",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Golden Hour Glow",
    artist: "Lofi Pulse",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=500&auto=format&fit=crop",
  },
];

const MusicScreen = ({ navigation }) => {
  const { colors, mode } = useThemeStore();
  const { user } = useAuthStore();
  const socket = useSocketStore((state) => state.socket);
  const partnerId = user?.partnerId;

  const {
    isPlaying,
    currentTrack,
    position,
    duration,
    playTrack,
    play,
    pause,
    seekTo,
  } = useMusicStore();

  const isIncomingSync = useRef(false);
  const syncTimeoutRef = useRef(null);

  // Helper: set incoming flag with auto-clear
  const markIncoming = (durationMs = 1500) => {
    isIncomingSync.current = true;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      isIncomingSync.current = false;
    }, durationMs);
  };

  // Helper: wait for player to load with timeout
  const waitForLoaded = (timeoutMs = 8000) => {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = setInterval(() => {
        const { isLoaded } = useMusicStore.getState();
        if (isLoaded) {
          clearInterval(check);
          resolve();
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(check);
          reject(new Error("Load timeout"));
        }
      }, 100);
    });
  };

  // 🔥 SYNC LISTENER
  useEffect(() => {
    if (!socket) return;

    const handleSync = async (data) => {
      markIncoming(2000);

      const {
        currentTrack: liveTrack,
        isPlaying: liveIsPlaying,
        playTrack,
        play,
        pause,
        seekTo,
      } = useMusicStore.getState();

      const delay = Math.min(Date.now() - (data.timestamp || Date.now()), 3000);
      const correctedPosition = (data.positionMillis || 0) + delay;

      try {
        if (data.type === "play") {
          if (!liveTrack || liveTrack?.id !== data.track?.id) {
            await playTrack(data.track);
            await waitForLoaded();
            seekTo(correctedPosition);
          } else {
            seekTo(correctedPosition);
            if (!liveIsPlaying) play();
          }
        }

        else if (data.type === "pause") {
          if (liveIsPlaying) pause();
        }

        else if (data.type === "seek") {
          seekTo(correctedPosition);
        }

        else if (data.type === "change") {
          await playTrack(data.track);
          await waitForLoaded();
          seekTo(correctedPosition);
        }

        else if (data.type === "sync_state") {
          // Only correct if we have the same track
          if (data.track && liveTrack?.id === data.track.id) {
            const { position: localPos } = useMusicStore.getState();
            const drift = Math.abs(localPos - correctedPosition);

            // Correct position if drifted >2s
            if (drift > 2000) {
              seekTo(correctedPosition);
            }

            // Correct play/pause state
            if (data.isPlaying && !useMusicStore.getState().isPlaying) {
              play();
            } else if (!data.isPlaying && useMusicStore.getState().isPlaying) {
              pause();
            }
          } else if (data.track && !liveTrack) {
            // Partner has a track playing but we don't — load it
            await playTrack(data.track);
            await waitForLoaded();
            seekTo(correctedPosition);
            if (!data.isPlaying) pause();
          }
        }
      } catch (e) {
        console.log("Sync handler error:", e.message);
      }
    };

    socket.on("music_sync_received", handleSync);
    return () => {
      socket.off("music_sync_received", handleSync);
    };
  }, [socket]);

  // 🔥 EMIT SYNC
  const emitSync = (type, extra = {}) => {
    if (isIncomingSync.current || !socket || !partnerId) return;

    const { currentTrack, position } = useMusicStore.getState();

    socket.emit("music_sync", {
      receiverId: partnerId,
      type,
      track: currentTrack,
      positionMillis: position,
      timestamp: Date.now(),
      ...extra,
    });
  };

  // 🔥 PLAY / PAUSE
  const handleToggle = () => {
    const { isPlaying, position, currentTrack } = useMusicStore.getState();

    if (!currentTrack) return;

    if (isPlaying) {
      pause();
      emitSync("pause", { positionMillis: position });
    } else {
      play();
      emitSync("play", { positionMillis: position });
    }
  };

  const handleTrackSelect = async (track) => {
    await playTrack(track);
    // Emit after playTrack so position is fresh (0)
    setTimeout(() => {
      emitSync("change", { track, positionMillis: 0 });
    }, 200);
  };

  const onSlidingComplete = (value) => {
    // value is already in millis (slider max = duration)
    seekTo(value);
    emitSync("seek", { positionMillis: value });
  };

  // 🔥 PERIODIC RESYNC
  useEffect(() => {
    if (!socket || !partnerId) return;

    const interval = setInterval(() => {
      if (isIncomingSync.current) return;

      const { currentTrack, position, isPlaying } = useMusicStore.getState();
      if (!currentTrack) return;

      socket.emit("music_sync", {
        receiverId: partnerId,
        type: "sync_state",
        track: currentTrack,
        positionMillis: position,
        isPlaying,
        timestamp: Date.now(),
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [socket, partnerId]);

  // 🔥 INITIAL SYNC
  useEffect(() => {
    if (!socket || !partnerId) return;

    socket.emit("request_sync", { receiverId: partnerId });

    const handleRequestSync = () => {
      const { currentTrack, position, isPlaying } = useMusicStore.getState();

      socket.emit("music_sync", {
        receiverId: partnerId,
        type: "sync_state",
        track: currentTrack,
        positionMillis: position,
        isPlaying,
        timestamp: Date.now(),
      });
    };

    socket.on("request_sync", handleRequestSync);
    return () => {
      socket.off("request_sync", handleRequestSync);
    };
  }, [socket, partnerId]);

  // UI ANIMATION
  const albumScale = useSharedValue(1);
  useEffect(() => {
    albumScale.value = withSpring(isPlaying ? 1 : 0.9);
  }, [isPlaying]);

  const albumStyle = useAnimatedStyle(() => ({
    transform: [{ scale: albumScale.value }],
  }));

  const formatTime = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Editorial Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.playerSection}>
          <Animated.View style={[styles.albumArtContainer, albumStyle]}>
            <Image
              source={{ 
                uri: currentTrack?.cover || 
                "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop" 
              }}
              style={styles.albumArt}
            />
          </Animated.View>

          <View style={styles.metaContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              {currentTrack?.title || "Select Track"}
            </Text>
            <Text style={[styles.artist, { color: colors.textSub }]}>
              {currentTrack?.artist || "The Sanctuary Echo"}
            </Text>
          </View>

          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration || 1}
              value={position || 0}
              onSlidingComplete={onSlidingComplete}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlBtn}>
              <Ionicons name="shuffle-outline" size={24} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn}>
              <Ionicons name="play-skip-back-outline" size={32} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.playBtn} 
              onPress={handleToggle}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={GRADIENTS.brand}
                style={styles.playBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={38}
                  color="#fff"
                  style={{ marginLeft: isPlaying ? 0 : 4 }}
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn}>
              <Ionicons name="play-skip-forward-outline" size={32} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn}>
              <Ionicons name="repeat-outline" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Playlist Section */}
        <View style={styles.playlistSection}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>YOUR SYNCED LIBRARY</Text>
          {TRACKS.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <TouchableOpacity 
                key={track.id} 
                style={[
                  styles.trackItem, 
                  { 
                    backgroundColor: isCurrent ? mode === 'dark' ? 'rgba(138,43,226,0.1)' : 'rgba(165,59,34,0.05)' : 'transparent',
                    borderColor: isCurrent ? colors.primary + '30' : 'transparent',
                    borderWidth: 1
                  }
                ]}
                onPress={() => handleTrackSelect(track)}
              >
                <Image source={{ uri: track.cover }} style={styles.trackThumb} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.trackTitle, { color: isCurrent ? colors.primary : colors.text }]}>
                    {track.title}
                  </Text>
                  <Text style={[styles.trackArtist, { color: colors.textMuted }]}>
                    {track.artist}
                  </Text>
                </View>
                {isCurrent && isPlaying && (
                  <View style={styles.playingIndicator}>
                    <Ionicons name="pulse-outline" size={18} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 100 },
  backBtn: { marginBottom: 30, opacity: 0.6 },
  playerSection: { alignItems: 'center', marginBottom: 44 },
  albumArtContainer: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    backgroundColor: '#000',
    ...SHADOWS.ambient,
    marginBottom: 40,
  },
  albumArt: { width: '100%', height: '100%' },
  metaContainer: { alignItems: 'center', marginBottom: 32 },
  title: { fontFamily: FONTS.display, fontSize: 26, textAlign: 'center', marginBottom: 8 },
  artist: { fontFamily: FONTS.body, fontSize: 16, opacity: 0.7 },
  
  sliderContainer: { width: '100%', marginBottom: 32 },
  slider: { width: '100%', height: 40 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  timeText: { fontSize: 10, color: 'rgba(128,128,128,0.5)', fontFamily: FONTS.label },
  
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 },
  controlBtn: { padding: 10 },
  playBtn: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    ...SHADOWS.purple,
    overflow: 'hidden'
  },
  playBtnGradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  playlistSection: { marginTop: 20 },
  sectionLabel: { fontFamily: FONTS.label, fontSize: 10, letterSpacing: 2, marginBottom: 20 },
  trackItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: RADIUS.xl, gap: 16, marginBottom: 8 },
  trackThumb: { width: 50, height: 50, borderRadius: RADIUS.md },
  trackTitle: { fontFamily: FONTS.headline, fontSize: 15 },
  trackArtist: { fontFamily: FONTS.body, fontSize: 12, opacity: 0.6 },
  playingIndicator: { marginLeft: 'auto' },
});

export default MusicScreen;
