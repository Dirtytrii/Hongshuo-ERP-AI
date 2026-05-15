import { AppState } from '../types';

const DEFAULT_CHAT_COMPLETIONS_URL = 'https://api.deepseek.com/v1/chat/completions';
const CHAT_COMPLETIONS_PATH = '/v1/chat/completions';

/** 推荐模型：deepseek-chat — 通用对话、性价比高、适合决策室数据分析 */
const DEFAULT_MODEL = 'deepseek-chat';

export function resolveChatCompletionsUrl(): string {
  const baseUrl =
    process.env.OPENROUTER_BASE_URL?.trim() ||
    process.env.OPENROUTER_FANS_BASE_URL?.trim() ||
    process.env.OPENAI_COMPAT_BASE_URL?.trim();

  if (!baseUrl) {
    return DEFAULT_CHAT_COMPLETIONS_URL;
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  if (normalizedBaseUrl.endsWith(CHAT_COMPLETIONS_PATH)) {
    return normalizedBaseUrl;
  }
  if (normalizedBaseUrl.endsWith('/v1')) {
    return `${normalizedBaseUrl}/chat/completions`;
  }
  return `${normalizedBaseUrl}${CHAT_COMPLETIONS_PATH}`;
}

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim() || process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY 或 DEEPSEEK_API_KEY 未设置。请在项目根目录 .env 或 .env.local 中配置可用的 AI API Key'
    );
  }
  return apiKey;
}

function buildPrompt(query: string, data: AppState): string {
  return `
你是一名专业的施工数据与战略顾问，为「宏硕建设」提供分析。

以下是公司当前业务数据的 JSON：

【项目状态】
${JSON.stringify(data.projects, null, 2)}

【库存】
${JSON.stringify(data.inventory, null, 2)}

【财务记录】
${JSON.stringify(data.financeRecords, null, 2)}

【最近出入库（最多 20 条）】
${JSON.stringify(data.stockLogs.slice(0, 20), null, 2)}

【项目资料库（最多 200 条）】
${JSON.stringify((data.projectDocuments || []).slice(0, 200), null, 2)}

---
用户问题：「${query}」
---

请基于以上数据做简明分析：涉及财务时计算利润与现金流；涉及库存时结合项目进度看缺料风险；涉及资料库时优先引用相关单据来源（contract/change_order/reimbursement/finance/loan/loan_repayment）；涉及策略时给出可执行建议。回答请条理清晰，用要点或加粗标出关键数字，不要直接贴原始 JSON。
`.trim();
}

/**
 * 使用 DeepSeek 分析施工/业务数据，供 AI 决策室使用。
 * 模型：deepseek-chat（通用、高性价比）
 */
export const analyzeConstructionData = async (query: string, data: AppState): Promise<string> => {
  try {
    const prompt = buildPrompt(query, data);

    const apiKey = getApiKey();
    const res = await fetch(resolveChatCompletionsUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 8192,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMessage = errText;
      try {
        const errJson = JSON.parse(errText);
        errMessage = (errJson as { error?: { message?: string } }).error?.message ?? errText;
      } catch {
        // keep errText
      }
      const err = new Error(errMessage) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim() || '分析已完成，但未返回内容。';
    return content;
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    const status = err?.status;
    const safeMessage = err?.message != null ? String(err.message).slice(0, 500) : '';
    console.error('DeepSeek 分析失败:', error);

    const is429 =
      status === 429 ||
      safeMessage.includes('429') ||
      safeMessage.includes('rate') ||
      safeMessage.includes('quota') ||
      safeMessage.includes('limit');
    if (is429) {
      return '请求过于频繁或配额已用尽（429）。请稍后再试，或到 DeepSeek 控制台查看用量：https://platform.deepseek.com/usage';
    }
    return '分析时发生错误，请确认 API Key 有效后重试。若问题持续，请查看控制台错误信息。';
  }
};

/** 流式分析：每收到一块内容调用 onChunk(delta)，最后返回完整文本 */
export const analyzeConstructionDataStream = async (
  query: string,
  data: AppState,
  onChunk: (textDelta: string) => void
): Promise<string> => {
  try {
    const prompt = buildPrompt(query, data);
    const apiKey = getApiKey();
    const res = await fetch(resolveChatCompletionsUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user' as const, content: prompt }],
        max_tokens: 8192,
        stream: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMessage = errText;
      try {
        const errJson = JSON.parse(errText);
        errMessage = (errJson as { error?: { message?: string } }).error?.message ?? errText;
      } catch {
        // keep errText
      }
      const err = new Error(errMessage) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;
          try {
            const obj = JSON.parse(dataStr) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = obj.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta) {
              fullText += delta;
              onChunk(delta);
            }
          } catch {
            // skip malformed chunk
          }
        }
      }
    }
    return fullText.trim() || '分析已完成，但未返回内容。';
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    const status = err?.status;
    const safeMessage = err?.message != null ? String(err.message).slice(0, 500) : '';
    console.error('DeepSeek 流式分析失败:', error);
    const is429 =
      status === 429 ||
      safeMessage.includes('429') ||
      safeMessage.includes('rate') ||
      safeMessage.includes('quota') ||
      safeMessage.includes('limit');
    if (is429) {
      return '请求过于频繁或配额已用尽（429）。请稍后再试，或到 DeepSeek 控制台查看用量：https://platform.deepseek.com/usage';
    }
    return '分析时发生错误，请确认 API Key 有效后重试。若问题持续，请查看控制台错误信息。';
  }
};
