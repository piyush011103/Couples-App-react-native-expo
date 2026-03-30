import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeInDown,
} from "react-native-reanimated";
import { FONTS, RADIUS, SIZES } from "../constants/theme";
import apiClient from "../api/apiClient";
import useThemeStore from "../store/useThemeStore";

const { width } = Dimensions.get("window");

/**
 * Atmospheric Background Glow
 */
const AnimatedGlow = ({ color, style, duration = 8000 }) => {
  const transX = useSharedValue(0);
  const transY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    transX.value = withRepeat(withSequence(withTiming(30, { duration }), withTiming(-30, { duration })), -1, true);
    transY.value = withRepeat(withSequence(withTiming(-40, { duration: duration * 1.2 }), withTiming(40, { duration: duration * 1.2 })), -1, true);
    scale.value = withRepeat(withSequence(withTiming(1.2, { duration: duration * 1.5 }), withTiming(0.8, { duration: duration * 1.5 })), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: transX.value }, { translateY: transY.value }, { scale: scale.value }],
    opacity: 0.12,
  }));

  return (
    <Animated.View style={[styles.glowCircle, { backgroundColor: color }, style, animStyle]} />
  );
};

const MemoryWallScreen = () => {
  const { colors, mode } = useThemeStore();
  const insets = useSafeAreaInsets();
  
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [caption, setCaption] = useState("");
  const [pickedImage, setPickedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const res = await apiClient.get("/memories");
      setMemories(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPickedImage(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!pickedImage) {
      Alert.alert("Pick a photo first");
      return;
    }
    setUploading(true);
    try {
      // First upload image to get Cloudinary URL
      const formData = new FormData();
      formData.append("image", {
        uri: pickedImage,
        name: "memory.jpg",
        type: "image/jpeg",
      });
      const uploadRes = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Then save memory
      await apiClient.post("/memories", {
        imageUrl: uploadRes.data.imageUrl,
        caption,
      });
      setModalVisible(false);
      setCaption("");
      setPickedImage(null);
      fetchMemories();
    } catch (e) {
      Alert.alert("Upload failed", e.message);
    } finally {
      setUploading(false);
    }
  };

  const renderMemory = (item, index) => {
    // Editorial Asymmetry: Vary height and margins
    const isLarge = index % 3 === 0;
    const cardHeight = isLarge ? 280 : 200;
    
    return (
      <Animated.View 
        key={item._id || `memory-${index}`}
        entering={FadeInDown.delay(index * 100).springify().damping(15)}
        style={[styles.memoryItem, { height: cardHeight }]}
      >
        <TouchableOpacity 
          style={{ flex: 1 }} 
          activeOpacity={0.9}
          onPress={() => {/* Full view detail */}}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.memoryImage} />
          <BlurView 
            intensity={35} 
            tint={mode === 'dark' ? "dark" : "light"} 
            style={styles.cardOverlay}
          >
            <View style={styles.overlayContent}>
              {item.caption ? (
                <Text style={[styles.memoryCaption, { color: colors.text, fontFamily: 'Manrope_600SemiBold' }]} numberOfLines={2}>
                  {item.caption}
                </Text>
              ) : null}
              <Text style={[styles.memoryDate, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
                {new Date(item.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).toUpperCase()}
              </Text>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Editorial Depth */}
      <AnimatedGlow color={mode === 'dark' ? "#8A2BE2" : "#FF7E5F"} style={{ top: '15%', left: '-10%' }} />
      <AnimatedGlow color={mode === 'dark' ? "#FF4D8D" : "#FEB47B"} style={{ bottom: '15%', right: '-10%' }} duration={10000} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}
      >
        {/* Editorial Header */}
        <View style={styles.header}>
           <View style={{ flex: 1 }}>
              <Text style={[styles.editorialLabel, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_700Bold' }]}>
                SHARED MOMENTS ✦
              </Text>
              <Text style={[styles.heading, { color: colors.text, fontFamily: 'Manrope_800ExtraBold' }]}>
                Memory Wall
              </Text>
           </View>
           <TouchableOpacity 
             onPress={() => setModalVisible(true)}
             activeOpacity={0.8}
           >
             <LinearGradient
               colors={mode === 'dark' ? ['#8A2BE2', '#FF4D8D'] : ['#A53B22', '#FF7E5F']}
               style={styles.addBtnCircle}
               start={{ x: 0.0, y: 0.0 }}
               end={{ x: 1.0, y: 1.0 }}
             >
               <Ionicons name="add" size={28} color="#FFF" />
             </LinearGradient>
           </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : memories.length === 0 ? (
          <View style={styles.empty}>
             <Ionicons name="images-outline" size={64} color={colors.textMuted} style={{ marginBottom: 20 }} />
             <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Manrope_700Bold' }]}>
               Silent Sanctuary
             </Text>
             <Text style={[styles.emptySub, { color: colors.textSub, fontFamily: 'PlusJakartaSans_500Medium' }]}>
               Add your first captured moment together.
             </Text>
          </View>
        ) : (
          <View style={styles.editorialGrid}>
             <View style={styles.column}>
               {memories.filter((_, i) => i % 2 === 0).map((m, i) => renderMemory(m, i * 2))}
             </View>
             <View style={[styles.column, { paddingTop: 40 }]}>
               {memories.filter((_, i) => i % 2 !== 0).map((m, i) => renderMemory(m, (i * 2) + 1))}
             </View>
          </View>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <BlurView intensity={Platform.OS === 'ios' ? 70 : 100} tint="dark" style={styles.modalRoot}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <TouchableOpacity 
               style={styles.closeBtn} 
               onPress={() => setModalVisible(false)}
            >
               <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Manrope_800ExtraBold' }]}>
              Capture a Memory
            </Text>

            <TouchableOpacity 
              style={[styles.imagePicker, { backgroundColor: colors.surfaceContainer }]} 
              onPress={pickImage}
              activeOpacity={0.8}
            >
              {pickedImage ? (
                <Image source={{ uri: pickedImage }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={42} color={colors.primary} />
                  <Text style={[styles.imagePlaceholderText, { color: colors.textMuted, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
                    SELECT FROM ARCHIVE
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={[styles.captionBox, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <TextInput
                style={[styles.captionInput, { color: colors.text, fontFamily: 'Manrope_400Regular' }]}
                value={caption}
                onChangeText={setCaption}
                placeholder="Describe this moment..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>

            <TouchableOpacity 
              onPress={handleUpload}
              disabled={uploading}
              activeOpacity={0.8}
            >
              <LinearGradient
                 colors={mode === 'dark' ? ['#8A2BE2', '#FF4D8D'] : ['#A53B22', '#FF7E5F']}
                 style={styles.uploadBtn}
                 start={{ x: 0.0, y: 0.0 }}
                 end={{ x: 1.0, y: 1.0 }}
              >
                {uploading ? <ActivityIndicator color="#FFF" /> : (
                  <Text style={[styles.uploadText, { fontFamily: 'PlusJakartaSans_700Bold' }]}>
                    PUBLISH TO WALL
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    filter: Platform.OS === 'ios' ? 'blur(100px)' : undefined,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  editorialLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  heading: { fontSize: 32, letterSpacing: -1 },
  addBtnCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingArea: { height: 200, justifyContent: 'center' },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 },
  emptyTitle: { fontSize: 22, marginTop: 4 },
  emptySub: { fontSize: 14, textAlign: 'center', opacity: 0.6, marginTop: 8 },

  editorialGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 12,
  },
  column: { flex: 1, gap: 12 },
  memoryItem: {
    borderRadius: 28,
    overflow: "hidden",
  },
  memoryImage: { 
    ...StyleSheet.absoluteFillObject,
    width: "100%", 
    height: "100%",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  overlayContent: {
    padding: 16,
  },
  memoryCaption: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  memoryDate: { fontSize: 8, letterSpacing: 1, opacity: 0.8 },

  modalRoot: { flex: 1, justifyContent: 'center', padding: 24 },
  modalContent: {
    backgroundColor: 'transparent',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    padding: 8,
  },
  modalTitle: { fontSize: 28, letterSpacing: -0.5, marginBottom: 24 },
  imagePicker: {
    borderRadius: 32,
    height: 240,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { fontSize: 10, letterSpacing: 1.5, marginTop: 12 },
  
  captionBox: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    minHeight: 100,
  },
  captionInput: { fontSize: 16, lineHeight: 22 },
  
  uploadBtn: {
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: { color: '#FFF', fontSize: 12, letterSpacing: 2 },
});

export default MemoryWallScreen;
