import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import Animated, { useAnimatedProps, useSharedValue, withTiming, withSpring, useAnimatedStyle, withRepeat, withSequence } from "react-native-reanimated";
import { FONTS, RADIUS, SIZES, GRADIENTS, SHADOWS } from "../constants/theme";
import GlassCard from "../components/GlassCard";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import apiClient from "../api/apiClient";
import useSocketStore from "../store/useSocketStore";
import useAuthStore from "../store/useAuthStore";
import useThemeStore from "../store/useThemeStore";

const { width } = Dimensions.get("window");
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CountdownScreen = () => {
  const { colors, mode } = useThemeStore();
  const styles = createStyles(colors, mode);

  /**
   * Atmospheric Background Glow
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
      opacity: 0.12,
    }));

    return (
      <Animated.View style={[styles.glowCircle, { backgroundColor: color }, style, animStyle]} />
    );
  };

  const { user } = useAuthStore();
  const socket = useSocketStore((state) => state.socket);

  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [eventName, setEventName] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("09:00");
  const [amPm, setAmPm] = useState("PM");
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef(null);

  const progressValue = useSharedValue(0);

  useEffect(() => {
    fetchCountdown();
  }, []);

  const handleUpdated = (cd) => setCountdown(cd);
  const handleRemoved = () => { setCountdown(null); setTimeLeft(null); progressValue.value = 0; };

  useEffect(() => {
    if (!socket) return;
    socket.on("countdown_updated", handleUpdated);
    socket.on("countdown_removed", handleRemoved);
    return () => {
      socket.off("countdown_updated", handleUpdated);
      socket.off("countdown_removed", handleRemoved);
    };
  }, [socket]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!countdown) return setTimeLeft(null);

    const tick = () => {
      const targetDate = new Date(countdown.targetDate);
      const createdAt = new Date(countdown.createdAt);
      const now = new Date();

      // Stabilize totalDuration: If createdAt is invalid or too close to target, 
      // fallback to a 30-day default interval to ensure the bar has a "full" starting state.
      let totalDuration = targetDate - createdAt;
      if (isNaN(totalDuration) || totalDuration <= 0) {
        totalDuration = 30 * 24 * 60 * 60 * 1000; // 30 day default
      }

      const remaining = targetDate - now;

      if (remaining <= 0) {
        setTimeLeft(null);
        progressValue.value = withTiming(0, { duration: 1000 });
        clearInterval(intervalRef.current);
        return;
      }

      const progress = Math.min(1, Math.max(0, remaining / totalDuration));
      progressValue.value = withSpring(progress, { damping: 18, stiffness: 80 });

      setTimeLeft({
        days: Math.floor(remaining / 86400000),
        hours: Math.floor((remaining / 3600000) % 24),
        minutes: Math.floor((remaining / 60000) % 60),
        seconds: Math.floor((remaining / 1000) % 60),
      });
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [countdown]);

  const fetchCountdown = async () => {
    try {
      const res = await apiClient.get("/countdown");
      setCountdown(res.data);
    } catch (e) { setCountdown(null); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    const dateParts = dateInput.split("-").map(Number);
    const timeParts = timeInput.split(":").map(Number);

    if (dateParts.length !== 3 || timeParts.length !== 2) {
      return Alert.alert("Format Mismatch", "Use YYYY-MM-DD for date and HH:mm for time.");
    }

    let hour = timeParts[0];
    const minute = timeParts[1];

    // 12h to 24h conversion
    if (amPm === "PM" && hour < 12) hour += 12;
    if (amPm === "AM" && hour === 12) hour = 0;

    // Construct local date rigorously
    const targetDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hour, minute, 0, 0);

    if (isNaN(targetDate.getTime())) return Alert.alert("Format Mismatch", "Universal date/time format mismatch");

    const now = new Date();
    if (targetDate <= now) {
      return Alert.alert("Temporal Paradox", "The milestone must be in the future. Even 1 minute from now is valid!");
    }

    setSaving(true);
    try {
      // We send the UTC string, but ensured local components correctly formed it
      const res = await apiClient.post("/countdown", {
        eventName: eventName || "The Reunion",
        targetDate: targetDate.toISOString(),
      });
      const saved = res.data.countdown;
      setCountdown(saved);
      setShowForm(false);
      setEventName("");
      setDateInput("");
      setTimeInput("09:00");
      setAmPm("PM");
      if (socket && res.data.partnerId) {
        socket.emit("countdown_set", { receiverId: res.data.partnerId, countdown: saved });
      }
    } catch (e) { Alert.alert("Error", "Could not sync countdown"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    Alert.alert("Dissolve Countdown", "This will remove the sanctuary milestone for both of you.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Dissolve", style: "destructive", onPress: async () => {
          try {
            const res = await apiClient.delete("/countdown");
            setCountdown(null);
            setTimeLeft(null);
            progressValue.value = 0;
            if (socket && res.data.partnerId) socket.emit("countdown_deleted", { receiverId: res.data.partnerId });
          } catch (e) { Alert.alert("Error", "Could not remove milestone"); }
        }
      },
    ]);
  };

  const ProgressRing = ({ size, strokeWidth }) => {
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedProps = useAnimatedProps(() => ({
      strokeDashoffset: circumference * (1 - progressValue.value),
    }));

    return (
      <View style={styles.ringWrapper}>
        <Svg width={size} height={size}>
          <Defs>
            <SvgGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={mode === 'dark' ? '#8A2BE2' : '#A53B22'} stopOpacity="1" />
              <Stop offset="100%" stopColor={mode === 'dark' ? '#FF4D8D' : '#FF7E5F'} stopOpacity="1" />
            </SvgGradient>
          </Defs>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.surfaceContainerHighest}
            strokeWidth={strokeWidth}
            fill="transparent"
            opacity={0.15}
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#grad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            rotation="-90"
            origin={`${center}, ${center}`}
          />
        </Svg>
      </View>
    );
  };

  if (loading) return (
    <View style={[styles.root, { justifyContent: "center" }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Editorial Depth */}
      <AnimatedGlow color={mode === 'dark' ? "#8A2BE2" : "#FF7E5F"} style={{ top: '5%', right: '-10%' }} />
      <AnimatedGlow color={mode === 'dark' ? "#FF4D8D" : "#FEB47B"} style={{ bottom: '15%', left: '-15%' }} duration={15000} />
      <AnimatedGlow color={mode === 'dark' ? "#7C3AED" : "#FFA07A"} style={{ top: '40%', alignSelf: 'center', width: 300, height: 300 }} duration={20000} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }]}>NEXT TIME TOGETHER IN...</Text>
        </View>

        {countdown && timeLeft ? (
          <View intensity={Platform.OS === 'ios' ? 45 : 80} tint={mode === 'dark' ? "dark" : "light"} style={styles.mainCard}>
            {/* Liquid Glass Sheen Overlay */}
            <LinearGradient
              colors={mode === 'dark' ? ['rgba(255,255,255,0.08)', 'transparent'] : ['rgba(255,255,255,0.4)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />


            <View style={styles.visualTicker}>
              <ProgressRing size={width * 0.65} strokeWidth={10} />
              <View style={styles.displayArea}>
                <Text style={[styles.mainValue, { color: colors.text, fontFamily: 'Manrope_800ExtraBold' }]}>{timeLeft.days}</Text>
                <Text style={[styles.mainUnit, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_700Bold' }]}>DAYS REMAINING</Text>
              </View>
            </View>

            <View style={styles.eventInfo}>
              <Text style={styles.markerText}>TARGET EVENT</Text>
              <Text style={styles.eventNameText}>{countdown.eventName.toUpperCase()}</Text>
              <Text style={styles.dateText}>
                {new Date(countdown.targetDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", weekday: "short" }).toUpperCase()}
                {"   "}
                <Text style={{ color: colors.primary }}>
                  {new Date(countdown.targetDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </Text>
              </Text>
            </View>

            <View style={styles.detailedTimeRow}>
              <View style={styles.timeDetail}><Text style={styles.detailValue}>{String(timeLeft.hours).padStart(2, "0")}</Text><Text style={styles.detailLabel}>H</Text></View>
              <Text style={styles.detailDivider}>:</Text>
              <View style={styles.timeDetail}><Text style={styles.detailValue}>{String(timeLeft.minutes).padStart(2, "0")}</Text><Text style={styles.detailLabel}>M</Text></View>
              <Text style={styles.detailDivider}>:</Text>
              <View style={styles.timeDetail}><Text style={styles.detailValue}>{String(timeLeft.seconds).padStart(2, "0")}</Text><Text style={styles.detailLabel}>S</Text></View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.editBtn} onPress={() => {
                const dt = new Date(countdown.targetDate);
                setEventName(countdown.eventName);
                setDateInput(dt.toISOString().split("T")[0]);

                let h = dt.getHours();
                const m = dt.getMinutes();
                setAmPm(h >= 12 ? "PM" : "AM");
                h = h % 12 || 12;
                setTimeInput(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
                setShowForm(true);
              }}>
                <Text style={styles.editBtnText}>REFINE EVENT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dissolveBtn} onPress={handleDelete}>
                <Text style={styles.dissolveBtnText}>DISSOLVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : countdown && !timeLeft ? (
          <View intensity={Platform.OS === 'ios' ? 50 : 90} tint={mode === 'dark' ? "dark" : "light"} style={styles.reachedCard}>
            <LinearGradient
              colors={mode === 'dark' ? ['rgba(255,255,255,0.05)', 'transparent'] : ['rgba(255,255,255,0.3)', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.reachedEmoji}>{mode === 'dark' ? "🌌" : "🌅"}</Text>
            <Text style={[styles.reachedTitle, { color: colors.text, fontFamily: 'Manrope_800ExtraBold' }]}>Convergence Achieved</Text>
            <Text style={[styles.reachedSub, { color: colors.textSub, fontFamily: 'PlusJakartaSans_500Medium' }]}>The moment for {countdown.eventName} is now.</Text>
            <PrimaryButton title="PROJECT NEW MILESTONE" onPress={() => setShowForm(true)} style={{ marginTop: 28 }} />
          </View>
        ) : (
          <TouchableOpacity style={styles.emptyContainer} onPress={() => setShowForm(true)}>
            <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint={mode === 'dark' ? "dark" : "light"} style={styles.emptyCard}>
              <LinearGradient
                colors={mode === 'dark' ? ['rgba(255,255,255,0.03)', 'transparent'] : ['rgba(255,255,255,0.2)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <Text style={styles.emptyEmoji}>⏳</Text>
              <Text style={styles.emptyTitle}>Initiate Pulse</Text>
              <Text style={styles.emptySub}>Awaiting your next earthly convergence.</Text>
              <View style={styles.initiateBtn}>
                <Text style={styles.initiateText}>SET MILESTONE</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        )}

        {/* Editorial Modal Overlay */}
        <Modal visible={showForm} transparent animationType="fade">
          <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Manrope_800ExtraBold' }]}>Temporal Goal</Text>



              <InputField label="COUNTDOWN NAME" value={eventName} onChangeText={setEventName} placeholder="e.g. Switzerland Trip" />
              <InputField label="DATE (YYYY-MM-DD)" value={dateInput} onChangeText={setDateInput} placeholder="e.g. 2026-06-21" />

              <View style={styles.timeSelectionRow}>
                <View style={{ flex: 1 }}>
                  <InputField label="TIME (HH:mm)" value={timeInput} onChangeText={setTimeInput} placeholder="e.g. 09:30" />
                </View>
                <View style={styles.amPmContainer}>
                  <Text style={styles.amPmLabel}>PERIOD</Text>
                  <TouchableOpacity
                    style={styles.amPmToggle}
                    onPress={() => setAmPm(prev => prev === "AM" ? "PM" : "AM")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.amPmHighlight, { left: amPm === "AM" ? 4 : 50 }]} />
                    <Text style={[styles.amPmTab, amPm === "AM" && styles.amPmActive]}>AM</Text>
                    <Text style={[styles.amPmTab, amPm === "PM" && styles.amPmActive]}>PM</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                  <Text style={styles.cancelText}>CANCEL</Text>
                </TouchableOpacity>
                <PrimaryButton title="SAVE" onPress={handleSave} loading={saving} style={{ flex: 1.5 }} />
              </View>
            </View>
          </BlurView>
        </Modal>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors, mode) =>
  StyleSheet.create({
    root: { flex: 1 },
    glowCircle: {
      position: 'absolute',
      width: 400,
      height: 400,
      borderRadius: 200,
      filter: Platform.OS === 'ios' ? 'blur(100px)' : undefined,
    },
    scroll: { paddingHorizontal: 32, paddingTop: 80, paddingBottom: 40 },
    header: { marginBottom: 32 },
    eyebrow: { fontFamily: FONTS.label, fontSize: 10, color: colors.primary, letterSpacing: 4, marginBottom: 12 },
    heading: { fontFamily: FONTS.display, fontSize: SIZES.display * 0.7, color: colors.text, lineHeight: SIZES.display * 0.7, marginBottom: 16 },
    sub: { fontFamily: FONTS.body, fontSize: SIZES.md, color: colors.textSub, width: "80%", lineHeight: 24 },
    mainCard: {
      paddingHorizontal: 24, paddingVertical: 40, borderRadius: 40, overflow: "hidden",
      borderWidth: 1.5, borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)'
    },
    visualTicker: { height: width * 0.65, justifyContent: "center", alignItems: "center", marginBottom: 32 },
    ringWrapper: { position: "absolute" },
    displayArea: { alignItems: "center" },
    mainValue: { fontFamily: FONTS.display, fontSize: 80, color: colors.text, lineHeight: 82 },
    mainUnit: { fontFamily: FONTS.label, fontSize: 8, color: colors.textMuted, letterSpacing: 3, marginTop: -4 },

    eventInfo: { alignItems: "center", marginBottom: 32 },
    markerText: { fontFamily: FONTS.label, fontSize: 8, color: colors.primary, letterSpacing: 3, marginBottom: 8 },
    eventNameText: { fontFamily: FONTS.headline, fontSize: SIZES.lg, color: colors.text, letterSpacing: 1 },
    dateText: { fontFamily: FONTS.body, fontSize: 10, color: colors.textMuted, marginTop: 4, letterSpacing: 1 },

    detailedTimeRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 36, opacity: 0.8 },
    timeDetail: { flexDirection: "row", alignItems: "baseline", gap: 2 },
    detailValue: { fontFamily: FONTS.display, fontSize: SIZES.xl, color: colors.text },
    detailLabel: { fontFamily: FONTS.label, fontSize: 8, color: colors.primary, opacity: 0.7 },
    detailDivider: { fontFamily: FONTS.display, fontSize: SIZES.lg, color: colors.textMuted, opacity: 0.3 },

    actionRow: { flexDirection: "row", gap: 12 },
    editBtn: { flex: 1, paddingVertical: 18, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)', alignItems: "center" },
    editBtnText: { fontFamily: FONTS.label, fontSize: 9, color: colors.textMuted, letterSpacing: 2 },
    dissolveBtn: { paddingHorizontal: 20, paddingVertical: 18, borderRadius: RADIUS.full, backgroundColor: "rgba(239, 68, 68, 0.08)", alignItems: "center" },
    dissolveBtnText: { fontFamily: FONTS.label, fontSize: 9, color: colors.error, letterSpacing: 1 },

    reachedCard: { padding: 40, borderRadius: 40, overflow: "hidden", alignItems: "center", borderWidth: 1.5, borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)' },
    reachedEmoji: { fontSize: 64, marginBottom: 20 },
    reachedTitle: { fontFamily: FONTS.display, fontSize: SIZES.xxl, color: colors.text, textAlign: "center" },
    reachedSub: { fontFamily: FONTS.body, fontSize: SIZES.md, color: colors.textSub, marginTop: 12, textAlign: "center" },

    emptyContainer: { width: "100%" },
    emptyCard: { padding: 48, borderRadius: 40, overflow: "hidden", alignItems: "center", borderWidth: 1.5, borderColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)' },
    emptyEmoji: { fontSize: 40, color: colors.primary, marginBottom: 24, opacity: 0.6 },
    emptyTitle: { fontFamily: FONTS.headline, fontSize: SIZES.xl, color: colors.text, marginBottom: 12, letterSpacing: 1 },
    emptySub: { fontFamily: FONTS.body, fontSize: SIZES.base, color: colors.textSub, textAlign: "center", opacity: 0.7, lineHeight: 22 },
    initiateBtn: { marginTop: 32, paddingVertical: 14, paddingHorizontal: 32, borderRadius: RADIUS.full, backgroundColor: colors.surfaceContainerLow },
    initiateText: { fontFamily: FONTS.label, fontSize: 9, color: colors.primary, letterSpacing: 3 },

    modalOverlay: { flex: 1, justifyContent: "center", padding: 32 },
    modalContent: {
      padding: 40,
      borderRadius: 40,
      overflow: "hidden",
      borderWidth: 1.5,
      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      backgroundColor: mode === 'dark' ? '#12121A' : '#FFFBF7',
    },

    modalEyebrow: { fontFamily: FONTS.label, fontSize: 9, color: colors.primary, letterSpacing: 4, marginBottom: 16 },
    modalTitle: { fontFamily: FONTS.display, fontSize: SIZES.xxl, color: colors.text, marginBottom: 32 },

    timeSelectionRow: { flexDirection: "row", gap: 16, alignItems: "flex-end", marginBottom: 16 },
    amPmContainer: { width: 100, marginBottom: 16 },
    amPmLabel: { fontFamily: FONTS.label, fontSize: 8, color: colors.textMuted, letterSpacing: 2, marginBottom: 8 },
    amPmToggle: {
      height: 48,
      width: 100,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: RADIUS.lg,
      flexDirection: "row",
      alignItems: "center",
      padding: 4,
      position: "relative"
    },
    amPmTab: {
      flex: 1,
      textAlign: "center",
      color: colors.textMuted,
      fontFamily: FONTS.label,
      fontSize: 10,
      zIndex: 2,
      letterSpacing: 1
    },
    amPmActive: { color: "#FFF" },
    amPmHighlight: {
      position: "absolute",
      width: 46,
      height: 40,
      backgroundColor: colors.primary,
      borderRadius: RADIUS.md,
      zIndex: 1,
      ...SHADOWS.ambient,
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 8
    },

    modalActions: { flexDirection: "row", gap: 16, marginTop: 24 },
    cancelBtn: { flex: 1, paddingVertical: 18, borderRadius: RADIUS.full, alignItems: "center" },
    cancelText: { fontFamily: FONTS.label, fontSize: 10, color: colors.textMuted, letterSpacing: 2 },
  });

export default CountdownScreen;
