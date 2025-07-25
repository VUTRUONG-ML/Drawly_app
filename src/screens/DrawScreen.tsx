import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
  import { View, StyleSheet, TouchableOpacity, Text, Modal, Alert } from 'react-native';
  import DrawingCanvas from '../components/DrawingCanvas';
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
  import { pickImage } from '../services/ImagePickerService'; 
  import FontAwesome from '@expo/vector-icons/FontAwesome';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { loadDraw } from '../services/drawService';
import { useAuth } from '../context/AuthContext';

type RootStackParamList = {
  Draw: { drawId: string; drawName: string; saveRequested?: boolean };
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Gallery: undefined;
};

type ExtendedShapeType = ShapeType | 'none';

export default function DrawingScreen() {

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Draw'>>();
  const [tool, setTool] = useState<ExtendedShapeType>('none');
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerTitle: tool !== 'none' ? () => (
        <TouchableOpacity
          onPress={() => {
            setTool('none');
            setToolbarVisible(true);
          }}
        >
          <Text style={{ color: '#3399ff', fontWeight: 'bold', fontSize: 16 }}>Done</Text>
        </TouchableOpacity>
      ) : '',
    });
  }, [navigation, tool]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [strokeWidth, setStrokeWidth] = useState<StrokeWidth>(5);
  const [color, setColor] = useState<Color>('rgba(0,0,0)');
  const [strokeModalVisible, setStrokeModalVisible] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [strokeModalPos, setStrokeModalPos] = useState({ x: 0, y: 0 });
  const [colorModalPos, setColorModalPos] = useState({ x: 0, y: 0 });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [unredoVisible, setUnredoVisible] = useState(true);

  const [isLoadingImage, setIsLoadingImage] = useState(false);
  
  const route = useRoute<RouteProp<RootStackParamList, 'Draw'>>();
  const canvasRef = useRef<any>(null);

  const { drawId } = route.params;
  const { userId, loading } = useAuth();
  useEffect(() => {
    if (!loading && userId && drawId) {
      loadDraw(userId, drawId).then(async (shapes) => {
        for (const shape of shapes) {
          if (shape.type === 'image') {
            await canvasRef.current?.addImage?.(shape.uri, shape.x, shape.y);
          }
        }
        canvasRef.current?.setInitialShapes?.(shapes);
      });
    }
  }, [loading, userId, drawId]);

  
  useEffect(() => {
    const interval = setInterval(() => {
    if (canvasRef.current?.checkUndoRedoState) {
      const { canUndo, canRedo } = canvasRef.current.checkUndoRedoState();
      setCanUndo(canUndo);
      setCanRedo(canRedo);
    }
    }, 200); // cập nhật mỗi 200ms

  
    if (route.params?.saveRequested) {
      canvasRef.current?.handleSave?.(); // gọi hàm save từ DrawingCanvas
      navigation.setParams({ saveRequested: false }); // reset tránh lặp lại
    }
    return () => clearInterval(interval);
  }, [route.params?.saveRequested, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Nếu chưa có hình vẽ mới nào 
      if(canvasRef.current?.checkEmptyUnsavedShapes?.()) return;

      // Ngắn kko cho rời khỏi trang ngay lập tức 
      e.preventDefault();
    
      Alert.alert(
        "Lưu bản vẽ?",
        "Bạn có muốn lưu bản vẽ trước khi thoát không?",
        [
          { text: "Không lưu", style: "destructive", onPress: () => navigation.dispatch(e.data.action) },
          { text: "Hủy", style: "cancel" },
          {
            text: "Lưu",
            onPress: () => {
              canvasRef.current?.handleSave?.();
              navigation.dispatch(e.data.action);
            }
          }
        ]
      );
    });
    return unsubscribe;
  }, [navigation]);

  const handlePress = (
    btnRef: React.RefObject<any>,
    setModalPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>,
    setModalVisible: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (btnRef.current) {
      btnRef.current.measure?.((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
        setModalPos({ x: px, y: py + height });
        setModalVisible(true);
      });
    } else {
      setModalVisible(true);
    }
  };

  const getToolIcon = (tool: ShapeType | 'none') => {
  switch (tool) {
    case 'pen':
      return <Ionicons name="pencil" size={20} color="black" />;
    case 'eraser':
      return <Entypo name="eraser" size={20} color="black" />;
    case 'line':
      return <MaterialCommunityIcons name="slash-forward" size={24} color="black" />;
    case 'rectangle':
      return <MaterialCommunityIcons name="rectangle-outline" size={20} color="black" />
    case 'oval':
      return <MaterialIcons name="radio-button-unchecked" size={20} color="black" />;
    default:
      return null;
  }
};

  const strokeBtnRef = useRef<any>(null);
  const colorBtnRef = useRef<any>(null);

  const handlePickImage = async () => {
    const localUri = await pickImage();
    if (localUri) {
      try {
        setIsLoadingImage(true); // 🔁 Bắt đầu hiển thị loading
        const cloudUrl = await uploadImageToCloudinary(localUri);
        if (cloudUrl) {
          await canvasRef.current?.addImage?.(cloudUrl); // Có await ở đây
        }
      } catch (error) {
        console.error('Lỗi khi tải ảnh lên:', error);
      } finally {
        setIsLoadingImage(false); // ✅ Kết thúc loading
      }
    }
  };

  useEffect(() => {
  if (tool !== 'none') {
    setToolbarVisible(false);
  }
}, [tool]);


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
          onImageMenuChange={(show: boolean) => setToolbarVisible(!show)}
        />

        <View style={styles.UnReDoContainer}>
          <TouchableOpacity
            disabled={!canUndo}
            style={[styles.toolButton, !canUndo && { opacity: 0.3 }]}
            onPress={() => canvasRef.current?.handleUndo?.()}
          >
            <MaterialCommunityIcons name="undo" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!canRedo}
            style={[styles.toolButton, !canRedo && { opacity: 0.3 }]}
            onPress={() => canvasRef.current?.handleRedo?.()}
          >
            <MaterialCommunityIcons name="redo" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
            style={styles.toggleToolbarButton}
            onPress={() => setToolbarVisible(!toolbarVisible)}
          >
            <View style={[styles.toolButton , {borderRadius: 50}]}>
              {getToolIcon(tool)}
            </View>
          </TouchableOpacity>
        {toolbarVisible && ( 
          <View style={styles.toolbarContainer}>
        {[
          { label: 'pen', icon: <Ionicons name="pencil" size={24} color="black" /> },
          { label: 'eraser', icon: <Entypo name="eraser" size={24} color="black" /> },
          { label: 'line', icon: <MaterialCommunityIcons name="slash-forward" size={24} color="black" /> },
          { label: 'rectangle', icon: <MaterialCommunityIcons name="rectangle-outline" size={24} color="black" /> },
          { label: 'oval', icon: <MaterialIcons name="radio-button-unchecked" size={24} color="black" /> },
          { label: 'image', icon: <FontAwesome name="image" size={24} color="black" /> },  // ✅ Thêm icon ảnh
        ].map(({ label, icon }) => (
          <TouchableOpacity
            key={label}
            onPress={() => {
              if (label === 'image') {
                handlePickImage(); // ✅ Khi nhấn icon ảnh
              } else {
                setTool(label as ExtendedShapeType);
                setToolbarVisible(false);
              }
            }}
            style={styles.toolButton}
          >
            {icon}
          </TouchableOpacity>
        ))}

          <View style={styles.separator} />
          <View>
          <TouchableOpacity
            ref={strokeBtnRef}
            onPress={() => handlePress(strokeBtnRef, setStrokeModalPos, setStrokeModalVisible)}
            style={[styles.toolButton, { alignItems: 'center', justifyContent: 'center' , margin: 10}]}
          >
            <Text style={styles.strokeWidthText}>{strokeWidth}px</Text>
          </TouchableOpacity>

          <TouchableOpacity
            ref={colorBtnRef}
            onPress={() => handlePress(colorBtnRef, setColorModalPos, setColorModalVisible)}
            style = {[styles.toolButton, { alignItems : 'center',justifyContent : 'center'}]}
          >
            <View style={[styles.outerCircle, {backgroundColor: color}]}/>
          </TouchableOpacity>
        </View>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.toolButton } onPress={() => setScale(prev => Math.min(prev + 0.1, 3))}>
            <FontAwesome6 name="magnifying-glass-plus" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={() => setScale(prev => Math.max(prev - 0.1, 0.5))}>
            <FontAwesome6 name="magnifying-glass-minus" size={24} color="black" />
          </TouchableOpacity>
        </View>
        )}
      
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
        {isLoadingImage && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Đang tải ảnh...</Text>
          </View>
        )}

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
      bottom: 550,
      left: 10,
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: 'auto',
      padding: 5,
      backgroundColor: '#fff',
      borderRadius: 8,
    },
    strokeWidthButton: {
    padding: 5,
    backgroundColor: '#ddd',
    borderRadius: 8,
    marginTop: 10,
  },
    toggleToolbarButton: {
    position: 'absolute',
    bottom: 45, // trên toolbar một chút
    right: 10,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    elevation: 3,
    zIndex: 100,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});