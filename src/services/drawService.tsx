import { doc, setDoc, getDoc, updateDoc, arrayUnion, Timestamp, query, where  } from "firebase/firestore"; 
import { db } from './firebase';
import { shapeToJSON, jsonToShape } from '../utils/shapeConverter';
import type { Shape } from '../types';


export async function saveDraw(
  userId: string,
  drawId: string,
  drawName: string,
  drawData: Shape[],
  imgId: string | null,
  email: string,
){
  const drawDocRef = doc(db, 'Draws', drawId);
  const userDocRef = doc(db, 'Users', userId);

  const shapeData = drawData.map(shapeToJSON);
  await setDoc(drawDocRef, {
    drawId,
    drawName,
    drawData: shapeData,
    imgId: null,
    userId
  });

  await setDoc(userDocRef, {
    userId,
    email,
    drawIds: arrayUnion(drawId),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }, { merge: true });
}


export async function loadDraw(userId: string, drawId: string): Promise<Shape[]> {
  const drawDocRef = doc(db, 'Draws', drawId);
  const docSnap = await getDoc(drawDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.userId === userId) {
      return data.drawData.map(jsonToShape);
    }
  }
  return [];
}
