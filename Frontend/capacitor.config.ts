import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.imara.access',
  appName: 'Imara Access',
  webDir: 'dist',
  server: {
    url: 'http://192.168.1.114:20000',
    cleartext: true
  }
};

export default config;
