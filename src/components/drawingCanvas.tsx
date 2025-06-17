import React, { useState, useRef } from 'react';
import {
  View,
  Button,
  GestureResponderEvent,
  TouchableOpacity,
  Text,
  findNodeHandle,
  UIManager,
  StyleSheet,
} from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import StrokeWidthModal from './Modal/StrokeWidthModal';
import ColorPickModal from './Modal/ColorPickModal';
import {Octicons} from '@expo/vector-icons';

type ShapeType = 'pen' | 'eraser' | 'line' | 'rectangle' | 'oval';
type StrokeWidth = number;
type Color = 'rgba(0,0,0)' | 'rgba(0,0,255)' | 'rgba(0,128,0)' | 'rgba(255,0,0)' | 'rgba(240,240,240)';

interface Point {
  x: number;
  y: number;
}

interface FreehandShape {
  type: 'pen' | 'eraser';
  path: any; // SkPath
  strokeWidth: number;
  color?: Color;
}

interface BasicShape {
  type: 'rectangle' | 'line' | 'oval';
  start: Point;
  end: Point;
  strokeWidth: number;
  color?: Color;
}



type Shape = FreehandShape | BasicShape ;

export default function DrawingCanvas() {

  const [tool, setTool] = useState<ShapeType>('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [redoStack, setRedoStack] = useState<Shape[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [strokeWidth, setStrokeWidth] = useState<StrokeWidth>(5);
  const [color, setColor] = useState<Color>('rgba(0,0,0)');
  const [drawingShape, setDrawingShape] = useState<Shape | null>(null);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [strokeModalVisible, setStrokeModalVisible] = useState(false);
  const colorBtnRef = useRef(null);
  const strokeBtnRef = useRef(null);
  const [colorModalPos, setColorModalPos] = useState({ x: 0, y: 0 });
  const [strokeModalPos, setStrokeModalPos] = useState({ x: 0, y: 0 });

  const currentPath = useRef(Skia.Path.Make());
  const start = useRef<Point>({ x: 0, y: 0 });
  const end = useRef<Point>({ x: 0, y: 0 });

  const handleStart = (e: GestureResponderEvent) => {
    if (!isDrawing) return; // Prevent starting a new shape while drawing
    const { locationX: x, locationY: y } = e.nativeEvent;
    if (tool === 'pen' || tool === 'eraser') {
      const path = Skia.Path.Make();
      path.moveTo(x, y);
      currentPath.current = path;
      setDrawingShape({ type: tool, path, strokeWidth, color });
    } else {
      start.current = { x, y };
      end.current = { x, y };
      setDrawingShape({ type: tool, start: { ...start.current }, end: { ...end.current }, strokeWidth, color });
    }
  };

  const handleMove = (e: GestureResponderEvent) => {
    if (!isDrawing) return;
    const { locationX: x, locationY: y } = e.nativeEvent;
    if (!drawingShape) return;
    if (tool === 'pen' || tool === 'eraser') {
      currentPath.current.lineTo(x, y);
      setDrawingShape({ type: tool, path: currentPath.current.copy(), strokeWidth, color: drawingShape.color });
    } else {
      end.current = { x, y };
      setDrawingShape({
        type: tool,
        start: { ...start.current },
        end: { ...end.current },
        strokeWidth,
        color: drawingShape.color,
      });
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    if (drawingShape) {
      setShapes((prev) => [...prev, drawingShape]);
    }
    setDrawingShape(null);
    if (tool === 'pen') {
      currentPath.current = Skia.Path.Make(); // reset path
    }
  };

  const handlePress = (ref: any, setPos: any, setVisible: any) => {
  const handle = findNodeHandle(ref.current);
  if (handle) {
    requestAnimationFrame(() => {
      UIManager.measure(handle, (_x, _y, _width, _height, pageX, pageY) => {
        setPos({ x: pageX, y: pageY + _height });
        setVisible(true);
      });
    });
  }
};
  
  const renderShape = (shape: Shape, index: number) => {
    switch (shape.type) {
      case 'pen':
        return (
          <Path
            key={index}
            path={shape.path}
            color={shape.color }
            style="stroke"
            strokeWidth={shape.strokeWidth}
          />
        );
      case 'eraser':
        return (
          <Path
            key={index}
            path={shape.path}
            color="#f0f0f0"
            style="stroke"
            strokeWidth={shape.strokeWidth}
          />
        );
      case 'line': {
        const path = Skia.Path.Make();
        path.moveTo(shape.start.x, shape.start.y);
        path.lineTo(shape.end.x, shape.end.y);
        return (
          <Path
            key={index}
            path={path}
            color={shape.color}
            style="stroke"
            strokeWidth={shape.strokeWidth}
          />
        );
      }
      case 'rectangle': {
        const { start, end } = shape;
        const path = Skia.Path.Make();
        path.addRect({
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          width: Math.abs(end.x - start.x),
          height: Math.abs(end.y - start.y),
        });
        return (
          <Path
            key={index}
            path={path}
            color={shape.color}
            style="stroke"
            strokeWidth={shape.strokeWidth}
          />
        );
      }
      case 'oval': {
        const { start, end } = shape;
        const path = Skia.Path.Make();
        path.addOval({
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
        });
        return (
          <Path
            key={index}
            path={path}
            color={shape.color}
            style="stroke"
            strokeWidth={shape.strokeWidth}
          />
        );
      }
      default:
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
          {shapes.map((shape, index) => renderShape(shape, index))}
          {drawingShape && renderShape(drawingShape, -1)}
        </Canvas>
      </View>

        <View style={styles.toolbarContainer}>
        {[
          { label: 'Undo', disabled: shapes.length === 0, onPress: () => {
            if (shapes.length === 0) return;
            setIsDrawing(false);
            const lastShape = shapes[shapes.length - 1];
            setRedoStack(lastShape ? [...redoStack, lastShape] : redoStack);
            setShapes(prev => prev.slice(0, -1));
          }},
          { label: 'Redo', disabled: redoStack.length === 0, onPress: () => {
            setIsDrawing(false);
            if (redoStack.length > 0) {
              const lastRedo = redoStack[redoStack.length - 1];
              setShapes(prev => [...prev, lastRedo]);
              setRedoStack(prev => prev.slice(0, -1));
            }
          }},
          { label: 'Pen', onPress: () => { setTool('pen'); setIsDrawing(true); } },
          { label: 'Eraser', onPress: () => { setTool('eraser'); setIsDrawing(true); } },
          { label: 'Line', onPress: () => { setTool('line'); setIsDrawing(true); } },
          { label: 'Rectangle', onPress: () => { setTool('rectangle'); setIsDrawing(true); } },
          { label: 'oval', onPress: () => { setTool('oval'); setIsDrawing(true); } },
        ].map(({ label, disabled, onPress }) => (
          <TouchableOpacity
            key={label}
            onPress={onPress}
            disabled={disabled}
            style={[styles.toolButton, disabled && styles.disabledButton]}
          >
            <Text style={styles.toolButtonText}>{label}</Text>
          </TouchableOpacity>
        ))}

        <View>
          <TouchableOpacity
            ref={strokeBtnRef}
            onPress={() => handlePress(strokeBtnRef, setStrokeModalPos, setStrokeModalVisible)}
            style={styles.strokeWidthButton}
          >
            <Text style={styles.strokeWidthText}>{strokeWidth}px</Text>
          </TouchableOpacity>

          <TouchableOpacity
            ref={colorBtnRef}
            onPress={() => handlePress(colorBtnRef, setColorModalPos, setColorModalVisible)}
            style = {[styles.toolButton, { alignItems : 'center',justifyContent : 'center'}]}
          >
            <View style={[styles.outerCircle, {backgroundColor: color}]}/>
          </TouchableOpacity>
        </View>

        <StrokeWidthModal
          visible={strokeModalVisible}
          strokeWidth={strokeWidth}
          onChange={setStrokeWidth}
          onClose={() => setStrokeModalVisible(false)}
          position={strokeModalPos}
        />

        <ColorPickModal
          visible={colorModalVisible}
          onSelectColor={(selectedColor) => {
            setColor(selectedColor as Color);
            setColorModalVisible(false);
          }}
          onClose={() => setColorModalVisible(false)}
          position={colorModalPos}
        />
      </View>
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  canvasWrapper: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  canvas: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  toolbarContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  toolButton: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  toolButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  strokeWidthButton: {
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 8,
    marginTop: 10,
  },
  strokeWidthText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  outerCircle: {
    width: 25, // hoặc 30 nếu muốn viền ôm sát hơn
    height: 25,
    borderRadius: 12.5,
    borderWidth: 2,
  },
});
