import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import useThemeStore from '../store/useThemeStore';

const EditorialInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType,
  rightIcon,
  style,
  onRightIconPress,
  ...rest
}) => {
  const { colors } = useThemeStore();
  const [focused, setFocused] = useState(false);

  const animContainerStyle = useAnimatedStyle(() => ({
    borderColor: focused
      ? withTiming(error ? colors.error : colors.primary, { duration: 250 })
      : withTiming(colors.border, { duration: 250 }),
    backgroundColor: focused
      ? withTiming('rgba(52, 52, 64, 0.65)', { duration: 250 })
      : withTiming('rgba(52, 52, 64, 0.45)', { duration: 250 }),
  }));

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSub, fontFamily: 'PlusJakartaSans_500Medium' }]}>
          {label}
        </Text>
      )}

      <BlurView intensity={20} tint="dark" style={styles.blurWrapper}>
        <Animated.View style={[styles.container, animContainerStyle]}>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, fontFamily: 'Manrope_400Regular' },
            ]}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            selectionColor={colors.primary}
            autoCapitalize="none"
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
      </BlurView>

      {error && (
        <Text style={[styles.error, { color: colors.error, fontFamily: 'PlusJakartaSans_500Medium' }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    marginBottom: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  blurWrapper: {
    borderRadius: 24, // Radius xl (1.5rem / 24px)
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    minHeight: 64,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  rightIcon: {
    padding: 8,
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default EditorialInput;
