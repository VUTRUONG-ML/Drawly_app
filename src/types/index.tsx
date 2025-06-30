import type { SkPath } from '@shopify/react-native-skia';

export type ShapeType = 'pen' | 'eraser' | 'line' | 'rectangle' | 'oval' | 'image';

export type Color = string;
export type StrokeWidth = number;

export interface Point {
  x: number;
  y: number;
}

export interface FreehandShape {
  type: 'pen' | 'eraser';
  path: SkPath;
  points: Point[];
  color: Color;
  strokeWidth: StrokeWidth;
}

export interface StartEndShape {
  type: 'line' | 'rectangle' | 'oval';
  start: Point;
  end: Point;
  color: Color;
  strokeWidth: StrokeWidth;
}

export interface ImageShape {
  type: 'image';
  uri: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Shape = FreehandShape | StartEndShape | ImageShape;