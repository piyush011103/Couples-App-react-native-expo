import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    SafeAreaView, 
    Dimensions,
    StatusBar,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import DrawingCanvas from '../components/DrawingCanvas';
import EtherealModal from '../components/EtherealModal';
import EtherealToast from '../components/EtherealToast';
import useAuthStore from '../store/useAuthStore';
import useSocketStore from '../store/useSocketStore';
import useThemeStore from '../store/useThemeStore';

const COLORS = [
    '#FF4D8D', // Pink
    '#FF9F43', // Orange
    '#FEE140', // Yellow
    '#2ECC71', // Green
    '#3498DB', // Blue
    '#9B59B6', // Purple
    '#FFFFFF', // White
    '#000000', // Black
];

const STROKE_WIDTHS = [2, 5, 10, 15];

const CanvasScreen = ({ navigation }) => {
    const { colors, mode } = useThemeStore();
    const { user } = useAuthStore();
    const { 
        socket, 
        emitDrawStart, 
        emitDrawMove, 
        emitDrawEnd, 
        emitDrawUndo, 
        emitDrawClear, 
        getCanvasState,
        setDrawingCallbacks 
    } = useSocketStore();

    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [selectedWidth, setSelectedWidth] = useState(5);
    const [history, setHistory] = useState([]);
    const [activePartnerStrokes, setActivePartnerStrokes] = useState({}); // { strokeId: { points, color, width } }
    
    // UI State
    const [showClearModal, setShowClearModal] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const viewShotRef = useRef(null);
    const drawingRef = useRef(null);

    const insets = useSafeAreaInsets();
    const isDark = mode === 'dark';
    const partnerId = user?.partnerId;

    // --- Socket Callbacks ---
    const onDrawStart = useCallback((data) => {
        setActivePartnerStrokes(prev => ({
            ...prev,
            [data.strokeId]: {
                id: data.strokeId,
                userId: partnerId,
                color: data.color,
                strokeWidth: data.width,
                points: [data.point]
            }
        }));
    }, [partnerId]);

    const onDrawMove = useCallback((data) => {
        setActivePartnerStrokes(prev => {
            const stroke = prev[data.strokeId];
            if (!stroke) return prev;
            return {
                ...prev,
                [data.strokeId]: {
                    ...stroke,
                    points: [...stroke.points, data.point]
                }
            };
        });
    }, []);

    const onDrawEnd = useCallback((data) => {
        setActivePartnerStrokes(prev => {
            const finishedStroke = prev[data.strokeId];
            if (finishedStroke) {
                setHistory(h => [...h, finishedStroke]);
                const newState = { ...prev };
                delete newState[data.strokeId];
                return newState;
            }
            return prev;
        });
    }, []);

    const onDrawUndo = useCallback(() => {
        setHistory(prev => {
            // Remove last stroke by partner
            const lastPartnerStrokeIndex = [...prev].reverse().findIndex(s => s.userId === partnerId);
            if (lastPartnerStrokeIndex === -1) return prev;
            const actualIndex = prev.length - 1 - lastPartnerStrokeIndex;
            return prev.filter((_, i) => i !== actualIndex);
        });
    }, [partnerId]);

    const onDrawClear = useCallback(() => {
        setHistory([]);
        setActivePartnerStrokes({});
    }, []);

    const onCanvasStateReceived = useCallback((state) => {
        setHistory(state);
    }, []);

    useEffect(() => {
        if (socket && partnerId) {
            setDrawingCallbacks({
                onDrawStart,
                onDrawMove,
                onDrawEnd,
                onDrawUndo,
                onDrawClear,
                onCanvasStateReceived
            });

            // Initial fetch of canvas state
            getCanvasState({ senderId: user._id, receiverId: partnerId });
        }
    }, [socket, partnerId, user._id, onDrawStart, onDrawMove, onDrawEnd, onDrawUndo, onDrawClear, onCanvasStateReceived]);

    // --- Actions ---
    const handleUndo = () => {
        // Local undo (my last stroke)
        const myLastStrokeIndex = [...history].reverse().findIndex(s => s.userId === user._id);
        if (myLastStrokeIndex !== -1) {
            const actualIndex = history.length - 1 - myLastStrokeIndex;
            setHistory(prev => prev.filter((_, i) => i !== actualIndex));
            drawingRef.current?.undo();
            emitDrawUndo({ senderId: user._id, receiverId: partnerId });
        }
    };

    const handleClear = () => {
        setShowClearModal(true);
    };

    const confirmClear = () => {
        setHistory([]);
        setActivePartnerStrokes({});
        drawingRef.current?.clear();
        emitDrawClear({ senderId: user._id, receiverId: partnerId });
        setShowClearModal(false);
        showToast("Canvas cleared ✨", "info");
    };

    const handleStrokeEnd = (stroke) => {
        setHistory(prev => [...prev, stroke]);
        emitDrawEnd({ 
            senderId: user._id, 
            receiverId: partnerId, 
            stroke 
        });
    };

    const handleDownload = async () => {
        try {
            // In SDK 50+, using writeOnly saves us from requesting broad media permissions (like AUDIO)
            const { status } = await MediaLibrary.requestPermissionsAsync(true);
            
            if (status !== 'granted') {
                const { status: retryStatus } = await MediaLibrary.requestPermissionsAsync();
                if (retryStatus !== 'granted') {
                    showToast("Permission denied. We can't save the image.", "error");
                    return;
                }
            }

            const uri = await viewShotRef.current.capture();
            await MediaLibrary.saveToLibraryAsync(uri);
            showToast("Drawing saved to gallery! ✨", "success");
        } catch (error) {
            console.error("Download error:", error);
            showToast("Failed to save drawing.", "error");
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            
            {/* Action Bar (Top) */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.headerBlur}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>Shared Canvas</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={handleUndo} style={styles.actionIcon}>
                            <Ionicons name="arrow-undo-outline" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDownload} style={styles.actionIcon}>
                            <Ionicons name="download-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleClear} style={[styles.actionIcon, { marginLeft: 10 }]}>
                            <Ionicons name="trash-outline" size={24} color={colors.accent} />
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </View>

            {/* Canvas Area */}
            <ViewShot 
                ref={viewShotRef} 
                options={{ format: 'png', quality: 1.0 }} 
                style={[styles.canvasWrapper, { marginTop: insets.top + 60, backgroundColor: colors.background }]}
            >
                <DrawingCanvas
                    ref={drawingRef}
                    isActive={true}
                    color={selectedColor}
                    strokeWidth={selectedWidth}
                    userId={user._id}
                    receiverId={partnerId}
                    onDrawStart={(data) => emitDrawStart({ ...data, senderId: user._id, receiverId: partnerId })}
                    onDrawMove={(data) => emitDrawMove({ ...data, senderId: user._id, receiverId: partnerId })}
                    onDrawEnd={handleStrokeEnd}
                    externalStrokes={history}
                    activeExternalStrokes={activePartnerStrokes}
                />
            </ViewShot>

            {/* Toolbar (Bottom) */}
            <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.toolbar}>
                <View style={styles.toolbarContent}>
                    {/* Color Picker */}
                    <View style={styles.colorPicker}>
                        {COLORS.map((c) => (
                            <TouchableOpacity
                                key={c}
                                onPress={() => setSelectedColor(c)}
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: c },
                                    selectedColor === c && styles.activeColorBorder
                                ]}
                            />
                        ))}
                    </View>
                    
                    {/* Width Picker */}
                    <View style={styles.widthPicker}>
                        {STROKE_WIDTHS.map((w) => (
                            <TouchableOpacity
                                key={w}
                                onPress={() => setSelectedWidth(w)}
                                style={[
                                    styles.widthCircle,
                                    { width: 14 + w/2, height: 14 + w/2, borderRadius: (14 + w/2) / 2, backgroundColor: selectedWidth === w ? colors.primary : colors.textMuted }
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </BlurView>

            {/* Premium UI Components */}
            <EtherealModal 
                visible={showClearModal}
                type="danger"
                title="Clear Canvas"
                message="This will clear the drawing for both you and your partner. This cannot be undone."
                confirmText="Clear All"
                onConfirm={confirmClear}
                onCancel={() => setShowClearModal(false)}
            />

            <EtherealToast 
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    headerBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'PlusJakartaSans-Bold',
    },
    headerActions: {
        flexDirection: 'row',
    },
    actionIcon: {
        marginLeft: 15,
        padding: 5,
    },
    canvasWrapper: {
        flex: 1,
        marginTop: 100, // Roughly below header
    },
    toolbar: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        borderRadius: 30,
        overflow: 'hidden',
        paddingVertical: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    toolbarContent: {
        alignItems: 'center',
    },
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    colorCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginHorizontal: 8,
        marginVertical: 4,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    activeColorBorder: {
        borderColor: '#FFF',
        transform: [{ scale: 1.25 }],
    },
    widthPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    widthCircle: {
        marginHorizontal: 15,
    },
});

export default CanvasScreen;
