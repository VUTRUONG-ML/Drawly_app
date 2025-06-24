import React, { useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
  Image,
} from 'react-native';
import WheelColorPicker from 'react-native-wheel-color-picker';


interface ColorPickModalProps {
  visible: boolean;
  onSelectColor: (color: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const COLORS = [
  'black', 'white', 'red', 'green', 'blue',
  'orange', 'yellow', 'purple', 'pink', 'gray', 'cyan'
];

const ColorPickModal: React.FC<ColorPickModalProps> = ({
  visible,
  onSelectColor,
  onClose,
  position,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickedColor, setPickedColor] = useState('rgba(0, 0, 0, 1)');

  if (!visible) return null;

  const modalHeight = showColorPicker ? "auto" : "auto";
  const modalWidth = 300;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} />

      <View
        style={[
          styles.modalContainer,
          {
            height: modalHeight,
            width: modalWidth,
            bottom: Dimensions.get('window').height - position.y,
            left: Dimensions.get('window').width - position.x + 20,
          },
        ]}
      >
        {!showColorPicker && (
          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={styles.colorButton}
                onPress={() => {
                  onSelectColor(color);
                  onClose();
                }}
              >
                <View style={[styles.outerCircle, { backgroundColor: color }]} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.otherButton]}
              onPress={() => setShowColorPicker(true)}
            >
              <Image
                source={require('../../../assets/icons8-color-30.png')}
                style={{ width: 24, height: 24 }}
              />
            </TouchableOpacity>
          </View>
        )}

        {showColorPicker && (
          <View style={styles.pickerWrapper}>
            <WheelColorPicker
              color={pickedColor}
              onColorChange={setPickedColor}
              thumbSize={24}
              sliderSize={24}
              discrete={false}
            />
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  onSelectColor(pickedColor);
                  setShowColorPicker(false);
                  onClose();
                }}
                style={{ marginHorizontal: 10 }}
              >
                <Text style={styles.confirmText}>OK</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowColorPicker(false)}
                style={{ marginHorizontal: 10 }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

export default ColorPickModal;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
  },
  modalContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  colorButton: {
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#000',
  },
  otherButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#000',
    borderWidth: 1,
  },
  pickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelText: {
    color: 'blue',
    fontSize: 16,
  },
  confirmText: {
    color: 'green',
    fontSize: 16,
  },
});
