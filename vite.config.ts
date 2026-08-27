import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

import aitDevtools from '@apps-in-toss/devtools/unplugin';

function webPwaHeadPlugin(): Plugin {
  let base = '/';

  return {
    name: 'sim-bwatta-web-pwa-head',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml() {
      return [
        {
          tag: 'link',
          attrs: { rel: 'manifest', href: `${base}manifest.webmanifest` },
          injectTo: 'head',
        },
        {
          tag: 'link',
          attrs: { rel: 'apple-touch-icon', href: `${base}icons/icon-192.png` },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { name: 'application-name', content: '심봤다' },
          injectTo: 'head',
        },
      ];
    },
  };
}

export default defineConfig(({ mode }) => {
  const isWebPwa = mode === 'web-pwa';

  return {
    publicDir: isWebPwa ? 'public' : false,
    plugins: [
      ...(isWebPwa ? [webPwaHeadPlugin()] : [aitDevtools.vite()]),
      react(),
    ],
  };
});
