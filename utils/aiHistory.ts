/** 单条消息 */
export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** 一个会话 */
export interface AiSession {
  id: string;
  title: string;
  messages: AiMessage[];
  createdAt: number;
}

export const STORAGE_KEY_PREFIX = 'erp_ai_history_';
export const MAX_SESSIONS = 10;

export function getHistoryKey(userId: number | undefined): string {
  return `${STORAGE_KEY_PREFIX}${userId ?? 'anon'}`;
}

export function loadSessions(userId: number | undefined): AiSession[] {
  try {
    const key = getHistoryKey(userId);
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AiSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(userId: number | undefined, sessions: AiSession[]): void {
  try {
    const key = getHistoryKey(userId);
    localStorage.setItem(key, JSON.stringify(sessions));
  } catch (e) {
    console.warn('aiHistory saveSessions failed', e);
  }
}

/** 生成会话标题：取首条用户消息前 20 字 */
export function sessionTitleFromMessages(messages: AiMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser?.content?.trim()) return '新对话';
  const t = firstUser.content.trim();
  return t.length <= 20 ? t : t.slice(0, 20) + '…';
}

/**
 * 将会话追加或更新到列表，并按 createdAt 保留最多 MAX_SESSIONS 条（删最旧的）。
 * 返回新列表（已排序：最新在前），并会写回 localStorage。
 */
export function appendOrUpdateSession(
  userId: number | undefined,
  currentSessions: AiSession[],
  session: AiSession
): AiSession[] {
  const list = currentSessions.filter((s) => s.id !== session.id);
  list.unshift(session);
  const trimmed = list.sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_SESSIONS);
  saveSessions(userId, trimmed);
  return trimmed;
}

/**
 * 从历史中移除指定会话并写回 localStorage。返回新列表。
 */
export function removeSession(
  userId: number | undefined,
  currentSessions: AiSession[],
  sessionId: string
): AiSession[] {
  const next = currentSessions.filter((s) => s.id !== sessionId);
  saveSessions(userId, next);
  return next;
}
