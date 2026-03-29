import React, { useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";

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

import { Ionicons } from "@expo/vector-icons";

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
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();
  
  // Hide on Chat screen
  const currentRoute = state.routes[state.index].name;
  if (currentRoute === 'ChatTab') return null;
  
  return (
    <View style={[styles.tabBarContainer, { bottom: insets.bottom + 12 }]}>
      <BlurView intensity={80} tint="dark" style={styles.floatingDock}>
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
                <View style={[styles.iconContainer, isFocused && { shadowColor: '#FFB1C4', shadowOpacity: 0.6, shadowRadius: 10, elevation: 5 }]}>
                  <Ionicons 
                    name={iconName} 
                    size={24} 
                    color={isFocused ? '#FFB1C4' : colors.textMuted} 
                    style={{ opacity: isFocused ? 1 : 0.6 }}
                  />
                  {isFocused && <View style={styles.activeDot} />}
                </View>
                {/* <Text style={[styles.tabLabel, { color: isFocused ? '#FFB1C4' : colors.textMuted, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
                  {label}
                </Text> */}
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

function MainTabs() {
  const { colors } = useThemeStore();

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
        component={MoreHomeScreen}
        options={{ tabBarLabel: "Portal" }}
      />
    </Tab.Navigator>
  );
}

// Styles
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
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(52, 52, 64, 0.75)',
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
  tabIcon: {
    fontSize: 22,
  },
  activeDot: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFB1C4',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Simple "More" menu style
  container: {
    flex: 1,
    padding: 24,
  },
  moreHeader: {
    marginBottom: 32,
  },
  moreTitle: {
    fontSize: 32,
    letterSpacing: -1,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    opacity: 0.7,
  },
});

// A simple "More" menu screen
const MORE_ITEMS = [
  {
    icon: "✍️",
    title: "Daily Check-In",
    sub: "Share how your day went",
    screen: "CheckIn",
  },
  {
    icon: "📅",
    title: "Countdown",
    sub: "Track your next meetup",
    screen: "Countdown",
  },
  {
    icon: "🎬",
    title: "Watch Together",
    sub: "Sync YouTube videos",
    screen: "Watch",
  },
  {
    icon: "🎮",
    title: "Mini Games",
    sub: "Play together remotely",
    screen: "Games",
  },
];

function MoreHomeScreen({ navigation }) {
  const colors = useThemeStore((state) => state.colors);
  const { logout } = useAuthStore();
  const moreStyles = createMoreStyles(colors);

  return (
    <View style={moreStyles.root}>
      <ScrollView contentContainerStyle={moreStyles.scroll}>
        <Text style={moreStyles.heading}>More</Text>
        {MORE_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={moreStyles.item}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.8}
          >
            <Text style={moreStyles.itemIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={moreStyles.itemTitle}>{item.title}</Text>
              <Text style={moreStyles.itemSub}>{item.sub}</Text>
            </View>
            <Text style={moreStyles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={moreStyles.logoutBtn} onPress={logout}>
          <Text style={moreStyles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createMoreStyles = (colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
    heading: {
      fontSize: 32,
      fontFamily: 'Manrope_800ExtraBold',
      color: colors.text,
      marginBottom: 32,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 16,
    },
    itemIcon: { fontSize: 28 },
    itemTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: colors.text },
    itemSub: { fontSize: 13, fontFamily: 'Manrope_400Regular', color: colors.textSub, marginTop: 4 },
    arrow: { color: colors.textMuted, fontSize: 24 },
    logoutBtn: {
      marginTop: 32,
      paddingVertical: 14,
      alignItems: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "rgba(255,180,171,0.3)", // Using error color
    },
    logoutText: { color: colors.error, fontSize: 16, fontFamily: 'Manrope_700Bold' },
  });

// ─── Root Navigator ──────────────────────────────────────────────────
export default function AppNavigator() {
  const mode = useThemeStore((state) => state.mode);
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
    dark: true, // Application is forced Dark for "The Ethereal Connection"
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
          // Auth Flow
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : !user.partnerId ? (
          // Needs to connect with partner
          <Stack.Screen name="Connect" component={ConnectScreen} />
        ) : (
          // Main App — tabs + feature screens all at root level
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
