import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useThemeStore from "../store/useThemeStore";
import useAuthStore from "../store/useAuthStore";
import EditorialInput from "../components/EditorialInput";

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      Alert.alert("Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(138, 43, 226, 0.12)', 'rgba(255, 77, 141, 0.08)', 'rgba(18, 18, 29, 0)']}
        style={styles.bgGlow}
        start={{ x: 0.0, y: 0.0 }}
        end={{ x: 1.0, y: 1.0 }}
        locations={[0.0, 0.5, 1.0]}
      />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Editorial Header */}
          <View style={styles.header}>
            <Text style={[styles.displayLg, { color: colors.text, fontFamily: 'Manrope_800ExtraBold' }]}>
              Welcome{"\n"}Back
            </Text>
            <View style={styles.subtextContainer}>
              <Text style={[styles.bodyLg, { color: colors.textSub, fontFamily: 'Manrope_400Regular' }]}>
                Continue your shared journey into the digital sanctuary.
              </Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <EditorialInput
              label="Account Identity"
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
            />
            
            <EditorialInput
              label="Private Key"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPwd}
              onRightIconPress={() => setShowPwd(!showPwd)}
              rightIcon={
                <Text style={{ color: colors.primary, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 }}>
                  {showPwd ? "HIDE" : "SHOW"}
                </Text>
              }
            />

            <TouchableOpacity 
              style={styles.buttonContainer}
              activeOpacity={0.8}
              onPress={handleLogin}
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
                  {loading ? "AUTHENTICATING..." : "SIGN IN"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer - Editorial Link */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={[styles.labelMd, { color: colors.textSub, fontFamily: 'PlusJakartaSans_500Medium' }]}>
                NEW TO THE SANCTUARY? <Text style={{ color: colors.primary, fontFamily: 'Manrope_700Bold' }}>CREATE ACCOUNT</Text>
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ marginTop: 24 }}
              onPress={() => navigation.navigate("Welcome")}
            >
              <Text style={[styles.labelMd, { color: colors.textMuted, opacity: 0.6 }]}>
                BACK TO GATEWAY
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  header: {
    marginBottom: 48,
    alignItems: 'flex-start',
  },
  displayLg: {
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -2,
  },
  subtextContainer: {
    marginTop: 20,
    maxWidth: '85%',
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
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
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  labelMd: {
    fontSize: 12,
    letterSpacing: 2,
    textAlign: 'center',
  },
});

export default LoginScreen;
