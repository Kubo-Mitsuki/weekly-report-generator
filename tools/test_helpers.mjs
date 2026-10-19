import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import PptxGenJS from 'pptxgenjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURE_DIR = path.join(dir, '..', 'test', 'fixtures');

export function fixtures() {
  return readdirSync(FIXTURE_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => ({ name: f, data: JSON.parse(readFileSync(path.join(FIXTURE_DIR, f), 'utf8')) }));
}

// build(pptx) を呼んで .pptx のバイト列を返す
export async function render(build) {
  const pptx = new PptxGenJS();
  build(pptx);
  return pptx.write({ outputType: 'nodebuffer' });
}
