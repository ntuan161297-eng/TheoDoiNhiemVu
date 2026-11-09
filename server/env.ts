export interface Env {
  ASSETS: Fetcher;
  APP_ENV?: string;
  // B1.3 binds only the approved D1 TEST in isolated Worker Previews.
  // Production stays unbound; no business endpoints before B2 authentication.
  DB?: D1Database;
  DOCUMENTS?: R2Bucket;
}
