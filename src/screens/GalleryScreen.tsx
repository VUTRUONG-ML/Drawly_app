import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Button,
  ToastAndroid,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { deleteDraw, getDrawsByUser, saveDraw } from '../services/drawService';
import uuid from 'react-native-uuid';
import { useFocusEffect } from '@react-navigation/native';
import Entypo from '@expo/vector-icons/Entypo';
type Draw = {
  drawId: string;
  drawName: string;
  thumbnailUrl?: string;
};

const GalleryScreen = ({ navigation }: any) => {
  const [creating, setCreating] = useState(false);
  const { userId, loading } = useAuth();
  const [draws, setDraws] = useState<(Draw & { thumbnailUrl: string })[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [projectName, setProjectName] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      const fetchDraws = async () => {
        try {
          const fetched = await getDrawsByUser(userId);
          const formatted = fetched.map((draw: Draw) => ({
            ...draw,
            thumbnailUrl: draw.thumbnailUrl || 'https://via.placeholder.com/120',
          }));
          setDraws(formatted);
        } catch (error) {
          console.error('Lỗi khi lấy danh sách bản vẽ:', error);
        }
      };
      setCreating(false);
      fetchDraws();
      return () => {};
    }, [userId])
  );

  const handleCreateNew = () => {
    if (loading || !userId || creating) return;
    setProjectName('');
    setModalVisible(true); // Hiện modal nhập tên
  };

  const confirmSave = async () => {
    if (!userId || !projectName.trim()) return;

    setCreating(true);
    try {
      const drawId = uuid.v4().toString();
      const drawName = projectName.trim();

      await saveDraw(userId, drawId, drawName, [], null);

      setModalVisible(false);
      navigation.navigate('Draw', { drawId, drawName });
    } catch (error) {
      console.error('Lỗi khi tạo bản vẽ mới:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenDraw = (drawId: string, drawName: string) => {
    navigation.navigate('Draw', { drawId, drawName });
  };
  const handleDelete = async (drawId: string) => {
    if (!userId) return;
    Alert.alert(
      'Xoá bản vẽ',
      'Bạn có chắc chắn muốn xoá bản vẽ này?',
      [
        {
          text: 'Huỷ',
          style: 'cancel',
        },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDraw(drawId, userId);
              setDraws((prev) => prev.filter((d) => d.drawId !== drawId));
              ToastAndroid.show('Đã xoá thành công!', ToastAndroid.SHORT);
            } catch (error) {
              console.error('Lỗi khi xoá bản vẽ:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  

  const renderItem = ({ item }: { item: Draw & { thumbnailUrl: string } }) => {
    if (!item) return null;
    return (
      <TouchableOpacity
        style={styles.projectBox}
        onPress={() => handleOpenDraw(item.drawId, item.drawName)}
      >
        <Image source={{ uri: item.thumbnailUrl }} style={styles.image} />
        <Text style={styles.name}>{item.drawName}</Text>
  
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.drawId)}
        >
          <Entypo name="trash" size={24} color="black" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if(!userId || loading){
    return (
      <View style={styles.container}>
      <Text style={{ fontSize: 18, textAlign: 'center' }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎨 Dự án của bạn</Text>

      <TouchableOpacity style={styles.newBox} onPress={handleCreateNew} disabled={creating}>
        <Text style={styles.plusSign}>＋</Text>
        <Text style={styles.newText}>Tạo mới</Text>
      </TouchableOpacity>

      <FlatList
        data={draws}
        renderItem={renderItem}
        keyExtractor={(item) => item.drawId}
        numColumns={2}
        contentContainerStyle={styles.grid}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập tên dự án</Text>
            <TextInput
              style={styles.input}
              placeholder="Tên dự án"
              value={projectName}
              onChangeText={setProjectName}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button title="Hủy" color="#888" onPress={() => setModalVisible(false)} />
              <View style={{ width: 12 }} />
              <Button title="Lưu" onPress={confirmSave} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GalleryScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  grid: {
    paddingBottom: 32,
  },
  projectBox: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    margin: 8,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
  name: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  newBox: {
    marginBottom: 16,
    backgroundColor: '#e0f7fa',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusSign: {
    fontSize: 40,
    color: '#00796b',
    fontWeight: 'bold',
  },
  newText: {
    fontSize: 16,
    marginTop: 8,
    color: '#00796b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ffcccc',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 1,
  },
  deleteText: {
    fontSize: 14,
    color: '#900',
    fontWeight: 'bold',
  },
  

});
