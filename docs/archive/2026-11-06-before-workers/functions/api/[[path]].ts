import type { ApiData, Env } from '../../server/env';
import { failure } from '../../server/http';

// Unknown API requests must return JSON 404 rather than the React SPA shell.
export const onRequest: PagesFunction<Env, string, ApiData> = ({ data }) =>
  failure(404, 'API_NOT_FOUND', 'Không tìm thấy API.', data.requestId);
