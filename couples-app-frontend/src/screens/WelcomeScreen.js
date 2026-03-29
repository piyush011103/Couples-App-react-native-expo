import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '../store/useThemeStore';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const { colors, fonts } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Background with the signature "Void" color and a subtle glow */}
      <View style={[styles.background, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['rgba(138, 43, 226, 0.15)', 'rgba(255, 77, 141, 0.10)', 'rgba(18, 18, 29, 0)']}
          style={styles.bgGlow}
          start={{ x: 0.0, y: 0.0 }}
          end={{ x: 1.0, y: 1.0 }}
          locations={[0.0, 0.5, 1.0]}
        />
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
        
        {/* Top Section: Branding/Welcome Message */}
        <View style={styles.headerSection}>
          <Text style={[styles.displayLg, { color: colors.text, fontFamily: 'Manrope_800ExtraBold' }]}>
            The{"\n"}Ethereal{"\n"}Connection
          </Text>
          <View style={styles.subtextContainer}>
            <Text style={[styles.bodyLg, { color: colors.textSub, fontFamily: 'Manrope_400Regular' }]}>
              A digital sanctuary for souls separated by miles.
            </Text>
          </View>
        </View>

        {/* Center Section: Abstract Glass Element */}
        <View style={styles.centerSection}>
          <BlurView intensity={30} tint="dark" style={styles.glassCard}>
            <View style={[styles.glassCardInner, { borderColor: colors.border }]}>
               <View style={styles.orb} />
               <Text style={[styles.labelMd, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_500Medium' }]}>
                 SYCHRONIZED . PRIVATE . PREMIUM
               </Text>
            </View>
          </BlurView>
        </View>

        {/* Bottom Section: Actions */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.buttonContainer}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Register')}
          >
            <LinearGradient
              colors={['#8A2BE2', '#FF4D8D']}
              start={{ x: 0.0, y: 0.0 }}
              end={{ x: 1.0, y: 0.0 }}
              locations={[0.0, 1.0]}
              style={styles.primaryButton}
            >
              <Text style={[styles.buttonText, { color: '#E3E0F1', fontFamily: 'Manrope_700Bold' }]}>
                Start Journey
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.labelMd, { color: colors.textSub, fontFamily: 'PlusJakartaSans_500Medium' }]}>
              ALREADY CONNECTED? <Text style={{ color: colors.primary, fontFamily: 'Manrope_700Bold' }}>SIGN IN</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  bgGlow: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'flex-start',
  },
  displayLg: {
    fontSize: 56, // 3.5rem
    lineHeight: 64,
    letterSpacing: -2,
  },
  subtextContainer: {
    marginTop: 16,
    maxWidth: '80%',
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCard: {
    width: width * 0.8,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  glassCardInner: {
    padding: 32,
    alignItems: 'center',
    gap: 20,
  },
  orb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8A2BE2',
    opacity: 0.15,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  footer: {
    gap: 16,
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    height: 60,
    borderRadius: 30, // Full pill
    overflow: 'hidden',
  },
  primaryButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  labelMd: {
    fontSize: 12,
    letterSpacing: 2,
    textAlign: 'center',
  },
});

export default WelcomeScreen;
