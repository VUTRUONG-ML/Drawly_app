import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { View, StyleSheet, GestureResponderEvent, TouchableOpacity } from 'react-native';
import { Canvas, Path, Skia, Group, Image as SkiaImage, useImage } from '@shopify/react-native-skia';
import { Shape, ShapeType, Point, StrokeWidth, Color, ImageShape, StartEndShape, FreehandShape } from '../types'; // Make sure Shape includes ImageShape in ../types
import { loadDraw, updateDraw } from '../services/drawService';
import { useAuth } from '../context/AuthContext';
import { useRoute, RouteProp } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

function isFreehandShape(shape: Shape): shape is FreehandShape {
  return shape.type === 'pen' || shape.type === 'eraser';
}

function isStartEndShape(shape: Shape): shape is StartEndShape {
  return shape.type === 'line' || shape.type === 'rectangle' || shape.type === 'oval';
}

function isImageShape(shape: Shape): shape is ImageShape {
  return shape.type === 'image';
}

type RouteParams = {
  drawId: string;
  drawName: string;
};

type ExtendedShapeTypeLocal = ShapeType | 'none';

interface DrawingCanvasProps {
  tool: ExtendedShapeTypeLocal;
  color: Color;
  strokeWidth: StrokeWidth;
  scale: number;
  offset: { x: number; y: number };
  setScale: (value: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  onImageMenuChange?: (show: boolean) => void; // callback để báo ra ngoài
}

const DrawingCanvas = forwardRef(({
  tool,
  color,
  strokeWidth,
  scale,
  offset,
  setScale,
  setOffset,
  onImageMenuChange,
}: DrawingCanvasProps, ref) => {
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { drawId } = route.params;
  const { userId, loading } = useAuth();

  const [savedShapes, setSavedShapes] = useState<Shape[]>([]);
  const [unsavedShapes, setUnsavedShapes] = useState<Shape[]>([]);
  const [redoStack, setRedoStack] = useState<Shape[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const allShapes = [...savedShapes, ...unsavedShapes];
  const [drawingShape, setDrawingShape] = useState<Shape | null>(null);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const dragOffset = useRef<{dx: number, dy: number}>({dx: 0, dy: 0});
  const currentPath = useRef(Skia.Path.Make());
  const pointsRef = useRef<Point[]>([]);
  const start = useRef<Point>({ x: 0, y: 0 });
  const end = useRef<Point>({ x: 0, y: 0 });
  const imageCache = useRef<{ [uri: string]: ReturnType<typeof useImage> | null }>({});

  // Chuyển tọa độ touch từ màn hình sang hệ tọa độ canvas
  const screenToCanvas = (x: number, y: number): Point => ({
    x: (x - offset.x) / scale,
    y: (y - offset.y) / scale,
  });

  useEffect(() => {
    if (!loading && userId && drawId) {
      loadDraw(userId, drawId).then(setSavedShapes);
    }
  }, [loading, userId, drawId]);

  const checkEmptyUnsavedShapes = () => unsavedShapes.length === 0;

  // Gọi callback khi showImageMenu thay đổi
  useEffect(() => {
    if (onImageMenuChange) onImageMenuChange(showImageMenu);
  }, [showImageMenu, onImageMenuChange]);

  const handleStart = (e: GestureResponderEvent) => {
    const tapPoint = screenToCanvas(e.nativeEvent.locationX, e.nativeEvent.locationY);

    const tappedImage = allShapes.find(
      (shape): shape is ImageShape =>
        shape.type === 'image' &&
        tapPoint.x >= shape.x &&
        tapPoint.x <= shape.x + shape.width &&
        tapPoint.y >= shape.y &&
        tapPoint.y <= shape.y + shape.height
    );

    if (tappedImage) {
      setSelectedImageId(tappedImage.uri);
      setShowImageMenu(true);
      setToolbarVisible(false);  // Hide toolbar when selecting an image
      setDraggingImageId(tappedImage.uri);
      dragOffset.current = {
        dx: tapPoint.x - tappedImage.x,
        dy: tapPoint.y - tappedImage.y,
      };
      return;
    } else {
      setSelectedImageId(null);
      setShowImageMenu(false);
      setToolbarVisible(true);  // Show toolbar when tapping outside image
    }

    if (tool === 'none') return;

    const x = tapPoint.x;
    const y = tapPoint.y;

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
    const movePoint = screenToCanvas(e.nativeEvent.locationX, e.nativeEvent.locationY);
    // Nếu đang kéo ảnh
    if (draggingImageId && selectedImageId === draggingImageId) {
      setUnsavedShapes(prev =>
        prev.map(shape => {
          if (shape.type === 'image' && shape.uri === draggingImageId) {
            return {
              ...shape,
              x: movePoint.x - dragOffset.current.dx,
              y: movePoint.y - dragOffset.current.dy,
            };
          }
          return shape;
        })
      );
      return;
    }
    if (!drawingShape) return;
    const x = movePoint.x;
    const y = movePoint.y;

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
    if (draggingImageId) {
      setDraggingImageId(null);
      return;
    }
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
        // Lọc các shape hợp lệ, không có trường undefined
        const updatedRaw = [...savedShapes, ...unsavedShapes];
        const updated = updatedRaw.filter(shape => {
          if (!shape || typeof shape !== 'object') return false;
          if (shape.type === 'image') {
            return (
              typeof shape.uri === 'string' &&
              typeof shape.x === 'number' &&
              typeof shape.y === 'number' &&
              typeof shape.width === 'number' &&
              typeof shape.height === 'number'
            );
          }
          if (shape.type === 'pen' || shape.type === 'eraser') {
            return shape.path && Array.isArray(shape.points) && typeof shape.color === 'string' && typeof shape.strokeWidth === 'number';
          }
          if (shape.type === 'line' || shape.type === 'rectangle' || shape.type === 'oval') {
            return shape.start && shape.end && typeof shape.color === 'string' && typeof shape.strokeWidth === 'number';
          }
          return false;
        });
        // Debug log
        if (updated.length !== updatedRaw.length) {
          console.warn('⚠️ Có shape không hợp lệ bị loại bỏ khi lưu:', updatedRaw.filter(s => !updated.includes(s)));
        }
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
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUnsavedShapes(prev => [...prev, last]);
  };

  const handleDeleteImage = () => {
    if (!selectedImageId) return;
    setUnsavedShapes(prev => prev.filter(shape => !(shape.type === 'image' && shape.uri === selectedImageId)));
    setSelectedImageId(null);
    setShowImageMenu(false);
  };

  const handleCopyImage = () => {
    if (!selectedImageId) return;
    const original = allShapes.find((s): s is ImageShape => s.type === 'image' && s.uri === selectedImageId);
    if (!original) return;

    // Tạo một uri mới cho ảnh sao chép để phân biệt
    const newUri = original.uri + '_copy_' + Date.now();
    const newShape: ImageShape = {
      type: 'image',
      uri: newUri,
      x: original.x + 20,
      y: original.y + 20,
      width: original.width,
      height: original.height,
    };
    // Copy image cache cho uri mới
    if (imageCache.current[original.uri]) {
      imageCache.current[newUri] = imageCache.current[original.uri];
    }
    setUnsavedShapes(prev => [...prev, newShape]);
    setSelectedImageId(newUri);
    setShowImageMenu(true);
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
    addImage: async (uri: string) => {
      try {
        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const skData = Skia.Data.fromBytes(uint8Array);
        const skImage = Skia.Image.MakeImageFromEncoded(skData);

        if (skImage) {
          imageCache.current[uri] = skImage;
          // Lấy kích thước thực tế của ảnh
          const imgWidth = skImage.width();
          const imgHeight = skImage.height();
          // Scale nhỏ lại nếu quá lớn (ví dụ max 300px)
          const maxDim = 300;
          let width = imgWidth;
          let height = imgHeight;
          if (imgWidth > maxDim || imgHeight > maxDim) {
            const scale = Math.min(maxDim / imgWidth, maxDim / imgHeight);
            width = imgWidth * scale;
            height = imgHeight * scale;
          }
          const newShape: Shape = {
            type: 'image',
            uri,
            x: 100,
            y: 100,
            width,
            height,
          };
          setUnsavedShapes(prev => [...prev, newShape]);
        } else {
          console.error('❌ Lỗi: Không decode được ảnh');
        }
      } catch (err) {
        console.error('❌ Lỗi khi tải ảnh:', err);
      }
    },
  }));

  const renderImages = () => {
    return allShapes
      .filter(shape => shape.type === 'image')
      .map((shape, index) => {
        if (shape.type === 'image') {
          let img = imageCache.current[shape.uri];
          if (!img) {
            return null;
          }
          return (
            <SkiaImage
              key={`img-${index}`}
              image={img}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              fit="contain"
            />
          );
        }
        return null;
      });
  };

  const renderImageBorder = () => {
    if (!selectedImageId) return null;
    const shape = allShapes.find((s): s is ImageShape => s.type === 'image' && s.uri === selectedImageId);
    if (!shape) return null;

    const path = Skia.Path.Make();
    if (shape.type === 'image') {
      path.addRect({
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      });
    }
    return (
      <Path
        path={path}
        color="black"
        style="stroke"
        strokeWidth={1}
      />
    );
  };

  const renderShape = (shape: Shape, index: number) => {
    try {
      if (isFreehandShape(shape)) {
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

      if (isStartEndShape(shape)) {
        const { start, end, color, strokeWidth } = shape;
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
            color={color}
            style="stroke"
            strokeWidth={strokeWidth}
          />
        );
      }

      if (shape.type === 'image') {
        const img = imageCache.current[shape.uri];
        if (!img) return null;

        return (
          <SkiaImage
            key={index}
            image={img}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fit="contain"
          />
        );
      }

      return null;
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
            {renderImages()}
            {renderImageBorder()}
            {allShapes.filter(s => s.type !== 'image').map(renderShape)}
            {drawingShape && renderShape(drawingShape, -1)}
          </Group>
        </Canvas>
      </View>
      {showImageMenu && (
        <View style={styles.imageMenu}>
          <TouchableOpacity style={styles.imageMenuButton} onPress={handleCopyImage}>
            <FontAwesome name="clone" size={20} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageMenuButton} onPress={handleDeleteImage}>
            <FontAwesome name="trash" size={20} color="red" />
          </TouchableOpacity>
        </View>
      )}
      {toolbarVisible && !showImageMenu && (
        // Your canvas tool menu UI ở đây
        null
      )}
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
    width: '100%', // Đã sửa từ '400%' -> '100%' để tránh bị thu nhỏ bất thường
  },
  imageMenu: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 6,
    elevation: 10, 
  },
  imageMenuButton: { 
    padding: 8,
    marginHorizontal: 5, //
    borderRadius: 6,
    backgroundColor: '#f2f2f2',
  },
});
