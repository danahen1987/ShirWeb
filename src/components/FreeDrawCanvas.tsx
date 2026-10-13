import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Point } from '../types';
import { pathFromPoints } from '../data/strokePaths';
import FaintLetter from './FaintLetter';
import { TracingCanvasStyles } from '../styles/AppStyles';

const COPY_COUNT = 5;
const COPY_GAP = 4;

const FreeDrawCanvas = ({
  character,
  cellSize,
  clearNonce,
}: {
  character: string;
  cellSize: number;
  clearNonce: number;
}) => {
  const width = cellSize * COPY_COUNT + COPY_GAP * (COPY_COUNT - 1);
  const height = cellSize;
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [liveStroke, setLiveStroke] = useState<Point[]>([]);
  const liveRef = useRef<Point[]>([]);
  const drawingRef = useRef(false);

  useEffect(() => {
    setStrokes([]);
    setLiveStroke([]);
    liveRef.current = [];
    drawingRef.current = false;
  }, [character, clearNonce]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderTerminationRequest: () => true,
        onShouldBlockNativeResponder: () => false,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          drawingRef.current = true;
          const { locationX, locationY } = evt.nativeEvent;
          const point = { x: locationX, y: locationY };
          liveRef.current = [point];
          setLiveStroke([point]);
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          if (!drawingRef.current) return;
          const { locationX, locationY } = evt.nativeEvent;
          const point = { x: locationX, y: locationY };
          const last = liveRef.current[liveRef.current.length - 1];
          if (last && Math.hypot(point.x - last.x, point.y - last.y) < 1.4) return;
          liveRef.current = [...liveRef.current, point];
          setLiveStroke(liveRef.current);
        },
        onPanResponderRelease: () => {
          drawingRef.current = false;
          const finished = liveRef.current;
          liveRef.current = [];
          setLiveStroke([]);
          if (finished.length < 2) return;
          setStrokes((prev) => [...prev, finished]);
        },
        onPanResponderTerminate: () => {
          drawingRef.current = false;
          liveRef.current = [];
          setLiveStroke([]);
        },
      }),
    [],
  );

  const inkPaths = [
    ...strokes.map((stroke) => pathFromPoints(stroke)),
    liveStroke.length > 1 ? pathFromPoints(liveStroke) : '',
  ].filter(Boolean);

  return (
    <View
      collapsable={false}
      style={[
        TracingCanvasStyles.canvasFrame,
        { width, height, direction: 'ltr' as const },
      ]}
      {...panResponder.panHandlers}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          flexDirection: 'row-reverse',
          alignItems: 'center',
        }}
      >
        {Array.from({ length: COPY_COUNT }).map((_, index) => (
          <View
            key={`${character}-free-${index}`}
            style={{
              width: cellSize,
              height: cellSize,
              marginLeft: index === COPY_COUNT - 1 ? 0 : COPY_GAP,
            }}
          >
            <FaintLetter character={character} canvasSize={cellSize} />
          </View>
        ))}
      </View>
      <Svg pointerEvents="none" width={width} height={height}>
        {inkPaths.map((d, index) => (
          <Path
            key={`ink-${index}`}
            d={d}
            stroke="#c0392b"
            strokeWidth={Math.max(8, cellSize * 0.045)}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    </View>
  );
};

export default FreeDrawCanvas;
