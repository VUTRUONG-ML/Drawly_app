import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export const pickImage = async (): Promise<string | null> => {
  // Request permission first
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    alert('Permission to access media library is required!');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  } else {
    return null;
  }
};