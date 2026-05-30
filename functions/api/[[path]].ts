interface PagesFunctionContext {
  request: Request;
}

const UPSTREAM_ORIGIN = 'http://api-hongshuo.dingai.site';
const DEFAULT_PUBLIC_ORIGIN = 'https://hongshuo-erp-ai.pages.dev';
const ALLOWED_ORIGINS = new Set([
  DEFAULT_PUBLIC_ORIGIN,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
]);

type AuthenticatedUser = {
  role?: string;
};

const HISTORICAL_DEFAULT_USERNAMES = new Set(['admin', 'pm', 'finance', 'clerk']);

export async function onRequest(context: PagesFunctionContext) {
  const req = context.request;
  const url = new URL(req.url);
  const corsHeaders = buildCorsHeaders(req, url);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (isDebugPath(url.pathname)) {
    return jsonResponse({ error: 'Not Found' }, 404, corsHeaders);
  }

  const defaultCredentialResponse = await rejectHistoricalDefaultCredentials(req, url.pathname, corsHeaders);
  if (defaultCredentialResponse) {
    return defaultCredentialResponse;
  }

  if (!isPublicApiRoute(req.method, url.pathname)) {
    const user = await authenticate(req);
    if (!user) {
      return jsonResponse({ error: '未登录' }, 401, corsHeaders);
    }
    if (!isRoleAllowed(req.method, url.pathname, user.role)) {
      return jsonResponse({ error: '无权限' }, 403, corsHeaders);
    }
  }

  const upstream = new URL(url.pathname + url.search, UPSTREAM_ORIGIN);

  const headers = new Headers(req.headers);
  stripHopByHopHeaders(headers);

  const response = await fetch(upstream.toString(), {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
  });

  const respHeaders = new Headers(response.headers);
  corsHeaders.forEach((value, key) => respHeaders.set(key, value));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: respHeaders,
  });
}

function isPublicApiRoute(method: string, pathname: string): boolean {
  const normalizedPath = normalizePath(pathname);
  return method.toUpperCase() === 'POST' && normalizedPath === '/api/auth/login';
}

async function rejectHistoricalDefaultCredentials(
  req: Request,
  pathname: string,
  corsHeaders: Headers
): Promise<Response | null> {
  if (!isPublicApiRoute(req.method, pathname)) {
    return null;
  }

  const body = (await req
    .clone()
    .json()
    .catch(() => null)) as { username?: unknown; password?: unknown } | null;
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (HISTORICAL_DEFAULT_USERNAMES.has(username) && password === '123456') {
    return jsonResponse({ error: '默认密码已禁用，请联系管理员重置密码' }, 401, corsHeaders);
  }

  return null;
}

function isDebugPath(pathname: string): boolean {
  const normalizedPath = normalizePath(pathname);
  return (
    normalizedPath === '/api/swagger-ui.html' ||
    normalizedPath === '/api/swagger-ui' ||
    normalizedPath.startsWith('/api/swagger-ui/') ||
    normalizedPath === '/api/v3/api-docs' ||
    normalizedPath.startsWith('/api/v3/api-docs/') ||
    normalizedPath === '/api/actuator' ||
    normalizedPath.startsWith('/api/actuator/')
  );
}

async function authenticate(req: Request): Promise<AuthenticatedUser | null> {
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const authCheckResponse = await fetch(new URL('/api/auth/me', UPSTREAM_ORIGIN).toString(), {
    method: 'GET',
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
    },
  }).catch(() => null);

  if (!authCheckResponse?.ok) {
    return null;
  }

  return (await authCheckResponse.json().catch(() => null)) as AuthenticatedUser | null;
}

function isRoleAllowed(method: string, pathname: string, role?: string): boolean {
  const normalizedMethod = method.toUpperCase();
  const normalizedPath = normalizePath(pathname);
  const normalizedRole = role?.trim().toLowerCase() ?? '';

  if (isAdminOnlyPath(normalizedPath)) {
    return normalizedRole === 'admin';
  }

  if (normalizedMethod === 'DELETE' && startsWithApiPrefix(normalizedPath, '/api/projects')) {
    return normalizedRole === 'admin';
  }
  if (
    (normalizedMethod === 'POST' || normalizedMethod === 'PUT') &&
    startsWithApiPrefix(normalizedPath, '/api/projects')
  ) {
    return normalizedRole === 'admin' || normalizedRole === 'pm';
  }

  if (normalizedMethod === 'DELETE' && startsWithApiPrefix(normalizedPath, '/api/contracts')) {
    return normalizedRole === 'admin';
  }
  if (
    (normalizedMethod === 'POST' || normalizedMethod === 'PUT') &&
    startsWithApiPrefix(normalizedPath, '/api/contracts')
  ) {
    return normalizedRole === 'admin' || normalizedRole === 'pm';
  }

  if (
    (normalizedMethod === 'DELETE' || normalizedMethod === 'PUT') &&
    startsWithApiPrefix(normalizedPath, '/api/inventory')
  ) {
    return normalizedRole === 'admin' || normalizedRole === 'pm';
  }
  if (normalizedMethod === 'POST' && startsWithApiPrefix(normalizedPath, '/api/inventory')) {
    return normalizedRole === 'admin' || normalizedRole === 'pm' || normalizedRole === 'clerk';
  }

  return true;
}

function isAdminOnlyPath(pathname: string): boolean {
  return (
    startsWithApiPrefix(pathname, '/api/config') ||
    startsWithApiPrefix(pathname, '/api/data') ||
    startsWithApiPrefix(pathname, '/api/users') ||
    startsWithApiPrefix(pathname, '/api/roles') ||
    startsWithApiPrefix(pathname, '/api/permissions') ||
    startsWithApiPrefix(pathname, '/api/logs')
  );
}

function startsWithApiPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function buildCorsHeaders(req: Request, url: URL): Headers {
  const requestOrigin = req.headers.get('Origin');
  const allowOrigin =
    requestOrigin && (ALLOWED_ORIGINS.has(requestOrigin) || requestOrigin === url.origin)
      ? requestOrigin
      : url.origin || DEFAULT_PUBLIC_ORIGIN;

  return new Headers({
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    Vary: 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
  });
}

function jsonResponse(body: Record<string, unknown>, status: number, headers: Headers): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
}

function stripHopByHopHeaders(headers: Headers) {
  [
    'host',
    'origin',
    'referer',
    'accept-encoding',
    'content-length',
    'cf-connecting-ip',
    'cf-ew-via',
    'cf-ipcountry',
    'cf-ray',
    'cf-visitor',
    'cdn-loop',
    'forwarded',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-port',
    'x-forwarded-proto',
    'x-real-ip',
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
  ].forEach((header) => headers.delete(header));
}
