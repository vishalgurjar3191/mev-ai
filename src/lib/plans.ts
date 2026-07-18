import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plan } from '../types';

const plansCol = collection(db, 'plans');

export async function listPlans(): Promise<Plan[]> {
  const snap = await getDocs(query(plansCol, orderBy('sortOrder', 'asc')));
  return snap.docs.map((d) => ({ ...(d.data() as Plan), id: d.id }));
}

export async function savePlan(plan: Plan): Promise<void> {
  await setDoc(doc(db, 'plans', plan.id), plan);
}

export async function deletePlan(planId: string): Promise<void> {
  await deleteDoc(doc(db, 'plans', planId));
}

/** Seed data to write once from the admin panel if the plans collection is empty. */
export const DEFAULT_PLANS: Plan[] = [
  { id: 'free', name: 'Free', tier: 'free', priceINR: 0, chatLimitPerDay: 20, features: ['20 chats/day', 'Device voice'], active: true, sortOrder: 0 },
  { id: 'pro', name: 'Pro', tier: 'pro', priceINR: 199, chatLimitPerDay: 200, features: ['200 chats/day', 'Realistic voice', 'Priority responses'], active: true, sortOrder: 1 },
  { id: 'premium', name: 'Premium', tier: 'premium', priceINR: 499, chatLimitPerDay: null, features: ['Unlimited chats', 'Realistic voice', 'Priority responses', 'Early access features'], active: true, sortOrder: 2 },
];
