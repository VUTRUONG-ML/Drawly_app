// /src/utils/shapeConverter.ts

import { Skia } from '@shopify/react-native-skia';
import type { Shape, Point } from '../types';

export function shapeToJSON(shape: Shape) {
  if (shape.type === 'pen') {
    return {
      type: 'pen',
      points: shape.points,  // mảng điểm lưu lại
    };
  } else {
    return {
      type: shape.type,
      start: shape.start,
      end: shape.end,
    };
  }
}

export function jsonToShape(obj: any): Shape {
  if (obj.type === 'pen') {
    const path = Skia.Path.Make();
    obj.points.forEach((p: Point, i: number) => {
      if (i === 0) path.moveTo(p.x, p.y);
      else path.lineTo(p.x, p.y);
    });
    return {
      type: 'pen',
      path,
      points: obj.points,
    };
  } else {
    return {
      type: obj.type,
      start: obj.start,
      end: obj.end,
    };
  }
}
