import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'node:fs';
import path from 'node:path';

let firebaseConfig: any = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.warn('Could not read firebase-applet-config.json:', err);
}

const projectId = firebaseConfig.projectId || process.env.FIREBASE_PROJECT_ID || 'canvas-nature-dxctm';

if (!getApps().length) {
  initializeApp({
    projectId,
  });
}

export const adminAuth = getAuth();

