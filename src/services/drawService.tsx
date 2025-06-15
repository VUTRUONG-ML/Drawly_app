import { doc, setDoc, getDoc, updateDoc, arrayUnion, Timestamp, query, where, collection, getDocs   } from "firebase/firestore"; 
import { db } from './firebase';
import { shapeToJSON, jsonToShape } from '../utils/shapeConverter';
import type { Shape } from '../types';


export async function saveDraw(
  userId: string ,
  drawId: string,
  drawName: string,
  drawData: Shape[],
  imgId: string | null,
){
  const drawDocRef = doc(db, 'Draws', drawId);
  const userDocRef = doc(db, 'Users', userId);

  const shapeData = drawData.map(shapeToJSON);
  await setDoc(drawDocRef, {
    drawId,
    drawName,
    drawData: shapeData,
    imgId: null,
    userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await setDoc(userDocRef, {
    userId,
    drawIds: arrayUnion(drawId),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }, { merge: true });
}


export async function updateDraw(
  drawId: string,
  drawData: Shape[],
  imgId: string | null,
){
  const drawDocRef = doc(db, 'Draws', drawId);

  const shapeData = drawData.map(shapeToJSON);
  await updateDoc(drawDocRef, {
    drawId,
    drawData: shapeData,
    imgId: imgId ?? null,
    updatedAt: Timestamp.now(),
  });

}


export async function loadDraw(userId: string | null, drawId: string): Promise<Shape[]> {
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

export async function getDrawsByUser(userId: string): Promise<{ drawId: string, drawName: string }[]> {
  try {
    const drawsRef = collection(db, "Draws");
    const q = query(drawsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const result: { drawId: string, drawName: string }[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      result.push({
        drawId: doc.id,
        drawName: data.drawName,
      });
    });

    return result;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách Draws:", error);
    return [];
  }
}
