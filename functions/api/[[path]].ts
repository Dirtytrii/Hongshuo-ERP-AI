interface PagesFunctionContext {
  request: Request;
}

export async function onRequest(context: PagesFunctionContext) {
  const req = context.request;
  const url = new URL(req.url);

  const upstream = new URL(url.pathname + url.search, 'http://8.163.60.63.nip.io:9101');

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');

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
