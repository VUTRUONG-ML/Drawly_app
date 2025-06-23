import React, { useState, useRef, use, useEffect } from 'react';
import { View,
  Button,
  GestureResponderEvent,
  TouchableOpacity,
  Text,
  findNodeHandle,
  UIManager,
  BackHandler,
  StyleSheet, 
} from 'react-native';
import StrokeWidthModal from './Modal/StrokeWidthModal';
import ColorPickModal from './Modal/ColorPickModal';
import { Canvas, Path, Skia, Group } from '@shopify/react-native-skia';
import type { Shape, ShapeType, Point, StrokeWidth, Color } from '../types'; // Các công cụ chính
import { saveDraw, loadDraw, updateDraw } from '../services/drawService'; // Dịch vụ lưu trữ và tải hình vẽ
import { useAuth } from '../context/AuthContext';
import { useRoute, RouteProp  } from '@react-navigation/native';
import { ToastAndroid } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
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

  const [tool, setTool] = useState<ShapeType>('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [redoStack, setRedoStack] = useState<Shape[]>([]);
  const [scale, setScale] = useState(1);
  
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [strokeWidth, setStrokeWidth] = useState<StrokeWidth>(5);
  const [color, setColor] = useState<Color>('rgba(0,0,0)');
  const [drawingShape, setDrawingShape] = useState<Shape | null>(null);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [strokeModalVisible, setStrokeModalVisible] = useState(false);
  const colorBtnRef = useRef(null);
  const strokeBtnRef = useRef(null);
  // const [newShape, setNewShape] = useState<Shape[]>([]);
  const [colorModalPos, setColorModalPos] = useState({ x: 0, y: 0 });
  const [strokeModalPos, setStrokeModalPos] = useState({ x: 0, y: 0 });
  const pointsRef = useRef<Point[]>([]);
  const currentPath = useRef(Skia.Path.Make());
  const start = useRef<Point>({ x: 0, y: 0 });
  const end = useRef<Point>({ x: 0, y: 0 });
  
 

  useEffect(() => {
    if (loading || !userId || !drawId) return;
    async function fetchDraw() {
      const loadedShapes = await loadDraw(userId, drawId);
      setShapes(loadedShapes);
    };
    fetchDraw();
  }, [loading, userId]);


  const handleStart = (e: GestureResponderEvent) => {
    if(redoStack.length > 0) {
      setRedoStack([]); // Reset redo stack khi bắt đầu vẽ mới
    }
    if (!isDrawing) return; // Prevent starting a new shape while drawing
    const { locationX: x, locationY: y } = e.nativeEvent;
    if (tool === 'pen' || tool === 'eraser') {
      const path = Skia.Path.Make();
      path.moveTo(x, y);
      currentPath.current = path;
      pointsRef.current = [{x, y}]; 
      setDrawingShape({ type: tool, path, points: [{x, y}], color: color, strokeWidth: strokeWidth});
    } else {
      start.current = { x, y };
      end.current = { x, y };
      setDrawingShape({ type: tool, start: { ...start.current }, end: { ...end.current }, color: color, strokeWidth: strokeWidth });
    }
  };

  const handleMove = (e: GestureResponderEvent) => {
    if (!isDrawing) return;
    const { locationX: x, locationY: y } = e.nativeEvent;
    if (!drawingShape) return;
    if (tool === 'pen' || tool === 'eraser') {
      currentPath.current.lineTo(x, y);
      pointsRef.current.push({x, y}); // mỗi lần tay di chuyển qua điểm nào thì lưu lại điểm đó 
      // setNewShape((prev) => [...prev, { type: tool, path: currentPath.current.copy(), points: pointsRef.current, color: drawingShape.color, strokeWidth: strokeWidth }]);
      setDrawingShape({ type: tool, path: currentPath.current.copy(), points: pointsRef.current, color: drawingShape.color, strokeWidth: strokeWidth });
    } else {
      end.current = { x, y };
      // setNewShape((prev) => [...prev, { type: tool, start: { ...start.current }, end: { ...end.current }, color: drawingShape.color, strokeWidth: strokeWidth }]);
      setDrawingShape({ type: tool, start: { ...start.current }, end: { ...end.current }, color: color, strokeWidth: strokeWidth });
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
    if (tool === 'pen' || tool === 'eraser') {
      currentPath.current = Skia.Path.Make(); // reset
      pointsRef.current = []; // reset điểm pen
    }
  };

  const handleBackPress = () => {
    if(redoStack.length > 0) {
      setRedoStack([]); // Reset redo stack khi bắt đầu vẽ mới
    }
    // if (newShape.length > 0) {
    //   setNewShape([]);
    //  } // Dừng vẽ nếu đang vẽ
      return false;
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
         <Group transform={[{ translateX: offset.x }, { translateY: offset.y }, { scale }]}>
            {shapes.map((shape, index) => renderShape(shape, index))}
            {drawingShape && renderShape(drawingShape, -1)}
          </Group>
        </Canvas>
      </View>

        <View style={styles.toolbarContainer}>
        {[
            { label: 'pen', Icon: () => <Ionicons name="pencil" size={26} color="black" /> },
            { label: 'eraser', Icon: () => <Entypo name="eraser" size={26} color="black" /> },
            { label: 'line', Icon: () => <MaterialIcons name="remove" size={26} color="black" /> },
            { label: 'rectangle', Icon: () => <MaterialIcons name="square" size={26} color="black" /> },
            { label: 'oval', Icon: () => <MaterialIcons name="radio-button-unchecked" size={26} color="black" /> },
          ].map(({ label, Icon }) => (
            <TouchableOpacity
              key={label}
              onPress={() => { setTool(label as ShapeType); setIsDrawing(true); }}
              style={[styles.toolButton]}
            >
              <Icon />
            </TouchableOpacity>
          ))}
        {/* // stroke width va color picker */}
        <View style={{ borderTopColor : '#ccc', borderTopWidth: 3, width: '100%', marginVertical: 8, alignItems : "center"}} />
          <TouchableOpacity
            ref={strokeBtnRef}
            onPress={() => handlePress(strokeBtnRef, setStrokeModalPos, setStrokeModalVisible)}
            style={styles.toolButton}
          >
            <Text style={styles.strokeWidthText}>{strokeWidth}px</Text>
          </TouchableOpacity>

          <TouchableOpacity
            ref={colorBtnRef}
            onPress={() => handlePress(colorBtnRef, setColorModalPos, setColorModalVisible)}
            style = {[styles.toolButton]}
          >
            <View style={[styles.outerCircle, {backgroundColor: color}]}/>
          </TouchableOpacity>
          {/* // zoom in va zoom out */}
          <View style={{ borderTopColor : '#ccc', borderTopWidth: 3, width: '100%', marginVertical: 8, alignItems : "center"}} />
            <TouchableOpacity style ={styles.toolButton} onPress={() => setScale(prev => Math.min(prev + 0.1, 3))}>
              <FontAwesome6 name="magnifying-glass-plus" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style ={styles.toolButton}  onPress={() => setScale(prev => Math.max(prev - 0.1, 0.5))}>
              <FontAwesome6 name="magnifying-glass-minus" size={24} color="black" />
            </TouchableOpacity>

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
      <View style = {styles.unRedoContainer}>
          {[{ label: 'undo', disabled: shapes.length === 0, onPress: async () => {
            if (shapes.length === 0) return;
            const newShapes = [...shapes];
            const last = newShapes.pop();
            if (last) {
              setShapes(newShapes);
              setRedoStack(prev => [...prev, last]);
            }
            await updateDraw(drawId, newShapes, null); // hoặc [...shapes] sau khi đã cập nhật

          }},
          { label: 'redo', disabled: redoStack.length === 0, onPress: async () => {
            if (redoStack.length === 0) return;
            const newRedo = [...redoStack];
            const lastRedo = newRedo.pop();
            if (lastRedo) {
              setRedoStack(newRedo);
              setShapes(prev => {
                const updatedShapes = [...prev, lastRedo];
                updateDraw(drawId, updatedShapes, null);
                return updatedShapes;
              });
            }
          }}].map(({ label, disabled, onPress }) => (
            <TouchableOpacity
              key={label}
              onPress={onPress}
              disabled={disabled}
              style={[styles.toolButton , styles.disabledButton]}
            >
              <MaterialIcons name={label === 'undo' ? 'undo' : 'redo'} size={24} color="black" />
            </TouchableOpacity>
          ))}
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
    position: 'absolute',
    bottom: 100,
    right : 0,
    margin: 10,
    flexDirection: 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  unRedoContainer: {
    position: 'absolute',
    bottom: 550, // Adjust this value to position the undo/redo buttons
    left: 0,
    marginLeft: 10,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 8,
  },
  toolButton: {
    padding: 10,
    backgroundColor: '#fff',
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
  
zoomText: {
  fontSize: 24,
  paddingHorizontal: 10,
},
});
