import React from 'react';

import { View, Text, StyleSheet } from 'react-native';

const GalleryScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Gallery Screen</Text>
    </View>
  );
};

export default GalleryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
