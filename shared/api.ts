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
  status: 'ok';
  service: 'theo-doi-nhiem-vu-api';
}
