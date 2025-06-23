import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Animated, TouchableWithoutFeedback, Modal, TouchableOpacity, Pressable } from 'react-native';
import { pickImage, takePhoto } from '../services/ImagePickerService';
import { Ionicons } from '@expo/vector-icons';
import DraggableImage from '../components/DraggableImage';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';

type ImageItem = {
  uri: string;
  id: string;
};

const DrawingScreen = () => {
  const [images, setImages] = useState<{ id: string, uri: string, x: number, y: number }[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);

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

  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(baseScale, pinchScale);

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
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.toolbar}>
        {/* Old button removed, replaced with icon */}
        <TouchableOpacity onPress={() => setPhotoMenuVisible(true)} style={{ marginLeft: 8 }}>
          <Ionicons name="image-outline" size={28} color="black" />
        </TouchableOpacity>
        {/* Thêm các nút khác nếu muốn */}
      </View>

      <Text>Drawing Screen</Text>

      <TouchableWithoutFeedback onPress={() => setSelectedImageId(null)}>
        <View style={{ flex: 1 }}>
          <PinchGestureHandler
            onGestureEvent={onPinchGestureEvent}
            onHandlerStateChange={onPinchHandlerStateChange}
          >
            <Animated.View
              style={{
                flex: 1,
                backgroundColor: '#fafafa',
                borderWidth: 2,
                borderColor: '#2196f3',
                margin: 16,
                borderRadius: 12,
                overflow: 'hidden',
                transform: [{ scale }],
              }}
            >
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
                  onSelect={setSelectedImageId}
                  selected={selectedImageId === img.id}
                  onDuplicate={duplicateImage}
                  onBringToFront={bringToFront}
                  onSendToBack={sendToBack}
                  onLock={lockImage}
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

});