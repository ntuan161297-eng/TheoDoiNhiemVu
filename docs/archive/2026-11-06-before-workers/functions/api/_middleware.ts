import type { ApiData, Env } from '../../server/env';
import { failure } from '../../server/http';

// This is an infrastructure boundary, NOT completed authentication/authorization.
// Only health is public in Stage A. Every other API path stays closed until Stage B.
export const onRequest: PagesFunction<Env, string, ApiData> = async context => {
  const requestId = crypto.randomUUID();
  context.data.requestId = requestId;
  let response: Response;
  try {
    const path = new URL(context.request.url).pathname.replace(/\/+$/, '');
    response = path === '/api/health'
      ? await context.next()
      : failure(404, 'API_NOT_FOUND', 'API chưa được triển khai trong Chặng A.', requestId);
  } catch {
    console.error('api_request_failed', { requestId });
    response = failure(500, 'INTERNAL_ERROR', 'Không thể xử lý yêu cầu. Vui lòng thử lại.', requestId);
  }
  const headers = new Headers(response.headers);
  headers.set('X-Request-Id', requestId);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(context.request.method === 'HEAD' ? null : response.body, { status: response.status, headers });
};
