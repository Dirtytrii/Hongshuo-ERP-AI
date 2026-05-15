import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AppState } from '../types';
import { analyzeConstructionData, analyzeConstructionDataStream, resolveChatCompletionsUrl } from './deepseekService';

describe('deepseekService OpenAI-compatible endpoint', () => {
  const originalEnv = { ...process.env };
  const emptyAppState: AppState = {
    projects: [],
    inventory: [],
    financeRecords: [],
    stockLogs: [],
    projectDocuments: [],
  };

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

  it('resolveChatCompletionsUrl supports OPENROUTER_FANS_BASE_URL', () => {
    process.env.OPENROUTER_FANS_BASE_URL = 'https://openrouter.fans';
    expect(resolveChatCompletionsUrl()).toBe('https://openrouter.fans/v1/chat/completions');
  });

  it('resolveChatCompletionsUrl supports generic OpenAI-compatible baseUrl', () => {
    process.env.OPENAI_COMPAT_BASE_URL = 'https://example.com/api';
    expect(resolveChatCompletionsUrl()).toBe('https://example.com/api/v1/chat/completions');
  });

  it('resolveChatCompletionsUrl prefers OpenRouter baseUrl over fallback compatible URLs', () => {
    process.env.OPENROUTER_BASE_URL = 'https://primary.example.com';
    process.env.OPENROUTER_FANS_BASE_URL = 'https://fans.example.com';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://compat.example.com';
    expect(resolveChatCompletionsUrl()).toBe('https://primary.example.com/v1/chat/completions');
  });

  it('analyzeConstructionData uses OPENROUTER_API_KEY when present', async () => {
    process.env.OPENROUTER_BASE_URL = 'https://openrouter.fans';
    process.env.OPENROUTER_API_KEY = 'sk-test';
    process.env.DEEPSEEK_API_KEY = 'deepseek-key';

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'ok' } }],
        }),
    } as Response);

    const result = await analyzeConstructionData('hello', emptyAppState);

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

  it('analyzeConstructionDataStream uses the same OpenAI-compatible endpoint and key', async () => {
    process.env.OPENROUTER_BASE_URL = 'https://openrouter.fans/v1/';
    process.env.OPENROUTER_API_KEY = 'sk-stream-test';

    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"ok"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body,
    } as Response);

    const onChunk = vi.fn();
    const result = await analyzeConstructionDataStream('hello', emptyAppState, onChunk);

    expect(result).toBe('ok');
    expect(onChunk).toHaveBeenCalledWith('ok');
    expect(fetch).toHaveBeenCalledWith(
      'https://openrouter.fans/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-stream-test',
        }),
      })
    );
  });
});
