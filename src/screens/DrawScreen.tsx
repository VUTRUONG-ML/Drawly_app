import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  Gallery: { newProject?: Project };
  Draw: undefined;
};

interface Project {
  id: string;
  name: string;
  thumbnailUrl: string;
}

const DrawScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [projectName, setProjectName] = useState('');

  const handleSavePress = () => {
    setModalVisible(true);
  };

  const confirmSave = () => {
    if (!projectName.trim()) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: projectName,
      thumbnailUrl: 'https://via.placeholder.com/150',
    };

    setModalVisible(false);
    setProjectName('');
    navigation.navigate('Gallery', { newProject }); // chuyền project mới về Gallery
  };

  return (
    <View style={styles.container}>
      <Text>Drawing Screen</Text>
      <Button title="Save" onPress={handleSavePress} />

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
            <Button title="Lưu" onPress={confirmSave} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DrawScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 20,
    paddingVertical: 5,
  },
});
