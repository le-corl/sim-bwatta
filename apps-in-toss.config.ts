import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'sim-bwatta',
  brand: {
    primaryColor: '#332B24',
  },
  permissions: [],
  webView: {
    allowsBackForwardNavigationGestures: false,
  },
  webBundleDir: 'dist',
});
