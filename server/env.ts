export interface Env {
  ASSETS: Fetcher;
  APP_ENV?: string;
  // Binding contract for Stage B onward; optional and UNBOUND in Stage A.
  DB?: D1Database;
  DOCUMENTS?: R2Bucket;
}
