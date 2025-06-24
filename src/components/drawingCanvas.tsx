import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, StyleSheet, GestureResponderEvent } from 'react-native';
import { Canvas, Path, Skia, Group } from '@shopify/react-native-skia';
import { Shape, ShapeType, Point, StrokeWidth, Color } from '../types';
import { loadDraw, updateDraw } from '../services/drawService';
import { useAuth } from '../context/AuthContext';
import { useRoute, RouteProp } from '@react-navigation/native';

type RouteParams = {
  drawId: string;
  drawName: string;
};

interface DrawingCanvasProps {
  tool: ShapeType;
  color: Color;
  strokeWidth: StrokeWidth;
  scale: number;
  offset: { x: number; y: number };
  setScale: (value: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
}

const DrawingCanvas = forwardRef(({
  tool,
  color,
  strokeWidth,
  scale,
  offset,
  setScale,
  setOffset,
}: DrawingCanvasProps, ref) => {
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { drawId } = route.params;
  const { userId, loading } = useAuth();

  const [savedShapes, setSavedShapes] = useState<Shape[]>([]);
  const [unsavedShapes, setUnsavedShapes] = useState<Shape[]>([]);
  const [redoStack, setRedoStack] = useState<Shape[]>([]);
  const allShapes = [...savedShapes, ...unsavedShapes];
  const [drawingShape, setDrawingShape] = useState<Shape | null>(null);
  const currentPath = useRef(Skia.Path.Make());
  const pointsRef = useRef<Point[]>([]);
  const start = useRef<Point>({ x: 0, y: 0 });
  const end = useRef<Point>({ x: 0, y: 0 });

  const checkEmptyUnsavedShapes = () =>  {if (unsavedShapes.length === 0) return true; else return false;};
  useEffect(() => {
    if (!loading && userId && drawId) {
      loadDraw(userId, drawId).then(setSavedShapes);
    }
  }, [loading, userId, drawId]);

  const handleStart = (e: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = e.nativeEvent;

    if (tool === 'pen' || tool === 'eraser') {
      const path = Skia.Path.Make();
      path.moveTo(x, y);
      currentPath.current = path;
      pointsRef.current = [{ x, y }];
      setDrawingShape({ type: tool, path, points: [{ x, y }], color, strokeWidth });
    } else {
      start.current = { x, y };
      end.current = { x, y };
      setDrawingShape({
        type: tool,
        start: { ...start.current },
        end: { ...end.current },
        color,
        strokeWidth,
      } as Shape);
    }
  };

  const handleMove = (e: GestureResponderEvent) => {
    if (!drawingShape) return;
    const { locationX: x, locationY: y } = e.nativeEvent;

    if ('points' in drawingShape) {
      currentPath.current.lineTo(x, y);
      pointsRef.current.push({ x, y });
      setDrawingShape({
        ...drawingShape,
        path: currentPath.current.copy(),
        points: [...pointsRef.current],
      });
    } else if ('start' in drawingShape && 'end' in drawingShape) {
      end.current = { x, y };
      setDrawingShape({
        ...drawingShape,
        end: { ...end.current },
      });
    }
  };

  const handleEnd = () => {
    if (!drawingShape) return;

    const isValid =
      ('points' in drawingShape && drawingShape.points.length > 1) ||
      ('start' in drawingShape && 'end' in drawingShape);

    if (isValid) {
      setUnsavedShapes(prev => [...prev, drawingShape]);
      setRedoStack([]); // clear redo khi vẽ mới
    }

    setDrawingShape(null);
    currentPath.current = Skia.Path.Make();
    pointsRef.current = [];
  };

  const handleSave = async () => {
    if (userId && drawId) {
      try {
        const updated = [...savedShapes, ...unsavedShapes];
        await updateDraw(drawId, updated, null);
        setSavedShapes(updated);
        setUnsavedShapes([]);
        setRedoStack([]);
        console.log('✔️ Đã lưu bản vẽ');
      } catch (err) {
        console.error('❌ Lỗi lưu bản vẽ:', err);
      }
    }
  };

  const handleUndo = () => {
    if (unsavedShapes.length === 0) return;
    const last = unsavedShapes[unsavedShapes.length - 1];
    setUnsavedShapes(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, last]);
    return ;
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return ;
    const last = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUnsavedShapes(prev => [...prev, last]);
    return ;
  };

  useImperativeHandle(ref, () => ({
    handleSave,
    handleUndo,
    handleRedo,
    checkEmptyUnsavedShapes,

    checkUndoRedoState: () => ({
    canUndo: unsavedShapes.length > 0,
    canRedo: redoStack.length > 0,
  }),
  }));

  const renderShape = (shape: Shape, index: number) => {
    try {
      if ('points' in shape) {
        return (
          <Path
            key={index}
            path={shape.path}
            color={shape.type === 'eraser' ? '#f0f0f0' : shape.color}
            style="stroke"
            strokeWidth={shape.strokeWidth}
          />
        );
      }

      const { start, end } = shape;
      const path = Skia.Path.Make();

      if (shape.type === 'line') {
        path.moveTo(start.x, start.y);
        path.lineTo(end.x, end.y);
      } else if (shape.type === 'rectangle') {
        path.addRect({
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          width: Math.abs(end.x - start.x),
          height: Math.abs(end.y - start.y),
        });
      } else if (shape.type === 'oval') {
        path.addOval({
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          width: Math.abs(end.x - start.x),
          height: Math.abs(end.y - start.y),
        });
      }

      return (
        <Path
          key={index}
          path={path}
          color={shape.color}
          style="stroke"
          strokeWidth={shape.strokeWidth}
        />
      );
    } catch (err) {
      console.error('Lỗi render shape:', err);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.canvasWrapper}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleStart}
        onResponderMove={handleMove}
        onResponderRelease={handleEnd}
        onResponderTerminate={handleEnd}
      >
        <Canvas style={styles.canvas}>
          <Group transform={[{ translateX: offset.x }, { translateY: offset.y }, { scale }]}>
            {allShapes.map(renderShape)}
            {drawingShape && renderShape(drawingShape, -1)}
          </Group>
        </Canvas>
      </View>
    </View>
  );
});
export default DrawingCanvas;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvasWrapper: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  canvas: {
    flex: 1,
  },
});
