import React, { useState, useRef } from 'react';
import { View, Button, GestureResponderEvent } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

//cac cong cu chinh
type ShapeType = 'pen' | 'line' | 'rectangle' | 'circle';

//cac doi tuong ve hinh
interface Point {
  x: number;
  y: number;
}

interface FreehandShape {
  type: 'pen';
  path: any; // SkPath
}

interface RectShape {
  type: 'rectangle' | 'line' | 'circle';
  start: Point;
  end: Point;
}

type Shape = FreehandShape | RectShape;


// xu ly su kien ve hinh
export default function DrawingCanvas() {
    //su dung useState de quan ly trang thai ve hinh
  const [tool, setTool] = useState<ShapeType>('pen');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [drawingShape, setDrawingShape] = useState<Shape | null>(null);

  // su dung useRef de luu tru duong ve hien tai
  const currentPath = useRef(Skia.Path.Make());
  const start = useRef<Point>({ x: 0, y: 0 });
  const end = useRef<Point>({ x: 0, y: 0 });
    // xu ly su kien bat dau, di chuyen va ket thuc ve hinh
  const handleStart = (e: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = e.nativeEvent;
    if (tool === 'pen') {
      const path = Skia.Path.Make();
      path.moveTo(x, y);
      currentPath.current = path;
      setDrawingShape({ type: 'pen', path });
    } else {
      start.current = { x, y };
      end.current = { x, y };
      setDrawingShape({ type: tool, start: { ...start.current }, end: { ...end.current } });
    }
  };

  const handleMove = (e: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = e.nativeEvent;
    if (!drawingShape) return;
    if (tool === 'pen') {
      currentPath.current.lineTo(x, y);
      setDrawingShape({ type: 'pen', path: currentPath.current.copy() });
    } else {
      end.current = { x, y };
      setDrawingShape({ type: tool, start: { ...start.current }, end: { ...end.current } });
    }
  };

  const handleEnd = () => {
    if (drawingShape) {
      setShapes((prev) => [...prev, drawingShape]);
    }
    setDrawingShape(null);
    if (tool === 'pen') {
      currentPath.current = Skia.Path.Make(); // reset
    }
  };
  // render hinh ve theo loai 
  const renderShape = (shape: Shape, index: number) => {
    switch (shape.type) {
      case 'pen':
        return <Path key={index} path={shape.path} color="black" style="stroke" strokeWidth={2} />;
      case 'line': {
        const path = Skia.Path.Make();
        path.moveTo(shape.start.x, shape.start.y);
        path.lineTo(shape.end.x, shape.end.y);
        return <Path key={index} path={path} color="blue" style="stroke" strokeWidth={2} />;
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
        return <Path key={index} path={path} color="green" style="stroke" strokeWidth={2} />;
      }
      case 'circle': {
        const { start, end } = shape;
        const radius = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
        const path = Skia.Path.Make();
        path.addCircle(start.x, start.y, radius);
        return <Path key={index} path={path} color="red" style="stroke" strokeWidth={2} />;
      }
      default:
        return null;
    }
  };

  return (
  <View  
    style={{
            flex: 1,             // ✅ chiếm toàn bộ không gian
            width: '100%',
            height: '100%',
            }
  }>
    {}
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleStart}
      onResponderMove={handleMove}
      onResponderRelease={handleEnd}
      onResponderTerminate={handleEnd}
    >
        <Canvas
            style={{ flex: 1, backgroundColor: '#f0f0f0' }}
            onTouchStart={handleStart}
        >
            {shapes.map((shape, index) => renderShape(shape, index))}
            {drawingShape && renderShape(drawingShape, -1)}
        </Canvas>
        
        </View>

        {/* Toolbar chọn công cụ */}
        <View>
            <View
            style={{
                flexDirection: 'row',
                
                justifyContent: 'space-around',
                padding: 10,
                backgroundColor: '#fff',
                borderTopWidth: 1,
                borderColor: '#ccc',
            }}
            >
                <Button title="Pen" onPress={() => setTool('pen')} />
                <Button title="Line" onPress={() => setTool('line')} />
                <Button title="Rectangle" onPress={() => setTool('rectangle')} />
                <Button title="Circle" onPress={() => setTool('circle')} />
            </View>
        </View>
    </View>
    );
}