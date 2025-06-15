import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Animated, TouchableWithoutFeedback } from 'react-native';
import { pickImage } from '../services/ImagePickerService';
import DraggableImage from '../components/DraggableImage';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';

type ImageItem = {
  uri: string;
  id: string;
};

const DrawingScreen = () => {
  const [images, setImages] = useState<{ id: string, uri: string, x: number, y: number }[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Function to handle adding an image
  const handleAddImage = async () => {
    const uri = await pickImage();
    console.log('Picked URI:', uri); // Log the picked URI for debugging
    if (typeof uri === 'string' && uri) {
      setImages(prev => [
        ...prev,
        { id: Date.now().toString(), uri, x: 100, y: 100 },
      ]);
    }
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
        <Button title="Thêm ảnh" onPress={handleAddImage} />
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