import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.miapp.finanzas',
  appName: 'MiFinanzas',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  }
};

export default config;
