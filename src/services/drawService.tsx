import { doc, setDoc, getDoc, updateDoc, arrayUnion, Timestamp, query, where, collection, getDocs, deleteDoc, arrayRemove   } from "firebase/firestore"; 
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

export async function deleteDraw(drawId: string, userId: string) {
  const drawDocRef = doc(db, 'Draws', drawId);
  await deleteDoc(drawDocRef);

  const userRef = doc(db, 'Users', userId);
  
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // Nếu có, thì xoá drawId khỏi drawIds
    await updateDoc(userRef, {
      drawIds: arrayRemove(drawId),
    });
  } else {
    console.warn(` User với ID ${userId} chưa tồn tại trong Users collection.`);
    // (Không làm gì thêm hoặc tuỳ bạn muốn tạo document trống hay báo lỗi)
  }
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

    if (querySnapshot.empty) {
      console.log("Không có bản vẽ nào thuộc userId này");
      return [];
    }

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
