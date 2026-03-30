import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeInDown,
  SlideInLeft,
  SlideInRight,
} from "react-native-reanimated";
import { RADIUS, SIZES } from "../constants/theme";
import useAuthStore from "../store/useAuthStore";
import useSocketStore from "../store/useSocketStore";
import useThemeStore from "../store/useThemeStore";
import apiClient from "../api/apiClient";

const { width } = Dimensions.get("window");

const TypingDot = ({ style }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animStyle]} />;
};

const MessageBubble = ({ item, isSelf, colors, mode }) => {
  const time = new Date(item.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Animated.View
      entering={isSelf ? SlideInRight.duration(280).springify() : SlideInLeft.duration(280).springify()}
      style={isSelf ? styles.selfRow : styles.partnerRow}
    >
      <View style={isSelf ? styles.bubbleWrapperSelf : styles.bubbleWrapperPartner}>
        {isSelf ? (
          <LinearGradient
            colors={mode === 'dark' ? ['#8A2BE2', '#FF4D8D'] : ['#A53B22', '#FF7E5F']}
            start={{ x: 0.0, y: 0.0 }}
            end={{ x: 1.0, y: 1.0 }}
            locations={[0.0, 1.0]}
            style={[styles.bubble, styles.selfBubble]}
          >
            <Text style={[styles.bubbleText, { color: mode === 'dark' ? "#E3E0F1" : "#FEF9EF", fontFamily: 'Manrope_400Regular' }]}>
              {item.text}
            </Text>
            <Text style={[styles.bubbleTime, { color: mode === 'dark' ? 'rgba(227, 224, 241, 0.5)' : 'rgba(254, 249, 239, 0.6)', fontFamily: 'PlusJakartaSans_500Medium' }]}>
              {time}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.partnerBubble, { backgroundColor: mode === 'dark' ? 'rgba(52, 52, 64, 0.4)' : colors.surfaceContainerHigh }]}>
            <Text style={[styles.bubbleText, { color: colors.text, fontFamily: 'Manrope_400Regular' }]}>
              {item.text}
            </Text>
            <Text style={[styles.bubbleTime, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_500Medium' }]}>
              {time}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const ChatScreen = () => {
  const { user } = useAuthStore();
  const socket = useSocketStore((state) => state.socket);
  const typingFromPartner = useSocketStore((state) => state.typingFromPartner);
  const { colors, mode } = useThemeStore();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [partnerName, setPartnerName] = useState("Your Partner");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeout = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const roomId = user?.partnerId
    ? [user._id, user.partnerId].sort().join("_")
    : null;

  useEffect(() => {
    fetchMessages();
    apiClient
      .get("/auth/partner")
      .then((r) => setPartnerName(r.data?.name || "Your Partner"))
      .catch(() => { });
    if (socket && roomId) socket.emit("join chat", roomId);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (newMsg) => {
      const isForMe = newMsg.receiver === user._id || newMsg.receiver?._id === user._id;
      if (isForMe) setMessages((prev) => [...prev, newMsg]);
    };
    socket.on("message received", handleNewMessage);
    return () => socket.off("message received", handleNewMessage);
  }, [socket]);

  const fetchMessages = async () => {
    if (!user?.partnerId) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/messages/${user.partnerId}`);
      setMessages(res.data || []);
    } catch (e) {
      console.error("Failed to fetch messages", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (val) => {
    setText(val);
    if (socket && roomId) {
      socket.emit("typing", roomId);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => socket.emit("stop typing", roomId), 1500);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || !socket) return;
    const msgPayload = {
      sender: user._id,
      receiver: user.partnerId,
      text: text.trim(),
      type: "text",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msgPayload]);
    setText("");
    socket.emit("new message", msgPayload);
    try {
      await apiClient.post("/messages", {
        receiver: user.partnerId,
        text: msgPayload.text,
        type: "text",
      });
    } catch (e) { /* Optimistic UI */ }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={mode === 'dark' 
          ? ['rgba(138, 43, 226, 0.12)', 'rgba(255, 77, 141, 0.08)', 'rgba(18, 18, 29, 0)']
          : ['rgba(165, 59, 34, 0.08)', 'rgba(255, 126, 95, 0.05)', 'rgba(254, 249, 239, 0)']}
        style={styles.bgGlow}
        start={{ x: 0.0, y: 0.0 }}
        end={{ x: 1.0, y: 1.0 }}
        locations={[0.0, 0.5, 1.0]}
      />

      {/* Editorial Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.avatarWrap}>
          <LinearGradient
            colors={mode === 'dark' ? ['#8A2BE2', '#FF4D8D'] : ['#A53B22', '#FF7E5F']}
            style={styles.avatar}
            start={{ x: 0.0, y: 0.0 }}
            end={{ x: 1.0, y: 1.0 }}
            locations={[0.0, 1.0]}
          >
            <Text style={[styles.avatarText, { fontFamily: 'Manrope_800ExtraBold' }]}>
              {partnerName[0]?.toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={[styles.onlineDot, { backgroundColor: socket?.connected ? colors.online : colors.offline, borderColor: colors.background }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.partnerNameText, { color: colors.text, fontFamily: 'Manrope_800ExtraBold' }]}>
            {partnerName}
          </Text>
          <Text style={[styles.statusText, { color: socket?.connected ? colors.online : colors.textMuted, fontFamily: 'PlusJakartaSans_500Medium' }]}>
            {typingFromPartner ? "pulsing..." : (socket?.connected ? "SANCTUARY ONLINE" : "CONNECTING")}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreAction}>
          <Text style={[styles.moreIconText, { color: colors.textMuted }]}>✦</Text>
        </TouchableOpacity>
      </View>

      {/* <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      > */}
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.loadingArea}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <View
              style={{
                flex: 1,
                transform: [
                  {
                    translateY: isKeyboardVisible
                      ? -Math.max(0, keyboardHeight  + insets.bottom)
                      : 0,
                  },
                ],
              }}
            >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={({ item }) => (
                <MessageBubble
                  item={item}
                  isSelf={item.sender === user._id || item.sender?._id === user._id}
                  colors={colors}
                  mode={mode}
                />
              )}
              keyExtractor={(item, i) => item._id || `msg-${i}`}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 20,
                  paddingBottom: 0, // 👈 remove extra space
                  flexGrow: 1,
                }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptySanctuary}>
                  <Text style={styles.emptyIcon}>💜</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Manrope_700Bold' }]}>
                    Silent Sanctuary
                  </Text>
                  <Text style={[styles.emptySub, { color: colors.textSub, fontFamily: 'Manrope_400Regular' }]}>
                    Start a digital conversation in your private space.
                  </Text>
                </View>
              }
            />
            </View>
          )}

          {typingFromPartner && (
            <View style={styles.typingContainer}>
              <BlurView intensity={25} tint={mode === 'dark' ? "dark" : "light"} style={styles.typingIndicator}>
                <View style={styles.dotsRow}>
                  <TypingDot style={[styles.dot, { backgroundColor: colors.secondary || '#FFB1C4' }]} />
                  <TypingDot style={[styles.dot, { backgroundColor: colors.secondary || '#FFB1C4' }]} />
                  <TypingDot style={[styles.dot, { backgroundColor: colors.secondary || '#FFB1C4' }]} />
                </View>
              </BlurView>
            </View>
          )}

        <View
          style={[
            styles.inputDockContainer,
            {
              paddingBottom: isKeyboardVisible ? 8 : insets.bottom + 8,

              // 👇 ADD THIS
              transform: [
                {
                  translateY: isKeyboardVisible
                    ? -Math.max(0, keyboardHeight + insets.bottom)
                    : 0,
                },
              ],
            },
          ]}
        >
              <BlurView intensity={45} tint={mode === 'dark' ? "dark" : "light"} style={[styles.inputDock, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.inputField, { color: colors.text, fontFamily: 'Manrope_400Regular' }]}
                  value={text}
                  onChangeText={handleTextChange}
                  placeholder="Pulse a thought..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!text.trim()}
                  activeOpacity={0.8}
                  style={styles.sendAction}
                >
                  <LinearGradient
                    colors={text.trim() ? (mode === 'dark' ? ['#8A2BE2', '#FF4D8D'] : ['#A53B22', '#FF7E5F']) : (mode === 'dark' ? ['#343440', '#343440'] : ['#E7E2D8', '#E7E2D8'])}
                    style={styles.sendBtn}
                    start={{ x: 0.0, y: 0.0 }}
                    end={{ x: 1.0, y: 1.0 }}
                    locations={[0.0, 1.0]}
                  >
                  <Text style={styles.sendIcon}>✦</Text>
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </View>
        </View>
      {/* </KeyboardAvoidingView> */}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  bgGlow: { ...StyleSheet.absoluteFillObject },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 20,
    paddingHorizontal: 24,
    gap: 16,
    zIndex: 10,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFF", fontSize: 18 },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  partnerNameText: { fontSize: 20, letterSpacing: -0.5 },
  statusText: { fontSize: 10, letterSpacing: 1.5, marginTop: 2 },
  moreAction: { padding: 8 },
  moreIconText: { fontSize: 20 },

  loadingArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  messageList: { paddingHorizontal: 20, flexGrow: 1 },
  emptySanctuary: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 20, opacity: 0.8 },
  emptyTitle: { fontSize: 24, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 15, textAlign: "center", opacity: 0.6, lineHeight: 22 },

  selfRow: { alignItems: "flex-end", marginBottom: 12 },
  partnerRow: { alignItems: "flex-start", marginBottom: 12 },
  bubbleWrapperSelf: { maxWidth: width * 0.75 },
  bubbleWrapperPartner: { maxWidth: width * 0.75 },
  bubble: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  selfBubble: {
    borderBottomRightRadius: 4,
  },
  partnerBubble: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTime: { fontSize: 9, marginTop: 4, opacity: 0.5, textAlign: "right" },

  typingContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  dotsRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },

  inputDockContainer: {
    paddingHorizontal: 20,
    // paddingBottom: 12,
  },
  inputDock: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    minHeight: 56,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  sendAction: {
    paddingBottom: 2,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: { color: "#FFF", fontSize: 18, fontWeight: '800' },
});

export default ChatScreen;
