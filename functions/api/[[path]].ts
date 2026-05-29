interface PagesFunctionContext {
  request: Request;
}

export async function onRequest(context: PagesFunctionContext) {
  const req = context.request;
  const url = new URL(req.url);

  const upstream = new URL(url.pathname + url.search, 'http://8.163.60.63.nip.io');

  const headers = new Headers(req.headers);
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

  const response = await fetch(upstream.toString(), {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
  });

  const respHeaders = new Headers(response.headers);
  respHeaders.set('Access-Control-Allow-Origin', url.origin);
  respHeaders.set('Access-Control-Allow-Credentials', 'true');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: respHeaders,
  });
}
