import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../store/useThemeStore';

const { width } = Dimensions.get('window');

const EtherealToast = ({
    visible,
    message,
    type = 'success',
    duration = 3000,
    onDismiss
}) => {
    const { colors, mode } = useThemeStore();
    const [isRendered, setIsRendered] = useState(false);
    const translateY = useRef(new Animated.Value(100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const isDark = mode === 'dark';
    const hideTimerRef = useRef(null);

    useEffect(() => {
        if (visible) {
            setIsRendered(true);
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 90,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 50,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => {
                hideToast();
            }, duration);
        } else {
            // If parent forces hidden while we are showing
            hideToast();
        }

        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            translateY.stopAnimation();
            opacity.stopAnimation();
        };
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setIsRendered(false);
            onDismiss?.();
        });
    };

    if (!isRendered && !visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            case 'info': return 'information-circle';
            default: return 'notifications';
        }
    };

    const getTypeColor = () => {
        switch (type) {
            case 'success': return '#2ECC71';
            case 'error': return colors.accent;
            case 'info': return colors.primary;
            default: return colors.text;
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                }
            ]}
        >
            {isDark ? (
                <View
                    style={[
                        styles.blurContainer,
                        {
                            borderColor: 'rgba(255,255,255,0.08)',
                            backgroundColor: colors.surfaceContainerHigh,
                        }
                    ]}
                >
                    <View style={styles.content}>
                        <View style={[styles.iconWrapper, { backgroundColor: `${getTypeColor()}20` }]}>
                            <Ionicons name={getIcon()} size={20} color={getTypeColor()} />
                        </View>
                        <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
                            {message}
                        </Text>
                    </View>
                </View>
            ) : (
                <BlurView
                    intensity={90}
                    tint="light"
                    style={[
                        styles.blurContainer,
                        {
                            borderColor: 'rgba(0,0,0,0.08)',
                            backgroundColor: 'rgba(255, 255, 255, 1)'
                        }
                    ]}
                >
                    <View style={styles.content}>
                        <View style={[styles.iconWrapper, { backgroundColor: `${getTypeColor()}20` }]}>
                            <Ionicons name={getIcon()} size={20} color={getTypeColor()} />
                        </View>
                        <Text style={[styles.message, { color: '#222' }]} numberOfLines={2}>
                            {message}
                        </Text>
                    </View>
                </BlurView>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: 'center',
    },
    blurContainer: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 18,
        borderWidth: 1,
        overflow: 'hidden', // Ensures corners are properly clipped
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'PlusJakartaSans-Medium',
    },
});

export default EtherealToast;
