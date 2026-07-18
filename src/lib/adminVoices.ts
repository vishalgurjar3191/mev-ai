import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AdminVoiceConfig } from '../types';

const voicesCol = collection(db, 'voices');

export async function listAdminVoices(): Promise<AdminVoiceConfig[]> {
  const snap = await getDocs(voicesCol);
  return snap.docs.map((d) => ({ ...(d.data() as AdminVoiceConfig), id: d.id })).filter((v) => v.active);
}

export async function saveAdminVoice(voice: AdminVoiceConfig): Promise<void> {
  await setDoc(doc(db, 'voices', voice.id), voice);
}

export async function deleteAdminVoice(voiceId: string): Promise<void> {
  await deleteDoc(doc(db, 'voices', voiceId));
}
