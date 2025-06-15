// StrokeWidthModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import { AntDesign } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface StrokeWidthModalProps {
  visible: boolean;
  strokeWidth: number;
  onChange: (val: number) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const StrokeWidthModal: React.FC<StrokeWidthModalProps> = ({
  visible,
  strokeWidth,
  onChange,
  onClose,
  position,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalContainer,
          {
            position: 'absolute',
            top: Math.min(position.y, screenHeight - 240),
            left: Math.min(position.x, screenWidth - 320),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Stroke Width</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <AntDesign name="close" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Picker */}
        <Picker
          mode="dropdown"
          selectedValue={strokeWidth}
          onValueChange={onChange}
          style={styles.picker}
        >
          {[1, 3, 5, 10, 15, 20, 25].map((val) => (
            <Picker.Item key={val} label={`${val}px`} value={val} />
          ))}
        </Picker>

        {/* Slider */}
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={25}
          step={1}
          value={strokeWidth}
          onValueChange={onChange}
          minimumTrackTintColor="#2196F3"
          maximumTrackTintColor="#ddd"
          thumbTintColor="#2196F3"
        />
      </View>
    </Modal>
  );
};

export default StrokeWidthModal;

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: 300,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  picker: {
    width: '100%',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
