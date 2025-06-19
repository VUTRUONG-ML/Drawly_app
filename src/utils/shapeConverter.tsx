// /src/utils/shapeConverter.ts

import { Skia } from '@shopify/react-native-skia';
import type { Shape, Point } from '../types';

export function shapeToJSON(shape: Shape) {
  if (shape.type === 'pen' || shape.type === 'eraser') {
    return {
      type: shape.type,
      points: shape.points,
      color: shape.color,
      strokeWidth: shape.strokeWidth,
    };
  } else if (shape.type === 'rectangle' || shape.type === 'line' || shape.type === 'oval') {
    return {
      type: shape.type,
      start: shape.start,
      end: shape.end,
      color: shape.color,
      strokeWidth: shape.strokeWidth,
    };
  }
}

export function jsonToShape(obj: any): Shape {
  if (obj.type === 'pen' || obj.type === 'eraser') {
    const path = Skia.Path.Make();
    obj.points.forEach((p: Point, i: number) => {
      if (i === 0) path.moveTo(p.x, p.y);
      else path.lineTo(p.x, p.y);
    });
    return {
      type: obj.type,
      path,
      points: obj.points,
      color: obj.color,
      strokeWidth: obj.strokeWidth,
    };
  } else {
    return {
      type: obj.type,
      start: obj.start,
      end: obj.end,
      color: obj.color,
      strokeWidth: obj.strokeWidth,
    };
  }
}