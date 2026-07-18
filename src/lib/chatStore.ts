import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface ChatMessageDoc {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface ChatSummary {
  id: string;
  uid: string;
  title: string;
  saved: boolean;
  updatedAt: number;
  createdAt: number;
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  return Date.now();
}

export async function createChat(uid: string, title: string): Promise<string> {
  const ref = await addDoc(collection(db, 'chats'), {
    uid,
    title: title.slice(0, 60),
    saved: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function appendMessage(chatId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    role,
    content,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'chats', chatId), { updatedAt: serverTimestamp() });
}

export async function listChats(uid: string, savedOnly = false): Promise<ChatSummary[]> {
  const snap = await getDocs(query(collection(db, 'chats'), where('uid', '==', uid)));
  let results = snap.docs.map((d) => ({
    id: d.id,
    uid: d.data().uid,
    title: d.data().title,
    saved: !!d.data().saved,
    updatedAt: toMillis(d.data().updatedAt),
    createdAt: toMillis(d.data().createdAt),
  }));
  if (savedOnly) results = results.filter((r) => r.saved);
  return results.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadMessages(chatId: string): Promise<ChatMessageDoc[]> {
  const snap = await getDocs(query(collection(db, 'chats', chatId, 'messages')));
  return snap.docs
    .map((d) => ({ id: d.id, role: d.data().role, content: d.data().content, createdAt: toMillis(d.data().createdAt) }))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function toggleSaved(chatId: string, saved: boolean): Promise<void> {
  await setDoc(doc(db, 'chats', chatId), { saved }, { merge: true });
}

export async function deleteChat(chatId: string): Promise<void> {
  const messagesSnap = await getDocs(collection(db, 'chats', chatId, 'messages'));
  await Promise.all(messagesSnap.docs.map((m) => deleteDoc(m.ref)));
  await deleteDoc(doc(db, 'chats', chatId));
}
