import { join } from 'node:path';

export const qaArtifact = (filename = '') => join(process.env.UI_QA_OUTPUT_DIR ?? 'docs/qa/ui-upgrade', filename);
