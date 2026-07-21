import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { oneShotTextCompletion } from './aiClient';
import { ChatMessage } from '../hooks/useChat';

const MAX_MEMORY_CHARS = 2000;

/**
 * Runs after a chat ends (e.g. when the user starts a new one) — asks the model to merge
 * whatever it already knew about this user with anything new/lasting from this conversation,
 * and saves a compact summary back to their profile. This is what makes MEV AI "remember"
 * across separate chats, not just within one.
 *
 * Deliberately best-effort: memory is a nice-to-have, so any failure here is swallowed rather
 * than surfaced to the user — a chat should never break because memory summarization failed.
 */
export async function updateMemoryFromChat(uid: string, existingMemory: string | undefined, messages: ChatMessage[]): Promise<void> {
  if (!uid) return;
  const realMessages = messages.filter((m) => !m.error && m.content.trim());
  if (realMessages.length < 2) return; // too short to be worth remembering

  try {
    const transcript = realMessages
      .slice(-20) // last 20 messages is plenty of context, keeps the summarization call cheap
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const instruction = `You maintain a compact long-term memory about a user for an AI assistant. Below is what you already know (may be empty) and a new conversation transcript. Produce an UPDATED memory: merge in any new lasting facts (name, preferences, ongoing projects, interests, important context), drop anything now outdated, and keep it under ${MAX_MEMORY_CHARS} characters as short bullet points. Do NOT include one-off details that don't matter later (like a single arithmetic question). Output ONLY the updated memory bullet points, nothing else — no preamble, no explanation.

EXISTING MEMORY:
${existingMemory?.trim() || '(none yet)'}

NEW CONVERSATION:
${transcript}`;

    const updated = await oneShotTextCompletion([{ role: 'user', content: instruction }]);
    const trimmed = updated.trim().slice(0, MAX_MEMORY_CHARS);
    if (trimmed) {
      await updateDoc(doc(db, 'users', uid), { memory: trimmed });
    }
  } catch {
    // Silent — memory is best-effort, never block or error out the chat experience over this.
  }
}
