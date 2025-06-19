import type { SkPath } from '@shopify/react-native-skia';

export type ShapeType = 'pen' | 'eraser' | 'line' | 'rectangle' | 'oval';

export type Color =
  | 'rgba(0,0,0)'
  | 'rgba(0,0,255)'
  | 'rgba(0,128,0)'
  | 'rgba(255,0,0)'
  | 'rgba(240,240,240)';

export type StrokeWidth = number;


export interface Point {
  x: number;
  y: number;
}

export interface FreehandShape {
  type: 'pen' | 'eraser';
  path: SkPath;
  points: Point[];  // để lưu các điểm mà pen đi qua rồi chuyển qua json dễ hơn 
  strokeWidth: StrokeWidth;
  color: Color;
}

export interface BasicShape  {
  type: 'rectangle' | 'line' | 'oval';
  start: Point;
  end: Point;
  strokeWidth: StrokeWidth;
  color: Color;
}

export type Shape = FreehandShape | BasicShape ;
