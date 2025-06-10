import React from 'react';

import { View, Text, StyleSheet } from 'react-native';

const DrawingScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Drawing Screen</Text>
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
