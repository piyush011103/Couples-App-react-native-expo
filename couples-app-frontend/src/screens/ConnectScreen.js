import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RADIUS, SIZES } from "../constants/theme";
import EditorialInput from "../components/EditorialInput";
import GlassCard from "../components/GlassCard";
import useAuthStore from "../store/useAuthStore";
import useThemeStore from "../store/useThemeStore";

const { width } = Dimensions.get('window');

const ConnectScreen = () => {
  const { colors } = useThemeStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, connectPartner, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  const handleConnect = async () => {
    if (!code || code.trim().length < 6) {
      Alert.alert("Invalid Code", "Please enter a valid 6-character code.");
      return;
    }
    setLoading(true);
    try {
      await connectPartner(code.trim().toUpperCase());
      Alert.alert("💜 Connected!", "You're now linked with your partner.");
    } catch (err) {
      Alert.alert("Connection Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const shareCode = async () => {
    try {
      await Share.share({
        message: `Hey love! Join me on Together using my code: ${user?.connectionCode}`,
      });
    } catch (e) {
      /* ignore */
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(138, 43, 226, 0.10)', 'rgba(255, 77, 141, 0.08)', 'rgba(18, 18, 29, 0)']}
        style={styles.bgGlow}
        start={{ x: 0.0, y: 0.0 }}
        end={{ x: 1.0, y: 1.0 }}
        locations={[0.0, 0.5, 1.0]}
      />

      {/* Top Right Exit Button */}
      <TouchableOpacity 
        style={[styles.exitBtn, { top: insets.top + 10 }]}
        onPress={logout}
        activeOpacity={0.7}
      >
        <Text style={[styles.exitText, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_500Medium' }]}>
          BACK TO GATEWAY
        </Text>
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Editorial Header */}
        <View style={styles.header}>
          <Text style={[styles.displayLg, { color: colors.text, fontFamily: 'Manrope_800ExtraBold' }]}>
            Connect{"\n"}Spaces
          </Text>
          <View style={styles.subtextContainer}>
            <Text style={[styles.bodyLg, { color: colors.textSub, fontFamily: 'Manrope_400Regular' }]}>
              Enter your partner's unique key or share your own to synchronize your digital sanctuary.
            </Text>
          </View>
        </View>

        {/* Your Code Section */}
        <GlassCard style={styles.codeCard}>
          <Text style={[styles.labelMd, { color: colors.textSub, fontFamily: 'PlusJakartaSans_500Medium' }]}>
            YOUR UNIQUE KEY
          </Text>
          <View style={styles.codeRow}>
            {user?.connectionCode?.split("").map((char, i) => (
              <View key={i} style={[styles.codeBox, { borderColor: colors.borderLight, backgroundColor: 'rgba(52, 52, 64, 0.3)' }]}>
                <Text style={[styles.codeChar, { color: colors.primary, fontFamily: 'Manrope_700Bold' }]}>
                  {char}
                </Text>
              </View>
            ))}
          </View>
          <TouchableOpacity 
            style={styles.shareBtnContainer} 
            activeOpacity={0.8}
            onPress={shareCode}
          >
            <LinearGradient
              colors={['rgba(138, 43, 226, 0.2)', 'rgba(255, 77, 141, 0.15)']}
              start={{ x: 0.0, y: 0.0 }}
              end={{ x: 1.0, y: 0.0 }}
              locations={[0.0, 1.0]}
              style={styles.shareBtn}
            >
              <Text style={[styles.shareBtnText, { color: colors.primary, fontFamily: 'Manrope_700Bold' }]}>
                SHARE KEY WITH PARTNER
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </GlassCard>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_500Medium' }]}>
            SYNCHRONIZE
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Enter Partner Code */}
        <View style={styles.enterSection}>
          <EditorialInput
            label="PARTNER KEY"
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            placeholder="E.G. A3X9B2"
            autoCapitalize="characters"
          />
          
          <TouchableOpacity 
            style={styles.buttonContainer}
            activeOpacity={0.8}
            onPress={handleConnect}
            disabled={loading}
          >
            <LinearGradient
              colors={['#8A2BE2', '#FF4D8D']}
              start={{ x: 0.0, y: 0.0 }}
              end={{ x: 1.0, y: 0.0 }}
              locations={[0.0, 1.0]}
              style={styles.primaryButton}
            >
              <Text style={[styles.buttonText, { color: '#E3E0F1', fontFamily: 'Manrope_700Bold' }]}>
                {loading ? "LINKING..." : "CONNECT SPACES"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bgGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  exitBtn: {
    position: 'absolute',
    right: 28,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  exitText: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  header: {
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  displayLg: {
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -2,
  },
  subtextContainer: {
    marginTop: 20,
    maxWidth: '90%',
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  codeCard: {
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 24,
  },
  labelMd: {
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 24,
  },
  codeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 32,
  },
  codeBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  codeChar: {
    fontSize: 24,
    letterSpacing: 1,
  },
  shareBtnContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  shareBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  shareBtnText: {
    fontSize: 12,
    letterSpacing: 1,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 40,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 10,
    letterSpacing: 3,
    marginHorizontal: 16,
    opacity: 0.5,
  },
  enterSection: {
    flex: 1,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    letterSpacing: 1,
  },
});

export default ConnectScreen;
