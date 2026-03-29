import React from "react";
import { View, StyleSheet } from "react-native";
import { RADIUS, SHADOWS } from "../constants/theme";
import useThemeStore from "../store/useThemeStore";

/**
 * GlassCard — premium frosted-glass card with optional glow border
 *
 * Props:
 *   style       — extra styles
 *   glow        — 'purple' | 'pink' | 'none' (default 'none')
 *   children
 */
const GlassCard = ({ style, children, glow = "none" }) => {
  const colors = useThemeStore((state) => state.colors);

  const borderColor = {
    purple: "rgba(138,43,226,0.30)",
    pink: "rgba(255,77,141,0.25)",
    none: colors.glassBorder,
  }[glow];

  const shadowStyle = {
    purple: SHADOWS.purple,
    pink: SHADOWS.pink,
    none: SHADOWS.card,
  }[glow];

  return (
    <View
      style={[
        styles.card,
        { borderColor, backgroundColor: colors.glass },
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xxl,
    borderWidth: 1.2,
    padding: 20,
    // Subtle inner highlight via backgroundColor layering
    overflow: "hidden",
  },
});

export default GlassCard;
