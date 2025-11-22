/**
 * Postinstall script for Vercel deployment
 * Removes onnxruntime-node native bindings on serverless environments
 * This forces Transformers.js to use onnxruntime-web (WASM) instead
 */

import { rmSync, existsSync } from 'fs';
import { join } from 'path';

// Only run on Vercel/CI where native modules don't work
const isVercel = process.env.VERCEL === '1';
const isCI = process.env.CI === 'true';

if (isVercel || isCI) {
  console.log('🔧 Postinstall: Removing onnxruntime-node for serverless environment...');

  // Find and remove onnxruntime-node to force WASM fallback
  const nodeModulesPath = join(process.cwd(), 'node_modules');
  const onnxNodePath = join(nodeModulesPath, 'onnxruntime-node');
  const pnpmOnnxNodePath = join(nodeModulesPath, '.pnpm', 'onnxruntime-node@1.21.0');

  // Remove from regular node_modules
  if (existsSync(onnxNodePath)) {
    try {
      rmSync(onnxNodePath, { recursive: true, force: true });
      console.log('  ✅ Removed node_modules/onnxruntime-node');
    } catch (e) {
      console.warn('  ⚠️ Could not remove onnxruntime-node:', e.message);
    }
  }

  // Remove from pnpm store
  if (existsSync(pnpmOnnxNodePath)) {
    try {
      rmSync(pnpmOnnxNodePath, { recursive: true, force: true });
      console.log('  ✅ Removed pnpm onnxruntime-node');
    } catch (e) {
      console.warn('  ⚠️ Could not remove pnpm onnxruntime-node:', e.message);
    }
  }

  console.log('🎉 Postinstall complete - Transformers.js will use WASM backend');
} else {
  console.log('🔧 Postinstall: Local environment - keeping onnxruntime-node for native performance');
}
