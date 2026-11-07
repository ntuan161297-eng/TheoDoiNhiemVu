import { businessToday } from '../../src/domain';
import type { HealthInfo } from '../../shared/api';
import type { ApiData, Env } from '../../server/env';
import { failure, success } from '../../server/http';

export const onRequest: PagesFunction<Env, string, ApiData> = ({ request, env, data }) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return failure(405, 'METHOD_NOT_ALLOWED', 'Chỉ hỗ trợ GET và HEAD.', data.requestId, { Allow: 'GET, HEAD' });
  }
  const now = new Date();
  const info: HealthInfo = {
    service: 'theo-doi-nhiem-vu', stage: 'A', mode: 'ui-mock',
    environment: env.APP_ENV === 'development' || env.APP_ENV === 'staging' || env.APP_ENV === 'production' ? env.APP_ENV : 'unknown',
    time: { iso: now.toISOString(), businessDate: businessToday(now), timeZone: 'Asia/Ho_Chi_Minh' },
    dependencies: { database: 'not-enabled', storage: 'not-enabled', authentication: 'not-enabled' },
  };
  return success(info, data.requestId);
};
