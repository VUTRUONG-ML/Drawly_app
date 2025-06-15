import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Octicons } from '@expo/vector-icons';

interface ColorPickModalProps {
  visible: boolean;
  onSelectColor: (color: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const COLORS = [
  'black',
  'white',
  'red',
  'green',
  'blue',
  'orange',
  'yellow',
  'purple',
  'pink',
  'gray',
  'cyan',
];

const ColorPickModal: React.FC<ColorPickModalProps> = ({
  visible,
  onSelectColor,
  onClose,
  position,
}) => {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} />

      <View
        style={[
          styles.modalContainer,
          {
            top: Math.min(position.y + 10, Dimensions.get('window').height - 200),
            left: Math.min(position.x, Dimensions.get('window').width - 250),
          },
        ]}
      >
        <View style={styles.colorGrid}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={styles.colorButton}
              onPress={() => onSelectColor(color)}
            >
              <Octicons name="dot-fill" size={32} color={color} />
            </TouchableOpacity>
          ))}
        </View>
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
  },
  colorButton: {
    margin: 6,
  },
});
