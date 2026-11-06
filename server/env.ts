export interface Env {
  APP_ENV?: string;
  // Binding contract for Stage B onward; optional and UNBOUND in Stage A.
  DB?: D1Database;
  DOCUMENTS?: R2Bucket;
}

export interface ApiData extends Record<string, unknown> {
  requestId: string;
}
