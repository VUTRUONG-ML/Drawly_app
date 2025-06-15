import React, { useState, useRef, use, useEffect } from 'react';
import { View, Button, GestureResponderEvent } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import type { Shape, ShapeType, Point } from '../types'; // Các công cụ chính
import { saveDraw, loadDraw, updateDraw } from '../services/drawService'; // Dịch vụ lưu trữ và tải hình vẽ
import { useAuth } from '../context/AuthContext';
import { useRoute, RouteProp  } from '@react-navigation/native';
import { ToastAndroid } from 'react-native';
// xu ly su kien ve hinh

type RouteParams = {
  drawId: string;
  drawName: string;
};

export default function DrawingCanvas() {
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { userId, loading } = useAuth();  
  const { drawId, drawName } = route.params;
  const email = "abc@gmail.com";
    //su dung useState de quan ly trang thai ve hinh
  const [tool, setTool] = useState<ShapeType>('pen');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [drawingShape, setDrawingShape] = useState<Shape | null>(null);

  // su dung useRef de luu tru duong ve hien tai
  const currentPath = useRef(Skia.Path.Make());
  const pointsRef = useRef<Point[]>([]); // Lưu lại toàn bộ điểm mà pen đã đi qua 
  const start = useRef<Point>({ x: 0, y: 0 });
  const end = useRef<Point>({ x: 0, y: 0 });
    // xu ly su kien bat dau, di chuyen va ket thuc ve hinh

  useEffect(() => {
    if (loading || !userId || !drawId) return;
    async function fetchDraw() {
      const loadedShapes = await loadDraw(userId, drawId);
      setShapes(loadedShapes);
    };
    fetchDraw();
  }, [loading, userId]);

  
  const handleStart = (e: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = e.nativeEvent;
    if (tool === 'pen') {
      const path = Skia.Path.Make();
      path.moveTo(x, y);
      currentPath.current = path;
      pointsRef.current = [{x, y}]; 
      setDrawingShape({ type: 'pen', path, points: [{x, y}] });
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
      pointsRef.current.push({x, y}); // mỗi lần tay di chuyển qua điểm nào thì lưu lại điểm đó 
      setDrawingShape({ type: 'pen', path: currentPath.current.copy(), points: pointsRef.current });
    } else {
      end.current = { x, y };
      setDrawingShape({ type: tool, start: { ...start.current }, end: { ...end.current } });
    }
  };

  const handleEnd = async () => {
    if (drawingShape) {
      setShapes((prev) => [...prev, drawingShape]);
      if(userId){
        await updateDraw(drawId,[...shapes, drawingShape], null); // Lưu hình vẽ
      }
    }
    setDrawingShape(null);
    if (tool === 'pen') {
      currentPath.current = Skia.Path.Make(); // reset
      pointsRef.current = []; // reset điểm pen
    }
  };
  const handleSave = async () => {
    console.log("Saving draw...");
    if (loading || !userId || !drawId) return;
    try {
      await updateDraw(drawId,shapes, null); // Lưu hình vẽ
      ToastAndroid.show('✅ Đã lưu thành công!', ToastAndroid.SHORT);
      console.log("✅ Hình vẽ đã được lưu thành công!");
    } catch (error) {
      console.error("❌ Lỗi khi lưu hình vẽ:", error);
    }
  }
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
                marginBottom: 30,
            }}
            >
                <Button title="Pen" onPress={() => setTool('pen')} />
                <Button title="Line" onPress={() => setTool('line')} />
                <Button title="Rectangle" onPress={() => setTool('rectangle')} />
                <Button title="Circle" onPress={() => setTool('circle')} />
                <Button title="Save" onPress={() => handleSave()} />
            </View>
        </View>
    </View>
    );
}