import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

const { width, height } = Dimensions.get('window');
type ShapeType = 'pen' | 'eraser' | 'line' | 'rectangle' | 'oval';

interface toolBarUnReDo{
    visible: boolean;
    onUndo: () => void;
    onRedo: () => void;
    position: { x: number; y: number };
}

interface toolBarShapeAndFreeDraw{
    visible: boolean;
    onSelectShape: () => ShapeType;
    position: { x: number; y: number };
    
}

interface toolBarStrokeWidthAndColor{
    visible: boolean;
    onStrokeWidth: () => void;
    onColor: () => void;
    position: { x: number; y: number };
}

export const ToolBarUnReDo: React.FC<toolBarUnReDo> = ({ visible, onUndo, onRedo }) => {
  return (
    <Modal>
      <View >
        <View >
          <TouchableOpacity onPress={onUndo} >
            <MaterialIcons name="undo" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRedo} >
            <MaterialIcons name="redo" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export const ToolBarShapeAndFreeDraw: React.FC<toolBarShapeAndFreeDraw> = ({ visible, onSelectShape, position}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View >
        <View >
          <TouchableOpacity onPress={onSelectShape=>{'pen'}} >
            <MaterialIcons name="edit" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSelectShape=>{'eraser'}} >
            <FontAwesome6 name="eraser" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSelectShape} >
            <MaterialIcons name="radio-button-checked" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSelectShape} >
            <MaterialIcons name="crop-square" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSelectShape} >
            <MaterialIcons name="remove" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSelectShape} >
            <MaterialIcons name="text-fields" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export const ToolBarStrokeWidthAndColor: React.FC<toolBarStrokeWidthAndColor> = ({ visible, onStrokeWidth, onColor }) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View >
        <View >
          <TouchableOpacity onPress={onStrokeWidth} >
            <MaterialIcons name="format-size" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onColor} >
            <MaterialIcons name="color-lens" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}











const styles = StyleSheet.create({})
;