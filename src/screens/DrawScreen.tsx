  import React, { useState, useRef, useEffect } from 'react';
  import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
  import DrawingCanvas from '../components/drawingCanvas';
  import StrokeWidthModal from '../components/Modal/StrokeWidthModal';
  import ColorPickModal from '../components/Modal/ColorPickModal';
  import { ShapeType, Color, StrokeWidth } from '../types';
  import Ionicons from '@expo/vector-icons/Ionicons';
  import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
  import Entypo from '@expo/vector-icons/Entypo';
  import MaterialIcons from '@expo/vector-icons/MaterialIcons';
  import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
  import { useNavigation, useRoute } from '@react-navigation/native';
  import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  Draw: { drawId: string; drawName: string; saveRequested?: boolean };
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Gallery: undefined;
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
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Draw'>>();
    const route = useRoute<RouteProp<RootStackParamList, 'Draw'>>();
    const canvasRef = useRef<any>(null);

  useEffect(() => {
    if (route.params?.saveRequested) {
      canvasRef.current?.handleSave?.(); // gọi hàm save từ DrawingCanvas
      navigation.setParams({ saveRequested: false }); // reset tránh lặp lại
    }
  }, [route.params?.saveRequested]);
    return (
      <View style={styles.container}>
        <DrawingCanvas
          ref={canvasRef}
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
          scale={scale}
          offset={offset}
          setScale={setScale}
          setOffset={setOffset}
        />

        <View style={styles.UnReDoContainer}>
          <TouchableOpacity style = {styles.toolButton}  onPress={() => canvasRef.current?.handleUndo?.()}>
            <MaterialCommunityIcons name="undo" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style = {styles.toolButton} onPress={() => canvasRef.current?.handleRedo?.()}>
            <MaterialCommunityIcons name="redo" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.toolbarContainer}>
          {[
            { label: 'pen', icon: <Ionicons name="pencil" size={24} color="black" /> },
            { label: 'eraser', icon: <Entypo name="eraser" size={24} color="black" /> },
            { label: 'line', icon: <MaterialIcons name="remove" size={24} color="black" /> },
            { label: 'rectangle', icon: <MaterialIcons name="square" size={24} color="black" /> },
            { label: 'oval', icon: <MaterialIcons name="radio-button-unchecked" size={24} color="black" /> },
          ].map(({ label, icon }) => (
            <TouchableOpacity key={label} onPress={() => setTool(label as ShapeType)} style={styles.toolButton}>
              {icon}
            </TouchableOpacity>
          ))}

          <View style={styles.separator} />

          <TouchableOpacity onPress={() => setStrokeModalVisible(true)} style={styles.toolButton}>
            <Text style={styles.strokeWidthText}>{strokeWidth}px</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setColorModalVisible(true)} style={styles.toolButton}>
            <View style={[styles.outerCircle, { backgroundColor: color }]} />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.toolButton} onPress={() => setScale(prev => Math.min(prev + 0.1, 3))}>
            <FontAwesome6 name="magnifying-glass-plus" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={() => setScale(prev => Math.max(prev - 0.1, 0.5))}>
            <FontAwesome6 name="magnifying-glass-minus" size={24} color="black" />
          </TouchableOpacity>
        </View>

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
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
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
      bottom: 100,
      left: 10,
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: 'auto',
      padding: 5,
      backgroundColor: '#fff',
      borderRadius: 8,
    },
  });
