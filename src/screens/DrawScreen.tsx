import React from 'react';

import { View, Text, StyleSheet } from 'react-native';
import DrawingCanvas from '../components/drawingCanvas';
import { Skia } from '@shopify/react-native-skia';
const DrawingScreen = () => {
  return (
    <View style={styles.container}>
      <DrawingCanvas />
    </View>
  );
};

export default DrawingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
