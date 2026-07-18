export type PlanTier = 'free' | 'pro' | 'premium' | 'business';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: PlanTier;
  chatsUsedToday: number;
  chatsResetAt: number;
  role: 'user' | 'admin';
  banned: boolean;
  createdAt: number;
  notificationsEnabled?: boolean;
  language?: string;
  theme?: 'matte' | 'amoled' | 'light' | 'auto';
  preferredVoice?: string;
}

export interface AuthFormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  priceINR: number;
  chatLimitPerDay: number | null; // null = unlimited
  features: string[];
  active: boolean;
  sortOrder: number;
}

export interface AdminVoiceConfig {
  id: string;
  label: string;
  gender: 'male' | 'female';
  elevenLabsVoiceId: string;
  active: boolean;
}
