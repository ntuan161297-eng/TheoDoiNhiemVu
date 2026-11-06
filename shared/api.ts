export interface ApiSuccess<T> {
  ok: true;
  data: T;
  requestId: string;
}

export interface ApiFailure {
  ok: false;
  error: { code: string; message: string };
  requestId: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export interface HealthInfo {
  service: 'theo-doi-nhiem-vu';
  stage: 'A';
  mode: 'ui-mock';
  environment: 'development' | 'staging' | 'production' | 'unknown';
  time: { iso: string; businessDate: string; timeZone: 'Asia/Ho_Chi_Minh' };
  // Not a database/storage/Auth readiness check. These are intentionally deferred.
  dependencies: { database: 'not-enabled'; storage: 'not-enabled'; authentication: 'not-enabled' };
}
