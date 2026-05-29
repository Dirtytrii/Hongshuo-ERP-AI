interface PagesFunctionContext {
  request: Request;
}

export async function onRequest(context: PagesFunctionContext) {
  const url = new URL(context.request.url);

  const upstream = new URL(url.pathname + url.search, 'http://8.163.60.63:9101');

  const headers = new Headers(context.request.headers);
  headers.set('Host', '8.163.60.63:9101');

  const response = await fetch(upstream.toString(), {
    method: context.request.method,
    headers,
    body: context.request.method === 'GET' || context.request.method === 'HEAD' ? undefined : context.request.body,
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
