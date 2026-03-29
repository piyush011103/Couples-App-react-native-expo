import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getColors, getGradients } from "../constants/theme";

const THEME_STORAGE_KEY = "couples-app-theme-mode";

const useThemeStore = create((set, get) => ({
  mode: "dark",
  colors: getColors("dark"),
  gradients: getGradients("dark"),

  initTheme: async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode === "light" || savedMode === "dark") {
        set({
          mode: savedMode,
          colors: getColors(savedMode),
          gradients: getGradients(savedMode),
        });
      }
    } catch (e) {
      // Ignore storage issues and keep defaults.
    }
  },

  setMode: async (mode) => {
    const nextMode = mode === "light" ? "light" : "dark";
    set({
      mode: nextMode,
      colors: getColors(nextMode),
      gradients: getGradients(nextMode),
    });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch (e) {
      // Ignore storage errors; runtime state is still updated.
    }
  },

  toggleTheme: async () => {
    const nextMode = get().mode === "dark" ? "light" : "dark";
    await get().setMode(nextMode);
  },
}));

export default useThemeStore;
