import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.imara.access',
  appName: 'Imara Access',
  webDir: 'dist',
  server: {
    url: 'http://10.157.254.237:20000',
    cleartext: true
  }
};

export default config;
