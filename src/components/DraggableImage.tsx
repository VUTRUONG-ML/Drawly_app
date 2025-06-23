import React, { useRef } from 'react';
import { Animated, Image, StyleSheet, TouchableWithoutFeedback, View, PanResponder, Text } from 'react-native';
import {
  State,
  PanGestureHandler,
  RotationGestureHandler,
  PinchGestureHandler,
} from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

const snapToNearestRightAngle = (angleRad: number) => {
  const deg = ((angleRad * 180) / Math.PI + 360) % 360;
  const snapPoints = [0, 90, 180, 270, 360];
  for (const snap of snapPoints) {
    if (Math.abs(deg - snap) <= 5) {
      return (snap * Math.PI) / 180;
    }
  }
  return angleRad;
};

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
  const baseRotateRef = useRef(0);
  const rotateRef = useRef(0);
  // Standalone value for live computation/visual tracking
  React.useEffect(() => {
    const baseListenerId = baseRotate.addListener(({ value }) => {
      baseRotateRef.current = value;
    });
    const rotateListenerId = rotate.addListener(({ value }) => {
      rotateRef.current = value;
    });
    return () => {
      baseRotate.removeListener(baseListenerId);
      rotate.removeListener(rotateListenerId);
    };
  }, []);
  const rotationValue = Animated.add(baseRotate, rotate);
  const rotateStr = rotationValue.interpolate
    ? rotationValue.interpolate({
        inputRange: [-10000, 10000],
        outputRange: ['-10000rad', '10000rad'],
      })
    : rotationValue;
  // Ref to track if rotation should be enabled for the current gesture
  const rotateEnabled = useRef(false);
  // Ref to store the initial rotation value at the start of the gesture
  const initialRotation = useRef(0);

  // Rotation gesture handler
  const onRotateGestureEvent = (event: any) => {
    if (!locked && rotateEnabled.current) {
      const SENSITIVITY = 0.8; // Đặt lại hệ số để xoay mượt, không bị giật
      const delta = (event.nativeEvent.rotation - initialRotation.current) * SENSITIVITY;
      rotate.setValue(delta);
      rotateRef.current = delta;
    }
  };

  // Handler for rotation gesture state changes
  const onRotateHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      initialRotation.current = event.nativeEvent.rotation;
      rotateEnabled.current = !locked;
      setIsInteracting(true);
    }

    if (!locked && event.nativeEvent.oldState === State.ACTIVE && rotateEnabled.current) {
      // Cộng dồn giá trị xoay vào baseRotateRef và reset rotateRef
      let rawRotation = baseRotateRef.current + rotateRef.current;
      let snappedRotation = snapToNearestRightAngle(rawRotation);
      baseRotate.setValue(snappedRotation);
      baseRotateRef.current = snappedRotation;
      rotate.setValue(0);
      rotateRef.current = 0;
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

  // Ref to track if pinch gesture is allowed (starts inside image area)
  const pinchEnabled = useRef(false);

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: false }
  );

  const onPinchHandlerStateChange = (event: any) => {
    // Only allow pinch if gesture started within image bounds
    if (event.nativeEvent.state === State.BEGAN && !locked) {
      const { focalX, focalY } = event.nativeEvent;
      // Check if gesture starts within 200x200 image bounds
      if (focalX >= 0 && focalX <= 200 && focalY >= 0 && focalY <= 200) {
        pinchEnabled.current = true;
        setIsInteracting(true);
      } else {
        pinchEnabled.current = false;
      }
    }
    // Guard: ignore pinch if not enabled
    if (!pinchEnabled.current) return;
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
    // Reset pinchEnabled at the end of each gesture
    if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED ||
      event.nativeEvent.state === State.FAILED
    ) {
      pinchEnabled.current = false;
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
          <PinchGestureHandler
            onGestureEvent={onPinchGestureEvent}
            onHandlerStateChange={onPinchHandlerStateChange}
            enabled={!locked}
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
                </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </PinchGestureHandler>
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