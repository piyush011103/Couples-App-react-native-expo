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
import { FONTS, RADIUS, SIZES } from "../constants/theme";
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

const CheckInScreen = () => {
  const colors = useThemeStore((state) => state.colors);
  const styles = createStyles(colors);
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
      <View
        style={[
          styles.root,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ fontSize: 60, marginBottom: 20 }}>✨</Text>
        <Text style={styles.successTitle}>Check-in saved!</Text>
        <Text style={styles.successSub}>
          Your partner can see how you're feeling today.
        </Text>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => setSubmitted(false)}
        >
          <Text style={styles.resetBtnText}>Do another check-in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Daily Check-In</Text>
        <Text style={styles.subheading}>
          Let your partner know how you're feeling
        </Text>

        {/* Mood Selector */}
        <GlassCard style={styles.moodCard}>
          <Text style={styles.sectionLabel}>How are you feeling?</Text>
          <View style={styles.moodGrid}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[
                  styles.moodBtn,
                  selectedMood === m.value && styles.moodBtnActive,
                ]}
                onPress={() => setSelectedMood(m.value)}
                activeOpacity={0.8}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    selectedMood === m.value && styles.moodLabelActive,
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Energy Slider */}
        <GlassCard style={styles.energyCard}>
          <View style={styles.energyHeader}>
            <Text style={styles.sectionLabel}>Energy Level</Text>
            <Text style={styles.energyValue}>{Math.round(energy)}/10</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={energy}
            onValueChange={setEnergy}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.surfaceLight}
            thumbTintColor={colors.accent}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>😴 Exhausted</Text>
            <Text style={styles.sliderLabel}>⚡ Energized</Text>
          </View>
        </GlassCard>

        {/* Day Note */}
        <View style={styles.noteCard}>
          <InputField
            label="How was your day?"
            value={dayNote}
            onChangeText={setDayNote}
            placeholder="Share a little about today... 💭"
            multiline
            numberOfLines={4}
          />
        </View>

        <PrimaryButton
          title="Send Check-In ✨"
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: 4 }}
        />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    glow: {
      position: "absolute",
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: "rgba(236,72,153,0.08)",
      top: -80,
      right: -80,
    },
    scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
    heading: {
      fontSize: SIZES.xxxl,
      fontWeight: FONTS.bold,
      color: colors.text,
    },
    subheading: {
      fontSize: SIZES.base,
      color: colors.textSub,
      marginTop: 6,
      marginBottom: 28,
    },
    moodCard: { marginBottom: 16 },
    sectionLabel: {
      fontSize: SIZES.sm,
      fontWeight: FONTS.semibold,
      color: colors.textSub,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 16,
    },
    moodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    moodBtn: {
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: RADIUS.lg,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
      width: "30%",
    },
    moodBtnActive: {
      borderColor: colors.accent,
      backgroundColor: "rgba(236,72,153,0.12)",
    },
    moodEmoji: { fontSize: 28, marginBottom: 6 },
    moodLabel: { fontSize: SIZES.xs, color: colors.textSub },
    moodLabelActive: { color: colors.accent, fontWeight: FONTS.semibold },
    energyCard: { marginBottom: 16 },
    energyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    energyValue: {
      fontSize: SIZES.xl,
      fontWeight: FONTS.bold,
      color: colors.primaryLight,
    },
    slider: { width: "100%", marginTop: 8 },
    sliderLabels: { flexDirection: "row", justifyContent: "space-between" },
    sliderLabel: { fontSize: SIZES.xs, color: colors.textMuted },
    noteCard: { marginBottom: 8 },
    successTitle: {
      fontSize: SIZES.xxl,
      fontWeight: FONTS.bold,
      color: colors.text,
      textAlign: "center",
    },
    successSub: {
      fontSize: SIZES.base,
      color: colors.textSub,
      marginTop: 8,
      textAlign: "center",
    },
    resetBtn: {
      marginTop: 28,
      paddingVertical: 12,
      paddingHorizontal: 28,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resetBtnText: { color: colors.textSub, fontSize: SIZES.base },
  });

export default CheckInScreen;
