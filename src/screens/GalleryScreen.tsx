import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRoute } from '@react-navigation/native';

interface Project {
  id: string;
  name: string;
  thumbnailUrl: string;
  isNew?: boolean;
}

const mockProjects: Project[] = [
  // Bỏ các project cũ đi hoặc giữ tùy bạn
];

const GalleryScreen = ({ navigation }: any) => {
  const route = useRoute();
  const newProject = (route.params as any)?.newProject;

  const [projects, setProjects] = useState<Project[]>(mockProjects);

  useEffect(() => {
    if (newProject) {
      setProjects((prev) => [newProject, ...prev]);
    }
  }, [newProject]);

  const handleNewProject = () => {
    navigation.navigate('Draw');
  };

  const handleOpenProject = (projectId: string) => {
    navigation.navigate('Draw', { projectId });
  };

  const renderItem = ({ item }: { item: Project }) => {
    if (item.isNew) {
      return (
        <TouchableOpacity style={styles.newBox} onPress={handleNewProject}>
          <Text style={styles.plusSign}>＋</Text>
          <Text style={styles.newText}>Tạo mới</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.projectBox}
        onPress={() => handleOpenProject(item.id)}
      >
        <Image source={{ uri: item.thumbnailUrl }} style={styles.image} />
        <Text style={styles.name}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const dataWithCreate: Project[] = [
    { id: 'new', name: '', thumbnailUrl: '', isNew: true },
    ...projects,
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎨 Dự án của bạn</Text>
      <FlatList
        data={dataWithCreate}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
      />
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
  newBox: {
    flex: 1,
    backgroundColor: '#e0f7fa',
    margin: 8,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
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
});
