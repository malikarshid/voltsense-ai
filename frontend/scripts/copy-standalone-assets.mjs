import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const standaloneDir = path.join(rootDir, '.next', 'standalone');
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(standaloneDir, 'public');

try {
  if (!fs.existsSync(standaloneDir)) {
    console.log('[copy-standalone-assets] Standalone directory not found (running in non-standalone mode). Skipping.');
    process.exit(0);
  }

  // 1. Copy .next/static -> .next/standalone/.next/static
  if (fs.existsSync(staticSrc)) {
    if (fs.existsSync(staticDest)) {
      fs.rmSync(staticDest, { recursive: true, force: true });
    }
    fs.mkdirSync(path.dirname(staticDest), { recursive: true });
    fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
    console.log('[copy-standalone-assets] Cleanly synchronized .next/static -> .next/standalone/.next/static');
  } else {
    console.warn('[copy-standalone-assets] Warning: .next/static source directory does not exist.');
  }

  // 2. Copy public -> .next/standalone/public
  if (fs.existsSync(publicSrc)) {
    if (fs.existsSync(publicDest)) {
      fs.rmSync(publicDest, { recursive: true, force: true });
    }
    fs.mkdirSync(publicDest, { recursive: true });
    fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
    console.log('[copy-standalone-assets] Cleanly synchronized public -> .next/standalone/public');
  } else {
    console.log('[copy-standalone-assets] Note: public/ source directory not present.');
  }
} catch (error) {
  console.error('[copy-standalone-assets] Error during static asset synchronization:', error);
  process.exit(1);
}
