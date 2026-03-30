import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import Slider from "@react-native-community/slider";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { FONTS, RADIUS, SIZES, SHADOWS } from "../constants/theme";
import GlassCard from "../components/GlassCard";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import apiClient from "../api/apiClient";
import useThemeStore from "../store/useThemeStore";

const MOODS = [
  { emoji: "😄", label: "Happy", value: "Happy" },
  { emoji: "😢", label: "Sad", value: "Sad" },
  { emoji: "😤", label: "Stressed", value: "Stressed" },
  { emoji: "🥰", label: "Loved", value: "Loved" },
  { emoji: "😴", label: "Tired", value: "Tired" },
  { emoji: "😐", label: "Neutral", value: "Neutral" },
];

const MoodButton = ({ mood, isSelected, onPress, colors }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: isSelected
      ? withSpring(colors.accent)
      : withSpring(colors.border),
    backgroundColor: isSelected
      ? withSpring("rgba(255,77,141,0.12)")
      : withSpring(colors.surfaceContainerLow),
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.moodBtnContainer, animatedStyle]}>
      <TouchableOpacity
        style={styles.moodBtnInner}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
        <Text
          style={[
            styles.moodLabel,
            { color: isSelected ? colors.accent : colors.textSub },
            isSelected && { fontWeight: FONTS.semibold },
          ]}
        >
          {mood.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const CheckInScreen = () => {
  const colors = useThemeStore((state) => state.colors);
  const [selectedMood, setSelectedMood] = useState(null);
  const [energy, setEnergy] = useState(5);
  const [dayNote, setDayNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedMood) {
      Alert.alert("Select a mood", "Please pick how you are feeling today.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/checkin", {
        mood: selectedMood,
        energy,
        message: dayNote,
      });
      setSubmitted(true);
    } catch (e) {
      Alert.alert("Error", "Failed to save check-in. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <View style={styles.successContainer}>
          <Text style={{ fontSize: 72, marginBottom: 24 }}>✨</Text>
          <Text style={[styles.successTitle, { color: colors.text }]}>Check-in Sent</Text>
          <Text style={[styles.successSub, { color: colors.textSub }]}>
            Your partner has been notified of your mood.
          </Text>
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: colors.border }]}
            onPress={() => setSubmitted(false)}
          >
            <Text style={[styles.resetBtnText, { color: colors.textSub }]}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Editorial Header */}
        <View style={styles.headerSection}>
          <Text style={[styles.heading, { color: colors.text }]}>Check-in</Text>
          <Text style={[styles.subheading, { color: colors.textSub }]}>
            Sharing your digital heartbeat through the distance.
          </Text>
        </View>

        {/* Mood Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>How is your heart today?</Text>
          <View style={styles.moodGrid}>
            {MOODS.map((m) => (
              <MoodButton
                key={m.value}
                mood={m}
                isSelected={selectedMood === m.value}
                onPress={() => setSelectedMood(m.value)}
                colors={colors}
              />
            ))}
          </View>
        </View>

        {/* Energy Slider */}
        <GlassCard style={styles.glassCard} glow={energy > 7 ? "pink" : "none"}>
          <View style={styles.energyHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted, marginBottom: 0 }]}>Energy pulse</Text>
            <Text style={[styles.energyValue, { color: colors.accent }]}>{Math.round(energy)}/10</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={energy}
            onValueChange={setEnergy}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
          />
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>Low</Text>
            <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>Vibrant</Text>
          </View>
        </GlassCard>

        {/* Day Note */}
        <View style={styles.section}>
          <InputField
            label="The Narrative"
            value={dayNote}
            onChangeText={setDayNote}
            placeholder="What's on your mind?..."
            multiline
            numberOfLines={4}
            style={styles.inputField}
          />
        </View>

        <PrimaryButton
          title="Share My Beat ✨"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 60 },
  headerSection: {
    marginBottom: 40,
    paddingLeft: 4, // Intentionally slightly asymmetrical
  },
  heading: {
    fontSize: SIZES.title, // 28px editorial title
    fontFamily: FONTS.display,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subheading: {
    fontSize: SIZES.base,
    fontFamily: FONTS.body,
    opacity: 0.8,
    maxWidth: "80%",
  },
  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: SIZES.xs,
    fontFamily: FONTS.label,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 20,
    opacity: 0.7,
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  moodBtnContainer: {
    width: "30%",
    borderRadius: RADIUS.lg,
    borderWidth: 1.2,
    overflow: "hidden",
  },
  moodBtnInner: {
    alignItems: "center",
    paddingVertical: 18,
    width: "100%",
  },
  moodEmoji: { fontSize: 32, marginBottom: 8 },
  moodLabel: { fontSize: SIZES.sm, fontFamily: FONTS.body },
  glassCard: { padding: 24, marginBottom: 32 },
  energyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  energyValue: {
    fontSize: SIZES.xxl,
    fontFamily: FONTS.display,
  },
  slider: { width: "100%", height: 40 },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderLabel: { fontSize: SIZES.xs, fontFamily: FONTS.label, opacity: 0.6 },
  inputField: { marginBottom: 12 },
  submitBtn: { marginTop: 8 },
  successContainer: {
    padding: 32,
    alignItems: "center",
  },
  successTitle: {
    fontSize: SIZES.xxl,
    fontFamily: FONTS.display,
    textAlign: "center",
  },
  successSub: {
    fontSize: SIZES.md,
    fontFamily: FONTS.body,
    textAlign: "center",
    marginTop: 12,
    maxWidth: 240,
  },
  resetBtn: {
    marginTop: 48,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: RADIUS.full,
    borderWidth: 1.2,
  },
  resetBtnText: {
    fontSize: SIZES.base,
    fontFamily: FONTS.semibold,
  },
});

export default CheckInScreen;
