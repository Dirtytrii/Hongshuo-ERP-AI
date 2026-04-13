import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeConstructionData, resolveChatCompletionsUrl } from './deepseekService';

describe('deepseekService OpenAI-compatible endpoint', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it('resolveChatCompletionsUrl defaults to DeepSeek when no baseUrl set', () => {
    delete process.env.OPENROUTER_BASE_URL;
    delete process.env.OPENROUTER_FANS_BASE_URL;
    delete process.env.OPENAI_COMPAT_BASE_URL;
    expect(resolveChatCompletionsUrl()).toBe('https://api.deepseek.com/v1/chat/completions');
  });

  it('resolveChatCompletionsUrl normalizes https://openrouter.fans to /v1/chat/completions', () => {
    process.env.OPENROUTER_BASE_URL = 'https://openrouter.fans';
    expect(resolveChatCompletionsUrl()).toBe('https://openrouter.fans/v1/chat/completions');
  });

  it('resolveChatCompletionsUrl keeps /v1 and appends /chat/completions', () => {
    process.env.OPENROUTER_BASE_URL = 'https://openrouter.fans/v1/';
    expect(resolveChatCompletionsUrl()).toBe('https://openrouter.fans/v1/chat/completions');
  });

  it('analyzeConstructionData uses OPENROUTER_API_KEY when present', async () => {
    process.env.OPENROUTER_BASE_URL = 'https://openrouter.fans';
    process.env.OPENROUTER_API_KEY = 'sk-test';

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'ok' } }],
        }),
    } as Response);

    const result = await analyzeConstructionData('hello', {
      projects: [],
      inventory: [],
      financeRecords: [],
      stockLogs: [],
      projectDocuments: [],
    } as any);

    expect(result).toBe('ok');
    expect(fetch).toHaveBeenCalledWith(
      'https://openrouter.fans/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      })
    );
  });
});
