import type { Env } from '../server/env';
import { failure, json } from '../server/http';
import type { HealthInfo } from '../shared/api';

// Stage A exposes health only. This is not authentication or tenant authorization.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path !== '/api' && !path.startsWith('/api/')) return env.ASSETS.fetch(request);

    const requestId = crypto.randomUUID();
    let response: Response;
    try {
      if (path.replace(/\/+$/, '') !== '/api/health') {
        response = failure(404, 'API_NOT_FOUND', 'API chưa được triển khai trong Chặng A.', requestId);
      } else if (request.method !== 'GET' && request.method !== 'HEAD') {
        response = failure(405, 'METHOD_NOT_ALLOWED', 'Chỉ hỗ trợ GET và HEAD.', requestId, { Allow: 'GET, HEAD' });
      } else {
        const health: HealthInfo = { status: 'ok', service: 'theo-doi-nhiem-vu-api' };
        response = json(health, requestId);
      }
    } catch {
      console.error('api_request_failed', { requestId });
      response = failure(500, 'INTERNAL_ERROR', 'Không thể xử lý yêu cầu. Vui lòng thử lại.', requestId);
    }
    // Unknown API HEAD requests also retain their status/headers without a body.
    return request.method === 'HEAD'
      ? new Response(null, { status: response.status, headers: response.headers })
      : response;
  },
} satisfies ExportedHandler<Env>;
