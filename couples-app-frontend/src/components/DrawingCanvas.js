import React, { useRef, useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const THROTTLE_MS = 16; // ~60fps target

const DrawingCanvas = forwardRef(({ 
    isActive, 
    color, 
    strokeWidth, 
    userId, 
    receiverId, 
    onDrawStart, 
    onDrawMove, 
    onDrawEnd,
    externalStrokes = [],
    activeExternalStrokes = {}
}, ref) => {
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [localStrokes, setLocalStrokes] = useState([]);
    const [activeStrokeId, setActiveStrokeId] = useState(null);
    
    const currentStrokeRef = useRef(null);
    const lastEmitRef = useRef(0);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        undo: () => {
            setLocalStrokes(prev => prev.slice(0, -1));
        },
        clear: () => {
            setLocalStrokes([]);
        }
    }));

    // Normalize point: { x: 0-1, y: 0-1 }
    const normalize = useCallback((x, y) => ({
        x: x / canvasSize.width,
        y: y / canvasSize.height
    }), [canvasSize]);

    // Denormalize point: { x: pixels, y: pixels }
    const denormalize = useCallback((nx, ny) => ({
        x: nx * canvasSize.width,
        y: ny * canvasSize.height
    }), [canvasSize]);

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => isActive,
        onMoveShouldSetPanResponder: () => isActive,
        onPanResponderGrant: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;
            const strokeId = `${userId}-${Date.now()}`;
            const point = normalize(locationX, locationY);
            
            const newStroke = {
                id: strokeId,
                userId,
                color,
                strokeWidth,
                points: [point]
            };

            currentStrokeRef.current = newStroke;
            setActiveStrokeId(strokeId);
            setLocalStrokes(prev => [...prev, newStroke]);
            
            onDrawStart?.({
                strokeId,
                color,
                width: strokeWidth,
                point
            });
        },
        onPanResponderMove: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;
            const now = Date.now();
            
            // UI Update (Fast)
            const point = normalize(locationX, locationY);
            const stroke = currentStrokeRef.current;
            if (stroke) {
                stroke.points.push(point);
                // Capture a snapshot — the ref can become null inside async updaters
                const snapshot = { ...stroke, points: [...stroke.points] };
                // Trigger re-render for local visual feedback
                setLocalStrokes(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.id === snapshot.id) {
                        return [...prev.slice(0, -1), snapshot];
                    }
                    return prev;
                });

                // Network Emit (Throttled)
                if (now - lastEmitRef.current > THROTTLE_MS) {
                    onDrawMove?.({
                        strokeId: stroke.id,
                        point
                    });
                    lastEmitRef.current = now;
                }
            }
        },
        onPanResponderRelease: () => {
            if (currentStrokeRef.current) {
                onDrawEnd?.(currentStrokeRef.current);
                currentStrokeRef.current = null;
                setActiveStrokeId(null);
            }
        }
    }), [isActive, color, strokeWidth, userId, canvasSize, normalize]);

    const onLayout = (event) => {
        const { width, height } = event.nativeEvent.layout;
        setCanvasSize({ width, height });
    };

    // Helper to convert point array to SVG path data
    const getPathData = (points) => {
        if (!points || points.length === 0) return '';
        const start = denormalize(points[0].x, points[0].y);
        let d = `M ${start.x} ${start.y}`;
        
        for (let i = 1; i < points.length; i++) {
            const p = denormalize(points[i].x, points[i].y);
            d += ` L ${p.x} ${p.y}`;
        }
        return d;
    };

    // Combine local and external strokes for rendering
    // externalStrokes: finished strokes from history
    // activeExternalStrokes: strokes currently being drawn by partner
    const allStrokes = useMemo(() => {
        const activePartnerStrokes = Object.values(activeExternalStrokes);
        // Deduplicate: exclude local strokes already present in history (externalStrokes)
        const externalIds = new Set(externalStrokes.map(s => s.id));
        const uniqueLocal = localStrokes.filter(s => s.id !== activeStrokeId && !externalIds.has(s.id));
        return [...externalStrokes, ...uniqueLocal, ...activePartnerStrokes];
    }, [externalStrokes, localStrokes, activeExternalStrokes, activeStrokeId]);

    // Current active local stroke (rendered separately for max performance if needed, 
    // but react-native-svg is usually fine with this volume)
    const activeLocalStroke = localStrokes.find(s => s.id === activeStrokeId);

    return (
        <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
            {canvasSize.width > 0 && (
                <Svg style={StyleSheet.absoluteFill}>
                    {allStrokes.map(stroke => (
                        <Path
                            key={stroke.id}
                            d={getPathData(stroke.points)}
                            stroke={stroke.color}
                            strokeWidth={stroke.strokeWidth}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}
                    {activeLocalStroke && (
                        <Path
                            d={getPathData(activeLocalStroke.points)}
                            stroke={activeLocalStroke.color}
                            strokeWidth={activeLocalStroke.strokeWidth}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}
                </Svg>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});

export default DrawingCanvas;
