import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FONTS, RADIUS, SIZES, SHADOWS, GRADIENTS } from "../constants/theme";
import useAuthStore from "../store/useAuthStore";
import useThemeStore from "../store/useThemeStore";
import apiClient from "../api/apiClient";
import GlassCard from "../components/GlassCard";

const { width } = Dimensions.get("window");

const MORE_ITEMS = [
  { icon: "heart", title: "Daily Check-In", sub: "SYNC EMOTIONS", screen: "CheckIn", color: "#DCB8FF" },
  { icon: "time", title: "Countdown", sub: "SYNC MOMENTS", screen: "Countdown", color: "#FFB1C4" },
  { icon: "game-controller", title: "Mini Games", sub: "SYNC RHYTHM", screen: "Games", color: "#00E676" },
  { icon: "play-circle", title: "Watch Together", sub: "SYNC VISION", screen: "Watch", color: "#FF4D8D" },
];

const MoreScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { colors, mode } = useThemeStore();
  const [partnerName, setPartnerName] = useState("Partner");

  useEffect(() => {
    apiClient.get("/auth/partner")
      .then((res) => setPartnerName(res.data?.name || "Partner"))
      .catch(() => {});
  }, []);

  const styles = createStyles(colors, mode);

  return (
    <View style={styles.root}>
      {/* Editorial Background Glow */}
      <View style={[styles.glow, { backgroundColor: mode === 'dark' ? "rgba(138, 43, 226, 0.04)" : "rgba(165, 59, 34, 0.05)" }]} />
      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Editorial Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.eyebrow}>COOPERATIVE PORTAL</Text>
          <Text style={styles.heading}>More{"\n"}Editorial</Text>
          <Text style={styles.sub}>Administrative control and synchronized feature access.</Text>
        </Animated.View>

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <GlassCard style={styles.profileCard}>
            <View style={styles.syncRow}>
              {/* User Block */}
              <View style={styles.personBlock}>
                <View style={[styles.avatarCircle, { borderColor: colors.primary }]}>
                  <Text style={[styles.avatarInitial, { color: colors.primary }]}>{user?.name?.[0]?.toUpperCase()}</Text>
                </View>
                <Text style={styles.personName}>{user?.name}</Text>
                <Text style={styles.userLabel}>YOU</Text>
              </View>

              {/* Connector */}
              <View style={styles.connectorContainer}>
                 <View style={[styles.connectorLine, { backgroundColor: colors.border }]} />
                 <View style={styles.infinityWrapper}>
                   <Ionicons name="infinite" size={24} color={colors.textMuted} />
                 </View>
                 <View style={[styles.connectorLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Partner Block */}
              <View style={styles.personBlock}>
                <View style={[styles.avatarCircle, { borderColor: colors.secondary }]}>
                  <Text style={[styles.avatarInitial, { color: colors.secondary }]}>{partnerName?.[0]?.toUpperCase()}</Text>
                </View>
                <Text style={styles.personName}>{partnerName}</Text>
                <Text style={styles.userLabel}>PARTNER</Text>
              </View>
            </View>
            
            <View style={styles.statusBadge}>
               <View style={[styles.onlineDot, { backgroundColor: colors.online }]} />
               <Text style={styles.statusText}>Connection Validated</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Menu Grid */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>FEATURE SYNC</Text>
          <View style={styles.grid}>
            {MORE_ITEMS.map((item, index) => (
              <Animated.View key={item.screen} entering={FadeInDown.delay(400 + index * 100).duration(600)}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={mode === 'dark' ? ['transparent', 'transparent'] : ['#FFFFFF', '#F8F3E9']}
                    style={styles.itemGradient}
                  >
                    <BlurView intensity={mode === 'dark' ? 30 : 0} tint={mode === 'dark' ? "dark" : "light"} style={styles.itemBlur}>
                      <View style={[styles.iconWrapper, { backgroundColor: mode === 'dark' ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }]}>
                         <Ionicons name={item.icon} size={28} color={item.color} />
                      </View>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={[styles.itemSub, { color: colors.textMuted }]}>{item.sub}</Text>
                    </BlurView>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Account Actions */}
        <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.actionSection}>
          <TouchableOpacity style={styles.settingsItem}>
             <Ionicons name="settings-outline" size={20} color={colors.textSub} />
             <Text style={styles.settingsText}>Connection Settings</Text>
             <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>TERMINATE SESSION</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors, mode) => {
  const isDark = mode === 'dark';
  
  const lightShadow = {
    shadowColor: "#8B716B",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  };

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    glow: {
      position: "absolute", width: width * 1.2, height: width * 1.2, borderRadius: width * 0.6,
      top: -width * 0.5, left: -width * 0.3,
    },
    scroll: { paddingHorizontal: 28, paddingTop: 80, paddingBottom: 100 },
    header: { marginBottom: 44 },
    eyebrow: { fontFamily: FONTS.label, fontSize: 10, color: colors.primary, letterSpacing: 3, marginBottom: 12 },
    heading: { fontFamily: FONTS.display, fontSize: SIZES.display * 0.75, color: colors.text, lineHeight: SIZES.display * 0.75, marginBottom: 16 },
    sub: { fontFamily: FONTS.body, fontSize: SIZES.md, color: colors.textSub, width: "85%", lineHeight: 24, opacity: 0.8 },
    
    profileCard: { padding: 24, marginBottom: 40 },
    syncRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
    personBlock: { alignItems: 'center', flex: 1 },
    avatarCircle: { width: 68, height: 68, borderRadius: 34, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerLow, marginBottom: 12 },
    avatarInitial: { fontFamily: FONTS.display, fontSize: 24 },
    personName: { fontFamily: FONTS.headline, fontSize: SIZES.lg, color: colors.text, textAlign: 'center' },
    userLabel: { fontFamily: FONTS.label, fontSize: 9, color: colors.textMuted, letterSpacing: 2, marginTop: 4 },
    
    connectorContainer: { flexDirection: 'row', alignItems: 'center', width: 60, justifyContent: 'center' },
    connectorLine: { width: 12, height: 1 },
    infinityWrapper: { marginHorizontal: 4, opacity: 0.5 },
    
    statusBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: isDark ? 'rgba(0,230,118,0.06)' : 'rgba(0,230,118,0.1)' },
    onlineDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
    statusText: { fontFamily: FONTS.label, fontSize: 10, color: colors.textSub, letterSpacing: 0.5 },
    
    menuSection: { marginBottom: 40 },
    sectionLabel: { fontFamily: FONTS.label, fontSize: 10, color: colors.textMuted, letterSpacing: 2, marginBottom: 24 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    menuItem: { 
      width: (width - 56 - 16) / 2, 
      borderRadius: RADIUS.xl, 
      overflow: 'hidden', 
      ...(isDark ? SHADOWS.ambient : lightShadow) 
    },
    itemGradient: { flex: 1 },
    itemBlur: { padding: 20, borderColor: isDark ? colors.borderLight : colors.border },
    iconWrapper: { width: 52, height: 52, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    itemTitle: { fontFamily: FONTS.headline, fontSize: SIZES.base, color: colors.text, marginBottom: 4 },
    itemSub: { fontFamily: FONTS.label, fontSize: 8, letterSpacing: 1 },
    
    actionSection: { gap: 16 },
    settingsItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 4 },
    settingsText: { flex: 1, fontFamily: FONTS.body, fontSize: SIZES.base, color: colors.text, marginLeft: 16 },
    
    logoutBtn: { marginTop: 12, paddingVertical: 18, alignItems: "center", borderRadius: RADIUS.full, borderWidth: 1.2, borderColor: "rgba(255,180,171,0.2)" },
    logoutText: { fontFamily: FONTS.label, color: colors.error, fontSize: 10, letterSpacing: 2 },
  });
};

export default MoreScreen;
