import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { db } from './firebase';
import { shapeToJSON, jsonToShape } from '../utils/shapeConverter';
import type { Shape } from '../types';

export async function saveDraw(userId: string, drawId: string, drawData: Shape[]) {
  const drawDocRef = doc(db, 'Users', userId, 'Draws', drawId);
  const shapesData = drawData.map(shapeToJSON);
  await setDoc(drawDocRef, { drawData: shapesData });
}

export async function loadDraw(userId: string, drawId: string): Promise<Shape[]> {
  const drawDocRef = doc(db, 'Users', userId, 'Draws', drawId);
  const docSnap = await getDoc(drawDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.drawData.map(jsonToShape);
  }
  return [];
}
