import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';

type DrawingToolbarProps = {
  onSelectTool: (tool: string) => void;
  activeTool?: string | null;
};

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({ onSelectTool, activeTool }) => {
  return (
    <View style={styles.container}>
      {/* Pen */}
      <TouchableOpacity onPress={() => onSelectTool('pen')}>
        <MaterialCommunityIcons name="draw" size={28} color={activeTool === 'pen' ? '#1976D2' : 'black'} />
      </TouchableOpacity>

      {/* Eraser */}
      <TouchableOpacity onPress={() => onSelectTool('eraser')}>
        <MaterialCommunityIcons name="eraser" size={28} color={activeTool === 'eraser' ? '#1976D2' : 'black'} />
      </TouchableOpacity>

      {/* Shape */}
      <TouchableOpacity onPress={() => onSelectTool('shape')}>
        <Ionicons name="shapes-outline" size={28} color={activeTool === 'shape' ? '#1976D2' : 'black'} />
      </TouchableOpacity>

      {/* Color */}
      <TouchableOpacity onPress={() => onSelectTool('color')}>
        <Ionicons name="color-palette-outline" size={28} color={activeTool === 'color' ? '#1976D2' : 'black'} />
      </TouchableOpacity>

      {/* Size */}
      <TouchableOpacity onPress={() => onSelectTool('size')}>
        <Ionicons name="resize-outline" size={28} color={activeTool === 'size' ? '#1976D2' : 'black'} />
      </TouchableOpacity>
    </View>
  );
};

export default DrawingToolbar;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});