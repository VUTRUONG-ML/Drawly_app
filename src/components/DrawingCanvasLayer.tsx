import React, { useState, useRef } from 'react';
import { Canvas, Path, Skia, Group } from '@shopify/react-native-skia';
import { useWindowDimensions, View, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';

type Point = { x: number; y: number };

type Props = {
  selectedTool: string;
  onCanvasTap: () => void;
};

const DrawingCanvasLayer = React.memo(({ selectedTool, onCanvasTap }: Props) => {
  const { width, height } = useWindowDimensions();
  const drawing = useRef(false);

  // Move paths and currentPath to useRef to persist across renders and tool changes
  const pathsRef = useRef<Point[][]>([]);
  const [_, forceUpdate] = useState(0); // force re-render

  const currentPathRef = useRef<Point[]>([]);

  // PanResponder must be recreated when selectedTool changes!
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true, // Always attach responder
    onMoveShouldSetPanResponder: () => true,  // Always attach responder
    onPanResponderGrant: (e: GestureResponderEvent) => {
      if (selectedTool !== 'pen') return;
      const { locationX, locationY } = e.nativeEvent;
      drawing.current = true;
      currentPathRef.current = [{ x: locationX, y: locationY }];
      forceUpdate((v) => v + 1);
    },
    onPanResponderMove: (e: GestureResponderEvent) => {
      if (!drawing.current || selectedTool !== 'pen') return;
      const { locationX, locationY } = e.nativeEvent;
      currentPathRef.current = [...currentPathRef.current, { x: locationX, y: locationY }];
      forceUpdate((v) => v + 1);
    },
    onPanResponderRelease: () => {
      if (!drawing.current || selectedTool !== 'pen') return;
      if (currentPathRef.current.length > 1) {
        pathsRef.current = [...pathsRef.current, [...currentPathRef.current]];
      }
      currentPathRef.current = [];
      drawing.current = false;
      forceUpdate((v) => v + 1);
    },
    onPanResponderTerminate: () => {
      drawing.current = false;
    },
  });

  const renderPath = (points: Point[], key?: React.Key) => {
    if (points.length < 2) return null;
    const skiaPath = Skia.Path.Make();
    skiaPath.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((p) => skiaPath.lineTo(p.x, p.y));
    return <Path key={key} path={skiaPath} color="black" style="stroke" strokeWidth={3} />;
  };

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, width, height }}
      onStartShouldSetResponder={() => selectedTool !== 'pen'}
      onResponderRelease={() => {
        if (selectedTool !== 'pen') onCanvasTap();
      }}
      {...(selectedTool === 'pen' ? panResponder.panHandlers : {})}
    >
      <Canvas style={{ width, height }}>
        <Group>
          {pathsRef.current.map((p, idx) => renderPath(p, idx))}
          {renderPath(currentPathRef.current, 'current')}
        </Group>
      </Canvas>
    </View>
  );
});

// NOTE: Để tránh lỗi closure PanResponder, bạn nên truyền thêm key={selectedTool} khi render DrawingCanvasLayer ở DrawScreen:
// <DrawingCanvasLayer key={activeTool} selectedTool={...} />

export default DrawingCanvasLayer;