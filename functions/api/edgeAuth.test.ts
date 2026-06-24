import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from './[[path]]';

function request(path: string, init?: RequestInit) {
  return new Request(`https://hongshuo-erp-ai.pages.dev${path}`, init);
}

describe('pages API proxy auth guard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('rejects unauthenticated business API requests before proxying upstream', async () => {
    const response = await onRequest({ request: request('/api/projects') });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: '未登录' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps login public and proxies it upstream', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 'token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const response = await onRequest({
      request: request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'secret' }),
      }),
    });

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      'https://api-hongshuo.dingai.site/api/auth/login',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('rejects historical default login credentials before proxying upstream', async () => {
    const response = await onRequest({
      request: request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '123456' }),
      }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: '默认密码已禁用，请联系管理员重置密码' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects forged bearer tokens when auth check fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: '登录已过期' }), { status: 401 }));

    const response = await onRequest({
      request: request('/api/projects', {
        headers: { Authorization: 'Bearer forged-token' },
      }),
    });

    expect(response.status).toBe(401);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api-hongshuo.dingai.site/api/auth/me',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('blocks non-admin users from admin-only endpoints at the proxy layer', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ role: 'pm' }), { status: 200 }));

    const response = await onRequest({
      request: request('/api/permissions', {
        headers: { Authorization: 'Bearer pm-token' },
      }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: '无权限' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('allows role-authorized requests through to upstream', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ role: 'pm' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 201 }));

    const response = await onRequest({
      request: request('/api/projects', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer pm-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'codex-security-probe' }),
      }),
    });

    expect(response.status).toBe(201);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith(
      'https://api-hongshuo.dingai.site/api/projects',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('rejects non-localhost HTTP upstream origins from environment config', async () => {
    const response = await onRequest({
      request: request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'secret' }),
      }),
      env: { UPSTREAM_ORIGIN: 'http://api.example.com' },
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Invalid upstream origin' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('allows localhost HTTP upstream origins for local development', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ token: 'token' }), { status: 200 }));

    const response = await onRequest({
      request: request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'secret' }),
      }),
      env: { UPSTREAM_ORIGIN: 'http://localhost:8080' },
    });

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/auth/login',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns 404 for debug API paths without hitting upstream', async () => {
    const response = await onRequest({ request: request('/api/v3/api-docs') });

    expect(response.status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not reflect disallowed CORS origins', async () => {
    const response = await onRequest({
      request: request('/api/projects', {
        headers: { Origin: 'https://evil.example' },
      }),
    });

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://hongshuo-erp-ai.pages.dev');
  });
});
