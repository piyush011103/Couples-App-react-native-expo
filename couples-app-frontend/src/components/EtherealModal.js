import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Pressable,
    Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../store/useThemeStore';

const { width, height } = Dimensions.get('window');

const EtherealModal = ({
    visible,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    type = 'default' // 'default' or 'danger'
}) => {
    const { colors, mode } = useThemeStore();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const isDark = mode === 'dark';

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        }

        return () => {
            fadeAnim.stopAnimation();
            scaleAnim.stopAnimation();
        };
    }, [visible]);

    if (!visible && fadeAnim._value === 0) return null;

    const accentColor = type === 'danger' ? colors.accent : colors.primary;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onCancel}>
                    <Animated.View
                        style={[
                            styles.backdrop,
                            { opacity: fadeAnim, backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }
                        ]}
                    />
                </Pressable>

                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        }
                    ]}
                >
                    <BlurView
                        intensity={isDark ? 80 : 100}
                        tint={isDark ? 'dark' : 'light'}
                        style={[
                            styles.blurContainer,
                            {
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                backgroundColor: isDark ? 'transparent' : 'rgba(255, 255, 255, 1)'
                            }
                        ]}
                    >
                        <View style={styles.content}>
                            <View style={[styles.iconWrapper, { backgroundColor: `${accentColor}15` }]}>
                                <Ionicons
                                    name={type === 'danger' ? "alert-circle-outline" : "information-circle-outline"}
                                    size={32}
                                    color={accentColor}
                                />
                            </View>

                            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                            <Text style={[styles.message, { color: isDark ? colors.textMuted : '#444' }]}>{message}</Text>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    onPress={onCancel}
                                    style={[styles.button, styles.cancelButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                                >
                                    <Text style={[styles.buttonText, { color: colors.textMuted }]}>{cancelText}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={onConfirm}
                                    style={[styles.button, styles.confirmButton, { backgroundColor: accentColor }]}
                                >
                                    <Text style={[styles.buttonText, { color: '#FFF' }]}>{confirmText}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </BlurView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        flex: 1,
    },
    modalContainer: {
        width: width * 0.85,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    blurContainer: {
        borderRadius: 24,
        borderWidth: 1,
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
        fontFamily: 'PlusJakartaSans-Regular',
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        marginRight: 12,
    },
    confirmButton: {
        // Background set dynamically
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'PlusJakartaSans-Bold',
    },
});

export default EtherealModal;
