import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import DrawingCanvas from '../components/drawingCanvas';
import StrokeWidthModal from '../components/Modal/StrokeWidthModal';
import ColorPickModal from '../components/Modal/ColorPickModal';
import DraggableImage from '../components/DraggableImage';
import { pickImage, takePhoto } from '../services/ImagePickerService';
import { ShapeType, Color, StrokeWidth } from '../types';

type RootStackParamList = {
  Draw: { drawId: string; drawName: string; saveRequested?: boolean };
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Gallery: undefined;
};

type ImageItem = {
  uri: string;
  id: string;
  x: number;
  y: number;
};

export default function DrawingScreen() {
  const [tool, setTool] = useState<ShapeType>('pen');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [strokeWidth, setStrokeWidth] = useState<StrokeWidth>(5);
  const [color, setColor] = useState<Color>('rgba(0,0,0)');
  const [strokeModalVisible, setStrokeModalVisible] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [strokeModalPos, setStrokeModalPos] = useState({ x: 0, y: 0 });
  const [colorModalPos, setColorModalPos] = useState({ x: 0, y: 0 });
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Draw'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Draw'>>();
  const canvasRef = useRef<any>(null);

  // Zoom gesture
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const animatedScale = Animated.multiply(baseScale, pinchScale);

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: false }
  );

  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const currentBaseScale = (baseScale as any)._value;
      const currentPinchScale = (pinchScale as any)._value;
      let newScale = currentBaseScale * currentPinchScale;
      const MIN_SCALE = 0.5;
      if (newScale < MIN_SCALE) newScale = MIN_SCALE;
      baseScale.setValue(newScale);
      pinchScale.setValue(1);
      setScale(newScale);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (canvasRef.current?.checkUndoRedoState) {
        const { canUndo, canRedo } = canvasRef.current.checkUndoRedoState();
        setCanUndo(canUndo);
        setCanRedo(canRedo);
      }
    }, 200);

    if (route.params?.saveRequested) {
      canvasRef.current?.handleSave?.();
      navigation.setParams({ saveRequested: false });
    }

    return () => clearInterval(interval);
  }, [route.params?.saveRequested]);

  const handlePress = (
    btnRef: React.RefObject<any>,
    setModalPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>,
    setModalVisible: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (btnRef.current) {
      btnRef.current.measure?.((fx, fy, width, height, px, py) => {
        setModalPos({ x: px, y: py + height });
        setModalVisible(true);
      });
    } else {
      setModalVisible(true);
    }
  };

  const handleAddImage = (uri: string) => {
    setImages(prev => [...prev, { id: Date.now().toString(), uri, x: 100, y: 100 }]);
  };

  const getToolIcon = (tool: ShapeType) => {
    switch (tool) {
      case 'pen': return <Ionicons name="pencil" size={20} color="black" />;
      case 'eraser': return <Entypo name="eraser" size={20} color="black" />;
      case 'line': return <MaterialCommunityIcons name="slash-forward" size={24} color="black" />;
      case 'rectangle': return <MaterialCommunityIcons name="rectangle-outline" size={20} color="black" />;
      case 'oval': return <MaterialIcons name="radio-button-unchecked" size={20} color="black" />;
      default: return null;
    }
  };

  const strokeBtnRef = useRef<any>(null);
  const colorBtnRef = useRef<any>(null);

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={() => setSelectedImageId(null)}>
        <View style={{ flex: 1 }}>
          <PinchGestureHandler
            onGestureEvent={onPinchGestureEvent}
            onHandlerStateChange={onPinchHandlerStateChange}
          >
            <Animated.View style={{ flex: 1, transform: [{ scale: animatedScale }] }}>
              <DrawingCanvas
                ref={canvasRef}
                tool={tool}
                color={color}
                strokeWidth={strokeWidth}
                scale={scale}
                offset={offset}
                setScale={setScale}
                setOffset={setOffset}
                images={images}
              />
              {images.map((img) => (
                <DraggableImage
                  key={img.id}
                  id={img.id}
                  uri={img.uri}
                  initialX={img.x}
                  initialY={img.y}
                  onDelete={() => setImages(prev => prev.filter(i => i.id !== img.id))}
                  onSelect={setSelectedImageId}
                  selected={selectedImageId === img.id}
                  onDuplicate={(id) => {
                    const original = images.find(i => i.id === id);
                    if (original) {
                      setImages(prev => [
                        ...prev,
                        { ...original, id: Date.now().toString(), x: original.x + 20, y: original.y + 20 }
                      ]);
                    }
                  }}
                  onBringToFront={(id) => {
                    const target = images.find(i => i.id === id);
                    if (target) {
                      setImages(prev => [...prev.filter(i => i.id !== id), target]);
                    }
                  }}
                  onSendToBack={(id) => {
                    const target = images.find(i => i.id === id);
                    if (target) {
                      setImages(prev => [target, ...prev.filter(i => i.id !== id)]);
                    }
                  }}
                  onLock={() => {}}
                />
              ))}
            </Animated.View>
          </PinchGestureHandler>
        </View>
      </TouchableWithoutFeedback>

      {/* Undo/Redo */}
      <View style={styles.UnReDoContainer}>
        <TouchableOpacity
          disabled={!canUndo}
          style={[styles.toolButton, !canUndo && { opacity: 0.3 }]}
          onPress={() => canvasRef.current?.handleUndo?.()}
        >
          <MaterialCommunityIcons name="undo" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!canRedo}
          style={[styles.toolButton, !canRedo && { opacity: 0.3 }]}
          onPress={() => canvasRef.current?.handleRedo?.()}
        >
          <MaterialCommunityIcons name="redo" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Toggle Toolbar */}
      <TouchableOpacity
        style={styles.toggleToolbarButton}
        onPress={() => setToolbarVisible(!toolbarVisible)}
      >
        <View style={[styles.toolButton, { borderRadius: 50 }]}>
          {getToolIcon(tool)}
        </View>
      </TouchableOpacity>

      {/* Toolbar */}
      {toolbarVisible && (
        <View style={styles.toolbarContainer}>
          {/* Tool buttons */}
          {[
            { label: 'pen', icon: <Ionicons name="pencil" size={24} color="black" /> },
            { label: 'eraser', icon: <Entypo name="eraser" size={24} color="black" /> },
            { label: 'line', icon: <MaterialCommunityIcons name="slash-forward" size={24} color="black" /> },
            { label: 'rectangle', icon: <MaterialCommunityIcons name="rectangle-outline" size={24} color="black" /> },
            { label: 'oval', icon: <MaterialIcons name="radio-button-unchecked" size={24} color="black" /> },
          ].map(({ label, icon }) => (
            <TouchableOpacity key={label} onPress={() => { setTool(label as ShapeType); setToolbarVisible(false); }} style={styles.toolButton}>
              {icon}
            </TouchableOpacity>
          ))}
          <View style={styles.separator} />
          {/* Stroke width */}
          <TouchableOpacity
            ref={strokeBtnRef}
            onPress={() => handlePress(strokeBtnRef, setStrokeModalPos, setStrokeModalVisible)}
            style={[styles.toolButton, { alignItems: 'center', justifyContent: 'center', margin: 10 }]}
          >
            <Text style={styles.strokeWidthText}>{strokeWidth}px</Text>
          </TouchableOpacity>
          {/* Color */}
          <TouchableOpacity
            ref={colorBtnRef}
            onPress={() => handlePress(colorBtnRef, setColorModalPos, setColorModalVisible)}
            style={[styles.toolButton, { alignItems: 'center', justifyContent: 'center' }]}
          >
            <View style={[styles.outerCircle, { backgroundColor: color }]} />
          </TouchableOpacity>
          <View style={styles.separator} />
          {/* Zoom */}
          <TouchableOpacity style={styles.toolButton} onPress={() => setScale(prev => Math.min(prev + 0.1, 3))}>
            <FontAwesome6 name="magnifying-glass-plus" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={() => setScale(prev => Math.max(prev - 0.1, 0.5))}>
            <FontAwesome6 name="magnifying-glass-minus" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.separator} />
          {/* Add Image */}
          <TouchableOpacity style={styles.toolButton} onPress={() => setPhotoMenuVisible(true)}>
            <Ionicons name="image-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      )}

      {/* Modals */}
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
      <Modal
        visible={photoMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPhotoMenuVisible(false)}>
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 10,
              padding: 20,
              width: 220,
              alignItems: 'flex-start',
            }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
                onPress={async () => {
                  try {
                    const uri = await pickImage();
                    setPhotoMenuVisible(false);
                    if (uri) handleAddImage(uri);
                  } catch (e) {
                    setPhotoMenuVisible(false);
                    alert('Có lỗi xảy ra: ' + e);
                  }
                }}
              >
                <Ionicons name="image-outline" size={24} color="#333" />
                <Text style={{ marginLeft: 12, fontSize: 16 }}>Photos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
                onPress={async () => {
                  try {
                    const uri = await takePhoto();
                    setPhotoMenuVisible(false);
                    if (uri) handleAddImage(uri);
                  } catch (e) {
                    setPhotoMenuVisible(false);
                    alert('Lỗi khi mở camera: ' + e);
                  }
                }}
              >
                <Ionicons name="camera-outline" size={24} color="#333" />
                <Text style={{ marginLeft: 12, fontSize: 16 }}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbarContainer: {
    position: 'absolute',
    bottom: 100,
    right: 0,
    margin: 5,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 8,
  },
  toolButton: {
    padding: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 5,
  },
  strokeWidthText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  outerCircle: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    borderWidth: 2,
    borderColor: '#000',
  },
  separator: {
    borderTopColor: '#ccc',
    borderTopWidth: 2,
    width: '100%',
    marginVertical: 8,
  },
  UnReDoContainer: {
    position: 'absolute',
    bottom: 550,
    left: 10,
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: 'auto',
    padding: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  toggleToolbarButton: {
    position: 'absolute',
    bottom: 45,
    right: 10,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    elevation: 3,
    zIndex: 100,
  },
});
