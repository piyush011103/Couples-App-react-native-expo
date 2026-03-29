import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { FONTS, RADIUS, SIZES } from "../constants/theme";
import GlassCard from "../components/GlassCard";
import PrimaryButton from "../components/PrimaryButton";
import apiClient from "../api/apiClient";
import useThemeStore from "../store/useThemeStore";

const MemoryWallScreen = () => {
  const colors = useThemeStore((state) => state.colors);
  const styles = createStyles(colors);
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const renderMemory = ({ item, index }) => (
    <TouchableOpacity style={styles.memoryItem} activeOpacity={0.9}>
      <Image source={{ uri: item.imageUrl }} style={styles.memoryImage} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        style={styles.memoryOverlay}
        start={{ x: 0.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        locations={[0.0, 1.0]}
      >
        {item.caption ? (
          <Text style={styles.memoryCaption}>{item.caption}</Text>
        ) : null}
        <Text style={styles.memoryDate}>
          {new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Memory Wall</Text>
          <Text style={styles.sub}>{memories.length} shared moments</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : memories.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🖼️</Text>
          <Text style={styles.emptyTitle}>No memories yet</Text>
          <Text style={styles.emptySub}>Add your first shared photo</Text>
        </View>
      ) : (
        <FlatList
          data={memories}
          numColumns={2}
          renderItem={renderMemory}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Upload Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add a Memory</Text>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {pickedImage ? (
                <Image
                  source={{ uri: pickedImage }}
                  style={styles.previewImage}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderIcon}>📷</Text>
                  <Text style={styles.imagePlaceholderText}>
                    Tap to pick a photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption... (optional)"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <PrimaryButton
                title="Upload"
                onPress={handleUpload}
                loading={uploading}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    heading: {
      fontSize: SIZES.xxl,
      fontWeight: FONTS.bold,
      color: colors.text,
    },
    sub: { fontSize: SIZES.sm, color: colors.textSub, marginTop: 2 },
    addBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: RADIUS.full,
    },
    addBtnText: {
      color: "#FFF",
      fontWeight: FONTS.semibold,
      fontSize: SIZES.sm,
    },
    grid: { padding: 12, gap: 10 },
    memoryItem: {
      flex: 1,
      margin: 4,
      borderRadius: RADIUS.xl,
      overflow: "hidden",
      height: 180,
    },
    memoryImage: { width: "100%", height: "100%" },
    memoryOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 12,
      justifyContent: "flex-end",
    },
    memoryCaption: {
      color: "#FFF",
      fontSize: SIZES.sm,
      fontWeight: FONTS.medium,
    },
    memoryDate: { color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 2 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center" },
    emptyEmoji: { fontSize: 52, marginBottom: 16 },
    emptyTitle: {
      fontSize: SIZES.xl,
      fontWeight: FONTS.bold,
      color: colors.text,
    },
    emptySub: { fontSize: SIZES.base, color: colors.textSub, marginTop: 8 },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: RADIUS.xxxl ?? 32,
      borderTopRightRadius: RADIUS.xxxl ?? 32,
      padding: 28,
      paddingBottom: 36,
    },
    modalTitle: {
      fontSize: SIZES.xl,
      fontWeight: FONTS.bold,
      color: colors.text,
      marginBottom: 20,
    },
    imagePicker: {
      borderRadius: RADIUS.xl,
      overflow: "hidden",
      marginBottom: 16,
    },
    previewImage: { width: "100%", height: 200, borderRadius: RADIUS.xl },
    imagePlaceholder: {
      width: "100%",
      height: 160,
      backgroundColor: colors.surfaceLight,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
    },
    imagePlaceholderIcon: { fontSize: 36, marginBottom: 8 },
    imagePlaceholderText: { color: colors.textSub, fontSize: SIZES.sm },
    captionInput: {
      backgroundColor: colors.surfaceLight,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      fontSize: SIZES.base,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 20,
    },
    modalBtns: { flexDirection: "row", gap: 12 },
    cancelBtn: {
      flex: 1,
      paddingVertical: 15,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    cancelText: { color: colors.textSub, fontSize: SIZES.base },
  });

export default MemoryWallScreen;
