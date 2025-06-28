import React, { useState, useRef, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Animated, TouchableWithoutFeedback, Modal, TouchableOpacity, Pressable, useWindowDimensions } from 'react-native';
import { pickImage, takePhoto } from '../services/ImagePickerService';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import DraggableImage from '../components/DraggableImage';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import DrawingCanvas from '../components/DrawingCanvas';
import DrawingToolbar from '../components/DrawingToolbar';
import DrawingCanvasLayer from '../components/DrawingCanvasLayer';


type ImageItem = {
  uri: string;
  id: string;
};

const DrawingScreen = ({ navigation }: any) => {
  const { width, height } = useWindowDimensions();
  const [images, setImages] = useState<{ id: string, uri: string, x: number, y: number }[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'canvas' | 'image' | null>('canvas');
  // Track which image is in resize mode
  const [resizeActiveId, setResizeActiveId] = useState<string | null>(null);

  const imageMenuAnim = useRef(new Animated.Value(0)).current;
  const canvasMenuAnim = useRef(new Animated.Value(1)).current;

  // --- TOOL MODE STATE ---
  const [activeTool, setActiveTool] = useState<string | null>(null); // null = no tool active

  // Update header: luôn là function, hiện Done khi có tool, hiện Draw khi không có tool
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        activeTool ? (
          <TouchableOpacity onPress={() => setActiveTool(null)} style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Done</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Draw</Text>
        )
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => setPhotoMenuVisible(true)} style={{ marginRight: 16 }}>
          <Ionicons name="image-outline" size={24} color="black" />
        </TouchableOpacity>
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation, activeTool]);

  React.useEffect(() => {
    if (activeMenu === 'image') {
      Animated.parallel([
        Animated.timing(imageMenuAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(canvasMenuAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (activeMenu === 'canvas') {
      Animated.parallel([
        Animated.timing(imageMenuAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(canvasMenuAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeMenu]);

  // Function to handle adding an image by URI
  const handleAddImage = (uri: string) => {
    setImages(prev => [
      ...prev,
      { id: Date.now().toString(), uri, x: 100, y: 100 },
    ]);
  };

  const duplicateImage = (id: string) => {
    const target = images.find((img) => img.id === id);
    if (target) {
      setImages((prev) => [
        ...prev,
        { ...target, id: Date.now().toString(), x: target.x + 20, y: target.y + 20 },
      ]);
    }
  };

  const bringToFront = (id: string) => {
    const target = images.find((img) => img.id === id);
    if (target) {
      setImages((prev) => [...prev.filter((img) => img.id !== id), target]);
    }
  };

  const sendToBack = (id: string) => {
    const target = images.find((img) => img.id === id);
    if (target) {
      setImages((prev) => [target, ...prev.filter((img) => img.id !== id)]);
    }
  };

  const lockImage = (id: string) => {
    console.log('Lock image:', id);
  };

  const resizeImage = (id: string) => {
    setResizeActiveId(id);
  };

  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(baseScale, pinchScale);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Tính minScale để không zoom out quá mức, luôn vừa đủ viewport
  const minScale = Math.max(width / (width * 2), height / (height * 2)); // = 0.5 nếu canvas gấp đôi viewport
  const maxScale = 4; // Giới hạn zoom in tối đa (bạn có thể chỉnh lớn hơn tuỳ ý)

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: false }
  );

  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const currentBaseScale = (baseScale as any)._value;
      const currentPinchScale = (pinchScale as any)._value;
      let newScale = currentBaseScale * currentPinchScale;
      if (newScale < minScale) {
        newScale = minScale;
        pan.setValue({ x: 0, y: 0 }); // Reset pan về giữa khi zoom nhỏ nhất
      }
      if (newScale > maxScale) newScale = maxScale;
      baseScale.setValue(newScale);
      pinchScale.setValue(1);
    }
  };

  // --- CANVAS TAP: exit tool mode if any tool is active ---
  const handleCanvasTap = () => {
    setActiveMenu('canvas');
    setSelectedImageId(null);
    setResizeActiveId(null);
    // If a tool is active, exit tool mode
    if (activeTool) setActiveTool(null);
  };

  return (
    <View style={styles.container}>

      {/* Canvas area with pinch-to-zoom */}
      <TouchableWithoutFeedback onPress={handleCanvasTap}>
        <View style={{ flex: 1 }}>
          <PinchGestureHandler
            onGestureEvent={onPinchGestureEvent}
            onHandlerStateChange={onPinchHandlerStateChange}
          >
            <Animated.View style={{ flex: 1, transform: [
              { scale },
              { translateX: pan.x },
              { translateY: pan.y },
            ] }}>
              <DrawingCanvas />
              {/* Only allow drawing if pen tool is active */}
              <DrawingCanvasLayer
                selectedTool={activeMenu === 'canvas' && activeTool === 'pen' ? 'pen' : ''}
                onCanvasTap={handleCanvasTap}
              />
              {images.map((img) => (
                <DraggableImage
                  key={img.id}
                  id={img.id}
                  uri={img.uri}
                  initialX={img.x}
                  initialY={img.y}
                  onDelete={() => {
                    setImages(prev => prev.filter(item => item.id !== img.id));
                  }}
                  onSelect={(id) => {
                    setSelectedImageId(id);
                    setResizeActiveId(null);
                    setActiveMenu('image'); // Khi nhấn vào ảnh, chỉ hiện menu ảnh
                  }}
                  selected={selectedImageId === img.id}
                  onDuplicate={duplicateImage}
                  onBringToFront={bringToFront}
                  onSendToBack={sendToBack}
                  onLock={lockImage}
                  isResizing={resizeActiveId === img.id}
                  onExitResize={() => setResizeActiveId(null)}
                />
              ))}
            </Animated.View>
          </PinchGestureHandler>
        </View>
      </TouchableWithoutFeedback>

      {/* Modal for photo menu */}
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
                    setPhotoMenuVisible(false); // Đóng modal sau khi chọn/chụp xong
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
                    alert('Đang mở camera...');
                    const uri = await takePhoto();
                    setPhotoMenuVisible(false); // Đóng modal sau khi chọn/chụp xong
                    if (uri) {
                      handleAddImage(uri);
                    } else {
                      alert('Không nhận được ảnh từ camera. Có thể bạn đã huỷ hoặc chưa cấp quyền.');
                    }
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

      {/* Image menu (unchanged) */}
      {activeMenu === 'image' && selectedImageId && (
        <Animated.View
          style={[
            styles.bottomMenu,
            {
              opacity: imageMenuAnim,
              transform: [
                {
                  translateY: imageMenuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={activeMenu === 'image' ? 'auto' : 'none'}
        >
          <TouchableOpacity onPress={() => resizeImage(selectedImageId)}>
            <MaterialIcons name="aspect-ratio" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => duplicateImage(selectedImageId)}>
            <MaterialIcons name="content-copy" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => bringToFront(selectedImageId)}>
            <MaterialIcons name="flip-to-front" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => sendToBack(selectedImageId)}>
            <MaterialIcons name="flip-to-back" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {
            setImages(prev => prev.filter(item => item.id !== selectedImageId));
            setSelectedImageId(null);
            setActiveMenu('canvas');
          }}>
            <MaterialIcons name="delete" size={24} color="red" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Canvas toolbar: activate tool mode on tool select */}
      <Animated.View style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        opacity: canvasMenuAnim,
        transform: [{ translateY: canvasMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
      }}
      pointerEvents={activeMenu === 'canvas' ? 'auto' : 'none'}
      >
        {activeMenu === 'canvas' && (
          <DrawingToolbar onSelectTool={(tool) => {
            if (tool !== activeTool) setActiveTool(tool); // Only set if different, so pen stays active
          }} activeTool={activeTool} />
        )}
      </Animated.View>
      
    </View>
  );
};


export default DrawingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  toolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    width: '100%',
    backgroundColor: '#eee',
  },

  bottomMenu: {
  position: 'absolute',
  bottom: 40,                // 👉 Đẩy lên trên một chút
  left: 60,                  // 👉 Thu hẹp chiều ngang, không full screen
  right: 60,
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  paddingVertical: 5,        //Giảm độ cao
  paddingHorizontal: 10,
  backgroundColor: '#ffffff',
  borderRadius: 16,          //Bo tròn hơn
  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 4,
  },
});