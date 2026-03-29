import React, { useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { FONTS, RADIUS, SIZES, SHADOWS } from "../constants/theme";
import useThemeStore from "../store/useThemeStore";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PrimaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "gradient", // 'gradient' | 'outline' | 'ghost'
  size = "md", // 'sm' | 'md' | 'lg'
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const colors = useThemeStore((state) => state.colors);
  const gradients = useThemeStore((state) => state.gradients);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.94, { damping: 12, stiffness: 200 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 180 });
  };

  const heights = { sm: 44, md: 54, lg: 62 };
  const fontSizes = { sm: SIZES.sm, md: SIZES.base, lg: SIZES.md };

  const isDisabled = disabled || loading;

  if (variant === "outline") {
    return (
      <Animated.View style={[animStyle, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={isDisabled}
          activeOpacity={1}
          style={[
            styles.base,
            { height: heights[size], borderColor: colors.primary },
            styles.outline,
            isDisabled && styles.disabled,
          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.outlineText,
                { color: colors.primaryLight, fontSize: fontSizes[size] },
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === "ghost") {
    return (
      <Animated.View style={[animStyle, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={isDisabled}
          activeOpacity={1}
          style={[
            styles.base,
            { height: heights[size] },
            isDisabled && styles.disabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textSub} />
          ) : (
            <Text
              style={[
                styles.ghostText,
                { color: colors.textSub, fontSize: fontSizes[size] },
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Default: gradient
  return (
    <Animated.View style={[animStyle, SHADOWS.purple, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        activeOpacity={1}
        style={[{ borderRadius: RADIUS.full }, isDisabled && { opacity: 0.5 }]}
      >
        <LinearGradient
          colors={
            isDisabled
              ? [colors.surfaceLight || '#2A2A35', colors.surfaceLight || '#2A2A35']
              : (gradients?.brand || ['#8A2BE2', '#FF4D8D'])
          }
          start={{ x: 0.0, y: 0.0 }}
          end={{ x: 1.0, y: 0.0 }}
          locations={[0.0, 1.0]}
          style={[styles.base, styles.gradient, { height: heights[size] }]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text
              style={[
                styles.gradientText,
                { fontSize: fontSizes[size] },
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    borderRadius: RADIUS.full,
  },
  gradient: {
    // height set dynamically
  },
  gradientText: {
    color: "#FFFFFF",
    fontWeight: FONTS.bold,
    letterSpacing: 0.4,
  },
  outline: {
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  outlineText: {
    fontWeight: FONTS.semibold,
    letterSpacing: 0.3,
  },
  ghostText: {
    fontWeight: FONTS.medium,
  },
  disabled: { opacity: 0.5 },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});

export default PrimaryButton;
