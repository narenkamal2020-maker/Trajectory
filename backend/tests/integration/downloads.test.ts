import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import type { Express } from 'express';

process.env.NODE_ENV = 'test';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'traj-dl-'));
process.env.DOWNLOADS_DIR = dir;

let app: Express;
beforeAll(async () => {
  fs.writeFileSync(path.join(dir, 'trajectory-android-1.2.apk'), Buffer.alloc(2048, 1));
  fs.writeFileSync(path.join(dir, 'trajectory-desktop-windows-1.2.0.exe'), Buffer.alloc(4096, 2));
  fs.writeFileSync(path.join(dir, 'secret.env'), 'JWT_SECRET=nope');
  const { createApp } = await import('../../src/app');
  app = createApp();
});
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('app downloads', () => {
  it('lists only installer files, without authentication', async () => {
    const r = await request(app).get('/api/downloads');
    expect(r.status).toBe(200);
    expect(r.body.map((d: any) => d.platform).sort()).toEqual(['android', 'windows']);
    const apk = r.body.find((d: any) => d.platform === 'android');
    expect(apk).toMatchObject({ version: '1.2', sizeBytes: 2048, url: '/api/downloads/trajectory-android-1.2.apk' });
  });

  it('serves the APK as an attachment with the Android MIME type', async () => {
    const r = await request(app).get('/api/downloads/trajectory-android-1.2.apk');
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toContain('application/vnd.android.package-archive');
    expect(r.headers['content-disposition']).toContain('attachment');
    expect(Number(r.headers['content-length'])).toBe(2048);
  });

  it('refuses non-installer files and path traversal', async () => {
    expect((await request(app).get('/api/downloads/secret.env')).status).toBe(404);
    expect((await request(app).get('/api/downloads/..%2F..%2F.env')).status).toBe(404);
    expect((await request(app).get('/api/downloads/%2e%2e%5c.env')).status).toBe(404);
  });
});
