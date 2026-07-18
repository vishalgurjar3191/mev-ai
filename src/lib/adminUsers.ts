import { collection, getDocs, doc, updateDoc, query, orderBy, limit as fbLimit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile } from '../types';

/**
 * Pulls the most recent users. For a small/medium user base this simple approach is fine;
 * if MEV AI grows a lot, switch this to paginated queries (startAfter) instead of one big list.
 */
export async function listUsers(max = 200): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), fbLimit(max)));
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function setUserBanned(uid: string, banned: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { banned });
}

export async function setUserRole(uid: string, role: 'user' | 'admin'): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { role });
}

export async function setUserPlan(uid: string, plan: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { plan });
}
