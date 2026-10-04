import type { CapacitorConfig } from '@capacitor/cli';

// CAP_DEV=1 allows talking to a plain-http dev API (e.g. http://10.0.2.2:3001 on the emulator).
// Production builds stay HTTPS-only.
const dev = process.env.CAP_DEV === '1';

const config: CapacitorConfig = {
  appId: 'dev.launchlane.trajectory',
  appName: 'Trajectory',
  webDir: 'dist',
  backgroundColor: '#0b0e18',
  server: { androidScheme: 'https', cleartext: dev },
  android: { allowMixedContent: dev },
};

export default config;
