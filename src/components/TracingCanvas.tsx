import React, { useMemo, useRef, useState } from 'react';
import { View, Text, PanResponder, GestureResponderEvent } from 'react-native';
import TapButton from './TapButton';
import Svg, { Circle, Path } from 'react-native-svg';
import { TracingCanvasStyles } from '../styles/AppStyles';
import { Point, StrokeData } from '../types';
import { STROKE_VIEWBOX, getTraceCanvasSize } from '../constants/tracing';
import FaintLetter from './FaintLetter';
import {
  HIT_RADIUS,
  HIT_RADIUS_PX,
  START_RADIUS,
  START_RADIUS_PX,
  advanceAlongStroke,
  createTraceOrderMap,
  dist,
  isTouchingStrokeStart,
  isTraceComplete,
  lastVisitedPoint,
  tryVisitNextInOrder,
  TraceOrderMap,
} from '../utils/traceProgress';

const TracingCanvas = ({
  character,
  strokeData,
  onStrokeComplete,
  onAllStrokesComplete,
  compact = false,
  size,
}: {
  character: string;
  strokeData: StrokeData | null;
  onStrokeComplete?: (strokeIndex: number) => void;
  onAllStrokesComplete?: () => void;
  compact?: boolean;
  size?: number;
}) => {
  const defaultSize = useMemo(() => getTraceCanvasSize(210), []);
  const canvasSize = size ?? defaultSize;
  const hitRadius = Math.max(HIT_RADIUS, (HIT_RADIUS_PX / Math.max(canvasSize, 1)) * STROKE_VIEWBOX);
  const startRadius = Math.max(START_RADIUS, (START_RADIUS_PX / Math.max(canvasSize, 1)) * STROKE_VIEWBOX);
  const [currentStroke, setCurrentStroke] = useState(0);
  const [progressIndex, setProgressIndex] = useState(0);
  const [handlePos, setHandlePos] = useState<Point | null>(null);
  const currentStrokeRef = useRef(0);
  const progressRef = useRef(0);
  const completedRef = useRef(false);
  const tracingRef = useRef(false);
  const startedFromStartRef = useRef(false);
  const orderMapRef = useRef<TraceOrderMap>(createTraceOrderMap(0));
  const lastFingerRef = useRef<Point | null>(null);
  const frameSizeRef = useRef(canvasSize);

  const strokes = strokeData?.strokes || [];
  const active = strokes[currentStroke];

  const startPoint = useMemo(() => active?.points[0] || { x: 150, y: 40 }, [active]);

  const prepareStroke = (strokeIndex: number) => {
    const points = strokes[strokeIndex]?.points || [];
    orderMapRef.current = createTraceOrderMap(points.length);
    progressRef.current = 0;
    tracingRef.current = false;
    startedFromStartRef.current = false;
    lastFingerRef.current = null;
  };

  const reset = () => {
    setCurrentStroke(0);
    setProgressIndex(0);
    setHandlePos(strokes[0]?.points[0] || null);
    currentStrokeRef.current = 0;
    completedRef.current = false;
    prepareStroke(0);
  };

  React.useEffect(() => {
    frameSizeRef.current = canvasSize;
  }, [canvasSize]);

  React.useEffect(() => {
    reset();
  }, [character, strokeData?.strokeCount]);

  React.useEffect(() => {
    if (active) {
      setHandlePos(active.points[0]);
      setProgressIndex(0);
      prepareStroke(currentStroke);
    }
  }, [currentStroke, active]);

  const toLocal = (evt: GestureResponderEvent) => {
    const { locationX, locationY } = evt.nativeEvent;
    const size = frameSizeRef.current || canvasSize;
    return {
      x: (locationX / size) * STROKE_VIEWBOX,
      y: (locationY / size) * STROKE_VIEWBOX,
    };
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderTerminationRequest: () => true,
        onShouldBlockNativeResponder: () => false,
        onPanResponderGrant: (evt) => {
          const stroke = strokes[currentStrokeRef.current];
          if (!stroke?.points.length) return;
          if (orderMapRef.current.visited.length !== stroke.points.length) {
            orderMapRef.current = createTraceOrderMap(stroke.points.length);
          }
          const local = toLocal(evt);
          if (orderMapRef.current.nextIndex === 0) {
            const atStart = isTouchingStrokeStart(stroke.points, local, startRadius);
            tracingRef.current = atStart;
            if (!atStart) return;
            startedFromStartRef.current = true;
            advanceAlongStroke(orderMapRef.current, stroke.points, local, hitRadius, startRadius);
            progressRef.current = 0;
            setProgressIndex(0);
            setHandlePos(stroke.points[0]);
          } else {
            const resumePoint = lastVisitedPoint(orderMapRef.current, stroke.points);
            tracingRef.current =
              startedFromStartRef.current && !!resumePoint && dist(local, resumePoint) <= hitRadius * 1.6;
            if (!tracingRef.current) return;
          }
          lastFingerRef.current = local;
        },
        onPanResponderMove: (evt) => {
          const stroke = strokes[currentStrokeRef.current];
          if (!stroke || completedRef.current || !tracingRef.current || !startedFromStartRef.current) return;
          const local = toLocal(evt);
          if (orderMapRef.current.visited.length !== stroke.points.length) {
            orderMapRef.current = createTraceOrderMap(stroke.points.length);
            tryVisitNextInOrder(orderMapRef.current, stroke.points, stroke.points[0], hitRadius, startRadius);
          }

          advanceAlongStroke(orderMapRef.current, stroke.points, local, hitRadius, startRadius);
          const visitedIndex = Math.max(0, orderMapRef.current.nextIndex - 1);
          progressRef.current = visitedIndex;
          setProgressIndex(visitedIndex);
          setHandlePos(stroke.points[visitedIndex]);
          lastFingerRef.current = local;

          if (isTraceComplete(orderMapRef.current, stroke.points)) {
            const finishedIndex = currentStrokeRef.current;
            tracingRef.current = false;
            startedFromStartRef.current = false;
            onStrokeComplete?.(finishedIndex);
            if (finishedIndex >= strokes.length - 1) {
              completedRef.current = true;
              onAllStrokesComplete?.();
            } else {
              currentStrokeRef.current = finishedIndex + 1;
              setCurrentStroke(finishedIndex + 1);
            }
          }
        },
        onPanResponderRelease: () => {
          tracingRef.current = false;
          lastFingerRef.current = null;
        },
        onPanResponderTerminate: () => {
          tracingRef.current = false;
          lastFingerRef.current = null;
        },
      }),
    [strokes, onStrokeComplete, onAllStrokesComplete, canvasSize, hitRadius, startRadius],
  );

  if (!strokeData || !active) {
    return (
      <View style={compact ? TracingCanvasStyles.compactContainer : TracingCanvasStyles.container}>
        <Text style={TracingCanvasStyles.instruction}>אין מסלול כתיבה</Text>
      </View>
    );
  }

  const visiblePoints = active.points.slice(0, Math.max(progressIndex + 1, 1));
  const tracedPath = visiblePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
  const handle = handlePos || startPoint;
  const isNumber = /^\d+$/.test(character);
  const dotStep = isNumber ? 2 : 4;
  const nextTarget = active.points[progressIndex + 1];

  const retryButton = (
    <TapButton
      style={compact ? TracingCanvasStyles.compactRetry : TracingCanvasStyles.retryButton}
      onPress={reset}
      accessibilityLabel="נסו שוב"
    >
      <Svg width={compact ? 16 : 28} height={compact ? 16 : 28} viewBox="0 0 24 24">
        <Path
          d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
          fill="#ffffff"
        />
      </Svg>
    </TapButton>
  );

  return (
    <View style={compact ? TracingCanvasStyles.compactContainer : TracingCanvasStyles.container}>
      {!compact && <Text style={TracingCanvasStyles.instruction}>גררו את העיגול מלמעלה למטה</Text>}
      {!compact && (
        <View style={TracingCanvasStyles.stepRow}>
          {strokes.map((stroke, index) => (
            <View
              key={stroke.strokeNumber}
              style={[
                TracingCanvasStyles.stepDot,
                index === currentStroke && TracingCanvasStyles.stepDotActive,
                index < currentStroke && TracingCanvasStyles.stepDotDone,
              ]}
            />
          ))}
        </View>
      )}
      <View style={{ width: canvasSize, height: canvasSize }}>
        <View
          collapsable={false}
          style={[TracingCanvasStyles.canvasFrame, { width: canvasSize, height: canvasSize }]}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (width > 0) frameSizeRef.current = width;
          }}
          {...panResponder.panHandlers}
        >
          <FaintLetter character={character} canvasSize={canvasSize} />
          <Svg
            pointerEvents="none"
            width={canvasSize}
            height={canvasSize}
            viewBox={`0 0 ${STROKE_VIEWBOX} ${STROKE_VIEWBOX}`}
          >
            {strokes.map((stroke) => (
              <Path
                key={`ghost-${stroke.strokeNumber}`}
                d={stroke.path}
                stroke="#ead9a8"
                strokeWidth={16}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.55}
              />
            ))}
            {strokes.map((stroke, index) =>
              index < currentStroke ? (
                <Path
                  key={`done-${stroke.strokeNumber}`}
                  d={stroke.path}
                  stroke="#c0392b"
                  strokeWidth={14}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null,
            )}
            <Path
              d={active.path}
              stroke="#e74c3c"
              strokeWidth={10}
              fill="none"
              strokeDasharray={isNumber ? '5 7' : '10 10'}
              strokeLinecap="round"
              opacity={0.7}
            />
            {active.points
              .filter((_, index) => index % dotStep === 0)
              .map((point, index) => (
                <Circle
                  key={`dot-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={isNumber ? 3.2 : 2.4}
                  fill="#e74c3c"
                  opacity={0.45}
                />
              ))}
            {tracedPath.length > 0 && (
              <Path
                d={tracedPath}
                stroke="#c0392b"
                strokeWidth={14}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {nextTarget && (
              <Circle
                cx={nextTarget.x}
                cy={nextTarget.y}
                r={7}
                fill="#e74c3c"
                stroke="#ffffff"
                strokeWidth={2}
              />
            )}
            <Circle cx={startPoint.x} cy={startPoint.y} r={8} fill="#922b21" opacity={0.4} />
            <Circle cx={handle.x} cy={handle.y} r={16} fill="#922b21" stroke="#ffffff" strokeWidth={3} />
          </Svg>
        </View>
        {compact && retryButton}
      </View>
      {!compact && retryButton}
    </View>
  );
};

export default TracingCanvas;
