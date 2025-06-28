import React from 'react';
import { Canvas, Circle } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';

const DrawingCanvas = () => {
  const { width, height } = useWindowDimensions();
  const spacing = 20;
  const dots = [];

  for (let x = 0; x < width * 2; x += spacing) {
    for (let y = 0; y < height * 2; y += spacing) {
      dots.push(<Circle key={`${x}-${y}`} cx={x} cy={y} r={1} color="#ccc" />);
    }
  }

  return (
    <Canvas
      style={{
        position: 'absolute',
        left: -(width / 2),
        top: -(height / 2),
        width: width * 2,
        height: height * 2,
      }}
    >
      {dots}
    </Canvas>
  );
};

export default DrawingCanvas;