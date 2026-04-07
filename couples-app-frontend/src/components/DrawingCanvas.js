import React, { useRef, useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const THROTTLE_MS = 16; // ~60fps target

const DrawingCanvas = forwardRef(({ 
    isActive, 
    color, 
    strokeWidth, 
    brushType = 'solid',
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
    const lastPointRef = useRef(null);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        undo: () => {
            setLocalStrokes(prev => prev.slice(0, -1));
        },
        clear: () => {
            setLocalStrokes([]);
        }
    }));

    // Check if the pixel coordinates are within the canvas bounds
    const isInBounds = useCallback((x, y) => {
        if (!canvasSize.width || !canvasSize.height) return false;
        const margin = 5; // small margin of tolerance
        return x >= -margin && x <= canvasSize.width + margin &&
               y >= -margin && y <= canvasSize.height + margin;
    }, [canvasSize]);

    // Normalize point: { x: 0-1, y: 0-1 }
    const normalize = useCallback((x, y) => {
        if (!canvasSize.width || !canvasSize.height) return { x: 0, y: 0 };
        return {
            x: Math.max(0, Math.min(1, x / canvasSize.width)),
            y: Math.max(0, Math.min(1, y / canvasSize.height))
        };
    }, [canvasSize]);

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
            if (!isInBounds(locationX, locationY)) return;

            const strokeId = `${userId}-${Date.now()}`;
            const point = normalize(locationX, locationY);
            
            lastPointRef.current = point;

            const newStroke = {
                id: strokeId,
                userId,
                color,
                strokeWidth,
                brushType,
                points: [point]
            };

            currentStrokeRef.current = newStroke;
            setActiveStrokeId(strokeId);
            setLocalStrokes(prev => [...prev, newStroke]);
            
            onDrawStart?.({
                strokeId,
                color,
                width: strokeWidth,
                brushType,
                point
            });
        },
        onPanResponderMove: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;
            const now = Date.now();
            
            // Reject out-of-bounds points (finger dragged over toolbar)
            if (!isInBounds(locationX, locationY)) return;

            const point = normalize(locationX, locationY);
            const stroke = currentStrokeRef.current;
            if (!stroke) return;

            // Reject wild jumps (> 15% of canvas in a single frame)
            if (lastPointRef.current) {
                const dx = Math.abs(point.x - lastPointRef.current.x);
                const dy = Math.abs(point.y - lastPointRef.current.y);
                if (dx > 0.15 || dy > 0.15) {
                    // Skip this point — likely a touch coordinate glitch
                    return;
                }
            }
            lastPointRef.current = point;

            stroke.points.push(point);
            const snapshot = { ...stroke, points: [...stroke.points] };
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
        },
        onPanResponderRelease: () => {
            if (currentStrokeRef.current) {
                onDrawEnd?.(currentStrokeRef.current);
                currentStrokeRef.current = null;
                lastPointRef.current = null;
                setActiveStrokeId(null);
            }
        },
        onPanResponderTerminate: () => {
            if (currentStrokeRef.current) {
                onDrawEnd?.(currentStrokeRef.current);
                currentStrokeRef.current = null;
                lastPointRef.current = null;

                setActiveStrokeId(null);
            }
        },
        onPanResponderTerminationRequest: () => true,
    }), [isActive, color, strokeWidth, brushType, userId, canvasSize, normalize]);

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
            if (!points[i] || points[i].x === undefined) continue;
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

    // Current active local stroke
    const activeLocalStroke = localStrokes.find(s => s.id === activeStrokeId);

    const renderStroke = (stroke) => {
        const key = stroke.id;
        const commonProps = {
            d: getPathData(stroke.points),
            stroke: stroke.color,
            strokeWidth: stroke.strokeWidth,
            fill: "none",
            strokeLinecap: stroke.brushType === 'marker' ? "butt" : "round",
            strokeLinejoin: "round",
        };

        switch (stroke.brushType) {
            case 'dashed':
                return <Path key={key} {...commonProps} strokeDasharray={[stroke.strokeWidth * 2, stroke.strokeWidth * 2]} />;
            case 'dotted':
                return <Path key={key} {...commonProps} strokeDasharray={[1, stroke.strokeWidth * 1.5]} />;
            case 'neon':
                return (
                    <React.Fragment key={key}>
                        {/* Glow layer */}
                        <Path 
                            {...commonProps} 
                            strokeWidth={stroke.strokeWidth * 2.5} 
                            strokeOpacity={0.2} 
                        />
                        {/* Core layer */}
                        <Path {...commonProps} />
                    </React.Fragment>
                );
            case 'marker':
                return <Path key={key} {...commonProps} strokeOpacity={0.6} />;
            default:
                return <Path key={key} {...commonProps} />;
        }
    };

    return (
        <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
            {canvasSize.width > 0 && (
                <Svg style={StyleSheet.absoluteFill}>
                    {allStrokes.map(renderStroke)}
                    {activeLocalStroke && renderStroke(activeLocalStroke)}
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
