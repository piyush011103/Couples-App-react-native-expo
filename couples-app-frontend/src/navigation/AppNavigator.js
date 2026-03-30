import React, { useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View, Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import useAuthStore from "../store/useAuthStore";
import useSocketStore from "../store/useSocketStore";
import useThemeStore from "../store/useThemeStore";

// Screens
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ConnectScreen from "../screens/ConnectScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ChatScreen from "../screens/ChatScreen";
import CheckInScreen from "../screens/CheckInScreen";
import MemoryWallScreen from "../screens/MemoryWallScreen";
import CountdownScreen from "../screens/CountdownScreen";
import WatchTogetherScreen from "../screens/WatchTogetherScreen";
import GamesScreen from "../screens/GamesScreen";
import MoreScreen from "../screens/MoreScreen";

const { width } = Dimensions.get('window');
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICON = {
  Home: "home",
  ChatTab: "chatbubble-ellipses",
  Memories: "heart",
  More: "grid",
};

/**
 * Custom Floating Editorial Tab Bar
 */
function EditorialTabBar({ state, descriptors, navigation }) {
  const { colors, mode } = useThemeStore();
  const insets = useSafeAreaInsets();
  
  // Hide on Chat screen
  const currentRoute = state.routes[state.index].name;
  if (currentRoute === 'ChatTab') return null;
  
  const isDark = mode === 'dark';
  
  return (
    <View style={[styles.tabBarContainer, { bottom: insets.bottom + 12 }]}>
      <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={[styles.floatingDock, { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', backgroundColor: isDark ? 'rgba(52, 52, 64, 0.75)' : 'rgba(255, 255, 255, 0.8)' }]}>
        <View style={styles.tabItemsContainer}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const iconName = isFocused ? TAB_ICON[route.name] : `${TAB_ICON[route.name]}-outline`;

            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.7}
                onPress={onPress}
                style={styles.tabItem}
              >
                <View style={[styles.iconContainer, isFocused && { shadowColor: isDark ? '#FFB1C4' : '#FF4D8D', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 }]}>
                  <Ionicons 
                    name={iconName} 
                    size={24} 
                    color={isFocused ? (isDark ? '#FFB1C4' : '#FF4D8D') : colors.textMuted} 
                    style={{ opacity: isFocused ? 1 : 0.6 }}
                  />
                  {isFocused && <View style={[styles.activeDot, { backgroundColor: isDark ? '#FFB1C4' : '#FF4D8D' }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <EditorialTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarLabel: "Space" }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{ tabBarLabel: "Chat" }}
      />
      <Tab.Screen
        name="Memories"
        component={MemoryWallScreen}
        options={{ tabBarLabel: "Sanctuary" }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{ tabBarLabel: "Portal" }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ──────────────────────────────────────────────────
export default function AppNavigator() {
  const colors = useThemeStore((state) => state.colors);
  const { user, isLoading, init } = useAuthStore();
  const { initSocket } = useSocketStore();

  useEffect(() => {
    init();
  }, []);

  // Once logged in, init socket
  useEffect(() => {
    if (user) initSocket(user);
  }, [user]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const navigationTheme = {
    ...DefaultTheme,
    dark: true, 
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.surfaceContainer,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
      notification: colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : !user.partnerId ? (
          <Stack.Screen name="Connect" component={ConnectScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="CheckIn" component={CheckInScreen} />
            <Stack.Screen name="Countdown" component={CountdownScreen} />
            <Stack.Screen name="Watch" component={WatchTogetherScreen} />
            <Stack.Screen name="Games" component={GamesScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  floatingDock: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1.5,
    width: width - 40,
    maxWidth: 400,
  },
  tabItemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeDot: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
