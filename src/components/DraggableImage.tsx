import React, { useRef } from 'react';
import { Animated, Image, StyleSheet, TouchableWithoutFeedback, View, PanResponder } from 'react-native';
import {
  State,
  PanGestureHandler,
  RotationGestureHandler,
  PinchGestureHandler,
} from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  id: string;
  uri: string;
  initialX?: number;
  initialY?: number;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  selected: boolean;
  onDuplicate: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onLock: (id: string) => void;
};

export default function DraggableImage({
  id,
  uri,
  initialX = 100,
  initialY = 100,
  onDelete,
  onSelect,
  selected,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onLock,
}: Props) {
  const [locked, setLocked] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(true);
  const [isInteracting, setIsInteracting] = React.useState(false);
  const [orientation, setOrientation] = React.useState<'landscape' | 'portrait'>('landscape');

  // Pan gesture state
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(initialX)).current;
  const translateY = useRef(new Animated.Value(initialY)).current;

  const onPanGestureEvent = !locked
    ? Animated.event(
        [{ nativeEvent: { translationX: panX, translationY: panY } }],
        { useNativeDriver: false }
      )
    : undefined;

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      setIsInteracting(true);
    }
    if (!locked && event.nativeEvent.oldState === State.ACTIVE) {
      // WARNING: Accessing internal value for calculation
      const currentX = (translateX as any)._value;
      const currentY = (translateY as any)._value;

      translateX.setValue(currentX + event.nativeEvent.translationX);
      translateY.setValue(currentY + event.nativeEvent.translationY);
      panX.setValue(0);
      panY.setValue(0);
    }
    if (event.nativeEvent.state === State.END) {
      setIsInteracting(false);
      setShowMenu(true);
    }
  };

  // Rotation gesture state
  const baseRotate = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const rotationValue = Animated.add(baseRotate, rotate);
  const rotateStr = rotationValue.interpolate({
    inputRange: [-Math.PI, Math.PI],
    outputRange: ['-180rad', '180rad'],
  });
  // Ref to track if rotation should be enabled for the current gesture
  const rotateEnabled = useRef(false);
  // Rotation gesture handler
  const onRotateGestureEvent = !locked
    ? Animated.event(
        [{ nativeEvent: { rotation: rotate } }],
        { useNativeDriver: false }
      )
    : undefined;

  // Handler for rotation gesture state changes
  const onRotateHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      const { x, y } = event.nativeEvent;
      // Check if touch is within the image bounds (assumes image size is 200x200 and centered)
      rotateEnabled.current = !locked && x >= 0 && x <= 200 && y >= 0 && y <= 200;
      setIsInteracting(true);
    }

    if (!locked && event.nativeEvent.state === State.END && rotateEnabled.current) {
      const currentBase = (baseRotate as any).__getValue();
      const currentDelta = (rotate as any).__getValue();
      const SENSITIVITY = 0.05;
      baseRotate.setValue(currentBase + currentDelta * SENSITIVITY);
      rotate.setValue(0);
    }

    if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED
    ) {
      rotateEnabled.current = false;
      setIsInteracting(false);
      setShowMenu(true);
    }
  };

  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(baseScale, pinchScale);

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: false }
  );

  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN && !locked) {
      setIsInteracting(true);
    }
    if (event.nativeEvent.state === State.END && !locked) {
      const currentBaseScale = (baseScale as any)._value;
      const currentPinchScale = (pinchScale as any)._value;
      let newScale = currentBaseScale * currentPinchScale;
      if (newScale < 0.5) newScale = 0.5;
      baseScale.setValue(newScale);
      pinchScale.setValue(1);
      setIsInteracting(false);
      setTimeout(() => {
        if ((baseScale as any)._value >= 1) {
          setOrientation('landscape');
        } else {
          setOrientation('portrait');
        }
      }, 50);
    }
  };

  return (
    <Animated.View style={styles.wrapper}>
      <RotationGestureHandler
        enabled={!locked}
        onGestureEvent={onRotateGestureEvent}
        onHandlerStateChange={onRotateHandlerStateChange}
      >
        <PanGestureHandler
          enabled={!locked}
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanHandlerStateChange}
        >
          <Animated.View
            style={{
              transform: [
                { translateX: Animated.add(translateX, panX) },
                { translateY: Animated.add(translateY, panY) },
                { rotate: rotateStr },
              ],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TouchableWithoutFeedback
              onPress={() => {
                onSelect(id);
                setIsInteracting(false);
                setShowMenu(true);
              }}
            >
              <View>
                <PinchGestureHandler
                  onGestureEvent={onPinchGestureEvent}
                  onHandlerStateChange={onPinchHandlerStateChange}
                  enabled={!locked}
                >
                  <Animated.View
                    style={{
                      width: 200,
                      height: 200,
                      transform: [{ scale }],
                      position: 'relative',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Image source={{ uri }} style={styles.image} />
                    {showMenu && selected && (
                      <View
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderWidth: 1,
                          borderColor: 'gray',
                          borderStyle: 'dashed',
                          borderRadius: 4,
                        }}
                      />
                    )}
                  </Animated.View>
                </PinchGestureHandler>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </PanGestureHandler>
      </RotationGestureHandler>
      {selected && showMenu && !isInteracting && (
        <Animated.View
          style={[
            styles.contextMenu,
            {
              position: 'absolute',
              left: '50%',
              marginLeft: -60,
              transform: [
                { translateX: Animated.add(translateX, panX) },
                {
                  translateY: Animated.add(
                    translateY,
                    Animated.multiply(scale, new Animated.Value(-90))
                  )
                },
              ],
            },
          ]}
        >
          <TouchableWithoutFeedback onPressIn={e => e.stopPropagation()}>
            <MaterialIcons name="content-copy" size={24} onPress={() => onDuplicate(id)} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPressIn={e => e.stopPropagation()}>
            <MaterialIcons name="flip-to-front" size={24} onPress={() => onBringToFront(id)} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPressIn={e => e.stopPropagation()}>
            <MaterialIcons name="flip-to-back" size={24} onPress={() => onSendToBack(id)} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPressIn={e => e.stopPropagation()}>
            <MaterialIcons
              name={locked ? 'lock' : 'lock-open'}
              size={24}
              onPress={() => setLocked(!locked)}
            />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPressIn={e => e.stopPropagation()}>
            <MaterialIcons name="delete" size={24} onPress={() => onDelete(id)} />
          </TouchableWithoutFeedback>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
  imageWrapper: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  canvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    elevation: 2,
    fontSize: 14,
  },
  contextMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 4,
    borderRadius: 8,
    elevation: 3,
    zIndex: 999,
  },
  resizeHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    zIndex: 10,
  },
});