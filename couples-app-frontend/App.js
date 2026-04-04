import React, { useEffect } from "react";
import { StatusBar, ActivityIndicator, View } from "react-native";
import { 
  useFonts, 
  Manrope_400Regular, 
  Manrope_700Bold, 
  Manrope_800ExtraBold 
} from "@expo-google-fonts/manrope";
import { 
  PlusJakartaSans_500Medium 
} from "@expo-google-fonts/plus-jakarta-sans";

import { setAudioModeAsync } from "expo-audio";
import AppNavigator from "./src/navigation/AppNavigator";
import useThemeStore from "./src/store/useThemeStore";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  const { mode, colors, initTheme } = useThemeStore();

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    PlusJakartaSans_500Medium,
  });

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "duck",
      shouldPlayInBackground: true,
    });
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#12121D", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
        translucent={true}
      />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
