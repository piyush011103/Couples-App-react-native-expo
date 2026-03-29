import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { FONTS, RADIUS, SIZES } from "../constants/theme";
import useThemeStore from "../store/useThemeStore";

/**
 * InputField — premium styled input with focus animation
 *
 * Props:
 *   label, placeholder, value, onChangeText
 *   error, secureTextEntry, keyboardType
 *   rightIcon (ReactNode), leftIcon (ReactNode)
 *   multiline, style
 */
const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType,
  rightIcon,
  leftIcon,
  multiline,
  style,
  onRightIconPress,
  ...rest
}) => {
  const colors = useThemeStore((state) => state.colors);
  const [focused, setFocused] = useState(false);

  const borderOpacity = useSharedValue(0);
  const animBorderStyle = useAnimatedStyle(() => ({
    borderColor: focused
      ? withTiming(error ? colors.error : colors.primary, { duration: 200 })
      : withTiming(error ? colors.error : colors.border, { duration: 200 }),
    borderWidth: focused
      ? withTiming(1.5, { duration: 150 })
      : withTiming(1, { duration: 150 }),
  }));

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSub }]}>{label}</Text>
      ) : null}

      <Animated.View
        style={[
          styles.inputContainer,
          { backgroundColor: colors.surfaceLight, borderColor: colors.border },
          animBorderStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            leftIcon && { paddingLeft: 4 },
            rightIcon && { paddingRight: 4 },
            multiline && styles.multiline,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={colors.primary}
          {...rest}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            activeOpacity={0.7}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </Animated.View>

      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: SIZES.xs,
    fontWeight: FONTS.semibold,
    marginBottom: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    paddingHorizontal: 18,
    minHeight: 54,
  },
  input: {
    flex: 1,
    fontSize: SIZES.base,
    fontWeight: FONTS.regular,
    paddingVertical: 14,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { padding: 4, marginLeft: 8 },
  error: {
    fontSize: SIZES.xs,
    marginTop: 5,
    marginLeft: 4,
  },
});

export default InputField;
