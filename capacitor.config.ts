import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nutripulse.app',
  appName: 'NutriPulse',
  webDir: 'dist',
  "plugins": {
    "CapacitorHttp": {
      "enabled": true}}
};

export default config;
