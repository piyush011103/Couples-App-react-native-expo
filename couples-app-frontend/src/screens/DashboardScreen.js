import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { RADIUS, SIZES } from "../constants/theme";
import useAuthStore from "../store/useAuthStore";
import useSocketStore from "../store/useSocketStore";
import useThemeStore from "../store/useThemeStore";
import apiClient from "../api/apiClient";

const { width } = Dimensions.get("window");

const MOOD_EMOJI = {
  Happy: "😄",
  Sad: "😢",
  Stressed: "😤",
  Loved: "🥰",
  Tired: "😴",
  Neutral: "😐",
};

/**
 * Atmospheric Background Glow Component
 */
const AnimatedGlow = ({ color, style, duration = 8000 }) => {
  const transX = useSharedValue(0);
  const transY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    transX.value = withRepeat(withSequence(withTiming(30, { duration }), withTiming(-30, { duration })), -1, true);
    transY.value = withRepeat(withSequence(withTiming(-40, { duration: duration * 1.2 }), withTiming(40, { duration: duration * 1.2 })), -1, true);
    scale.value = withRepeat(withSequence(withTiming(1.2, { duration: duration * 1.5 }), withTiming(0.8, { duration: duration * 1.5 })), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: transX.value }, { translateY: transY.value }, { scale: scale.value }],
    opacity: 0.15,
  }));

  return (
    <Animated.View style={[styles.glowCircle, { backgroundColor: color }, style, animStyle]} />
  );
};

const FeatureTile = ({ icon, title, subtitle, onPress, colors }) => (
  <TouchableOpacity
    style={styles.featureTile}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <BlurView intensity={35} tint="dark" style={styles.tileBlur}>
      <View style={styles.iconBay}>
        <LinearGradient
          colors={['rgba(138, 43, 226, 0.15)', 'transparent']}
          style={styles.iconBayGradient}
        />
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <View>
        <Text style={[styles.tileTitle, { color: colors.text, fontFamily: 'Manrope_800ExtraBold' }]}>
          {title}
        </Text>
        <Text style={[styles.tileSub, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
          {subtitle.toUpperCase()}
        </Text>
      </View>
    </BlurView>
  </TouchableOpacity>
);

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { loveTapReceived, setLoveTapReceived, sendLoveTap } = useSocketStore();
  const socket = useSocketStore((state) => state.socket);
  const { colors, toggleTheme, mode } = useThemeStore();
  const insets = useSafeAreaInsets();

  const [partner, setPartner] = useState(null);
  const [partnerLoading, setPartnerLoading] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [tapSent, setTapSent] = useState(false);
  
  const heartScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Fetch data on focus for instant real-time sync
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchData = async () => {
        try {
          // Fetch Partner Info
          if (user?.partnerId) {
            const partRes = await apiClient.get("/auth/partner");
            if (isActive) setPartner(partRes.data);
          }
          
          // Fetch Countdown
          const countRes = await apiClient.get("/countdown");
          if (isActive) setCountdown(countRes.data);
        } catch (e) {
          if (isActive) {
            setCountdown(null);
            // Ignore 404 (No countdown set) to keep terminal clean
            if (e.response?.status !== 404) {
              console.log("Dashboard sync error:", e.message);
            }
          }
        } finally {
          if (isActive) setPartnerLoading(false);
        }
      };

      fetchData();
      return () => { isActive = false; };
    }, [user?.partnerId])
  );

  useEffect(() => {
    if (!socket) return;
    const onUpdated = (cd) => setCountdown(cd);
    const onRemoved = () => {
      setCountdown(null);
    };
    
    socket.on("countdown_updated", onUpdated);
    socket.on("countdown_removed", onRemoved);
    socket.on("countdown_deleted", onRemoved); 
    
    return () => {
      socket.off("countdown_updated", onUpdated);
      socket.off("countdown_removed", onRemoved);
      socket.off("countdown_deleted", onRemoved);
    };
  }, [socket]);

  useEffect(() => {
    if (loveTapReceived) {
      heartScale.value = withSpring(1.4, {}, () => {
        heartScale.value = withSpring(1);
      });
      const t = setTimeout(() => setLoveTapReceived(false), 4000);
      return () => clearTimeout(t);
    }
  }, [loveTapReceived]);

  const handleLoveTap = () => {
    sendLoveTap(user?.partnerId);
    setTapSent(true);
    heartScale.value = withSpring(1.3, {}, () => {
      heartScale.value = withSpring(1);
    });
    setTimeout(() => setTapSent(false), 2000);
  };

  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return "Good Morning";
    if (currentHour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Editorial Background Depth */}
      <AnimatedGlow color="#8A2BE2" style={{ top: '10%', right: '-10%' }} />
      <AnimatedGlow color="#FF4D8D" style={{ bottom: '20%', left: '-15%' }} duration={12000} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: 120 }]}
      >
        {/* Editorial Header */}
        <View style={styles.header}>
           <TouchableOpacity 
             style={styles.profileAvatar}
             onPress={() => navigation.navigate("More")}
           >
             <LinearGradient 
               colors={['#8A2BE2', '#FF4D8D']} 
               style={styles.avatarInner}
               start={{ x: 0.0, y: 0.0 }}
               end={{ x: 1.0, y: 1.0 }}
               locations={[0.0, 1.0]}
             >
               <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
             </LinearGradient>
           </TouchableOpacity>
           <View style={{ flex: 1, marginLeft: 16 }}>
             <Text style={[styles.greetingLabel, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
               {getGreeting()}
             </Text>
             <Text style={[styles.heroHeadline, { color: colors.text, fontFamily: 'Manrope_800ExtraBold' }]}>
               {user?.name}
             </Text>
           </View>
           <TouchableOpacity 
             style={[styles.contextBtn, { borderColor: colors.border }]}
             onPress={toggleTheme}
           >
             <Ionicons name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.text} />
           </TouchableOpacity>
        </View>

        {/* Card 1: Partner Current State Sanctuary */}
        {partnerLoading ? (
          <View style={[styles.loadingBanner, { backgroundColor: 'rgba(52, 52, 64, 0.3)' }]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : partner ? (
          <BlurView intensity={45} tint="dark" style={styles.partnerStateCard}>
            <View style={styles.cardHeader}>
              <View style={styles.partnerAvatarWrap}>
                <LinearGradient 
                  colors={['rgba(138, 43, 226, 0.2)', 'rgba(255, 77, 141, 0.15)']} 
                  style={styles.partnerAvatarMain}
                  start={{ x: 0.0, y: 0.0 }}
                  end={{ x: 1.0, y: 1.0 }}
                  locations={[0.0, 1.0]}
                >
                  <Text style={[styles.partnerInitial, { color: colors.primary || '#8A2BE2' }]}>
                    {partner.name?.[0]?.toUpperCase()}
                  </Text>
                </LinearGradient>
                <Animated.View style={[styles.statusPulse, { backgroundColor: '#FFB1C4' }, pulseStyle]} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                 <Text style={[styles.statusBrief, { color: colors.text, fontFamily: 'Manrope_800ExtraBold' }]}>
                   {partner.name} is {partner.currentMood === 'Tired' ? 'Sleeping' : (partner.currentMood || 'in Sanctuary')}
                 </Text>
                 <Text style={[styles.labelStatus, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
                   LOCAL TIME: 2:45 AM • MORNING RITUAL
                 </Text>
              </View>
              <Text style={styles.editorialIcon}>✦</Text>
            </View>
          </BlurView>
        ) : null}

        {/* Card 2: Send Pulse (Love Tap Heartbeat) */}
        <BlurView intensity={35} tint="dark" style={styles.pulseCard}>
          <Text style={[styles.pulseHeading, { color: colors.text, fontFamily: 'Manrope_700Bold' }]}>
            Send a digital heartbeat?
          </Text>
          <Text style={[styles.pulseSub, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_500Medium' }]}>
            Let {partner?.name || 'them'} know you're thinking of them right now.
          </Text>
          
          <View style={styles.interactionArea}>
            {loveTapReceived && (
              <Animated.View style={[styles.receivedSignal, { backgroundColor: colors.accent + '30' }]}>
                <Text style={[styles.receivedSignalText, { color: colors.accent, fontFamily: 'PlusJakartaSans_700Bold' }]}>
                  💌 HEARTBEAT RECEIVED
                </Text>
              </Animated.View>
            )}
            
            <TouchableOpacity onPress={handleLoveTap} activeOpacity={0.8}>
               <Animated.View style={[styles.heartOuterContainer, heartStyle]}>
                  <LinearGradient
                    colors={['#8A2BE2', '#FF4D8D']}
                    style={styles.massiveHeart}
                    start={{ x: 0.0, y: 0.0 }}
                    end={{ x: 1.0, y: 1.0 }}
                    locations={[0.0, 1.0]}
                  >
                    <Ionicons name="heart" size={54} color="#FFF" />
                  </LinearGradient>
               </Animated.View>
            </TouchableOpacity>
            
            <Text style={[styles.pulseStatusText, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
              {tapSent ? "PULSE RADIATING ✨" : "TAP TO RADIATE"}
            </Text>
          </View>
        </BlurView>

        {/* Card 3: Countdown Sanctuary (Next Visit) */}
        {countdown && new Date(countdown.targetDate) > new Date() ? (
          <TouchableOpacity 
            onPress={() => navigation.navigate("Countdown")}
            activeOpacity={0.8}
          >
            <BlurView intensity={30} tint="dark" style={styles.countdownCard}>
              <View style={styles.cardInfo}>
                <Text style={[styles.countdownLabel, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
                  {countdown.eventName.toUpperCase()}
                </Text>
                <Text style={[styles.countdownTitle, { color: colors.text, fontFamily: 'Manrope_800ExtraBold' }]}>
                  {Math.ceil((new Date(countdown.targetDate) - new Date()) / 86400000)} Days Remaining
                </Text>
                <Text style={[styles.countdownSub, { color: colors.textSub, fontFamily: 'PlusJakartaSans_500Medium' }]}>
                  Until your next beautiful moment together
                </Text>
              </View>
              <View style={styles.verticalChevron}>
                 <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
              </View>
            </BlurView>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => navigation.navigate("Countdown")}
            activeOpacity={0.7}
          >
            <View style={[styles.addCountdownCard, { borderColor: colors.primary + '30' }]}>
               <Ionicons name="calendar-outline" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
               <Text style={[styles.addCountdownText, { color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }]}>
                 PLAN YOUR NEXT SANCTUARY VISIT ✦
               </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Feature Grid: Shared Space */}
        <View style={styles.sectionDivider}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_700Bold' }]}>
            YOUR SPACE
          </Text>
        </View>
        
        <View style={styles.editorialGrid}>
          <FeatureTile icon="chatbubble-ellipses-outline" title="Chat" subtitle="Editorial" colors={colors} onPress={() => navigation.navigate("ChatTab")} />
          <FeatureTile icon="heart-outline" title="Sanctuary" subtitle="Memories" colors={colors} onPress={() => navigation.navigate("Memories")} />
          <FeatureTile icon="pulse-outline" title="Check-In" subtitle="Sync Mood" colors={colors} onPress={() => navigation.navigate("CheckIn")} />
          <FeatureTile icon="play-circle-outline" title="Cinema" subtitle="Watch" colors={colors} onPress={() => navigation.navigate("Watch")} />
          <FeatureTile icon="game-controller-outline" title="Arena" subtitle="Play" colors={colors} onPress={() => navigation.navigate("Games")} />
          <FeatureTile icon="settings-outline" title="Portal" subtitle="Settings" colors={colors} onPress={() => navigation.navigate("More")} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    filter: Platform.OS === 'ios' ? 'blur(100px)' : undefined,
  },
  scroll: { paddingHorizontal: 24 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  avatarInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  greetingLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  heroHeadline: { fontSize: 32, letterSpacing: -1 },
  contextBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingBanner: { height: 100, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  partnerStateCard: {
    borderRadius: 28,
    overflow: 'hidden',
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  partnerAvatarWrap: { position: 'relative' },
  partnerAvatarMain: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerInitial: { fontSize: 24, fontWeight: '800' },
  statusPulse: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusBrief: { fontSize: 20, letterSpacing: -0.5, marginBottom: 4 },
  labelStatus: { fontSize: 9, letterSpacing: 1.5, opacity: 0.6 },
  editorialIcon: { fontSize: 24, opacity: 0.4 },

  pulseCard: {
    borderRadius: 32,
    overflow: 'hidden',
    padding: 32,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pulseHeading: { fontSize: 22, letterSpacing: -0.5, marginBottom: 8 },
  pulseSub: { fontSize: 14, textAlign: 'center', opacity: 0.7, lineHeight: 20, marginBottom: 24 },
  interactionArea: { alignItems: 'center' },
  receivedSignal: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  receivedSignalText: { fontSize: 10, letterSpacing: 1.5 },
  heartOuterContainer: {
    shadowColor: '#FF4D8D',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
    marginBottom: 24,
  },
  massiveHeart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseStatusText: { fontSize: 10, letterSpacing: 2, opacity: 0.8 },

  countdownCard: {
    borderRadius: 28,
    overflow: 'hidden',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardInfo: { flex: 1 },
  countdownLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 6 },
  countdownTitle: { fontSize: 22, letterSpacing: -0.5, marginBottom: 4 },
  countdownSub: { fontSize: 13, opacity: 0.7 },
  verticalChevron: { opacity: 0.4 },

  addCountdownCard: {
    height: 100,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(138, 43, 226, 0.05)',
  },
  addCountdownText: { fontSize: 11, letterSpacing: 1, textAlign: 'center' },

  sectionDivider: { marginBottom: 20, paddingHorizontal: 4 },
  sectionLabel: { fontSize: 11, letterSpacing: 3 },
  editorialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureTile: {
    width: (width - 48 - 12) / 2,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
  },
  tileBlur: {
    flex: 1,
    padding: 24,
    minHeight: 150,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconBay: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  iconBayGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  tileTitle: { fontSize: 18, marginBottom: 2 },
  tileSub: { fontSize: 10, letterSpacing: 1 },
});

export default DashboardScreen;
