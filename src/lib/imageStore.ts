import { collection, addDoc, deleteDoc, doc, getDocs, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface ImageRecord {
  id: string;
  uid: string;
  prompt: string;
  url: string;
  createdAt: number;
}

function toMillis(value: unknown): number {
  return value instanceof Timestamp ? value.toMillis() : Date.now();
}

export async function saveImageRecord(uid: string, prompt: string, url: string): Promise<void> {
  await addDoc(collection(db, 'images'), { uid, prompt, url, createdAt: serverTimestamp() });
}

export async function listImages(uid: string): Promise<ImageRecord[]> {
  const snap = await getDocs(query(collection(db, 'images'), where('uid', '==', uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({
    id: d.id,
    uid: d.data().uid,
    prompt: d.data().prompt,
    url: d.data().url,
    createdAt: toMillis(d.data().createdAt),
  }));
}

export async function deleteImageRecord(id: string): Promise<void> {
  await deleteDoc(doc(db, 'images', id));
}
