// /src/types.ts

import type { SkPath } from '@shopify/react-native-skia';

export type ShapeType = 'pen' | 'line' | 'rectangle' | 'circle';

export interface Point {
  x: number;
  y: number;
}

export interface FreehandShape {
  type: 'pen';
  path: any;
  points: Point[];  // để lưu JSON dễ hơn
}

export interface RectShape {
  type: 'rectangle' | 'line' | 'circle';
  start: Point;
  end: Point;
}

export type Shape = FreehandShape | RectShape;
