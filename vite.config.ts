import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gatewayUrl = env.VITE_API_URL || 'http://localhost:8080';

  return {
    plugins: [
      figmaAssetResolver(),
      react(),
      tailwindcss(),
    ],
    server: {
      port: 3000,
      proxy: {
  '/auth': {
    target: gatewayUrl,
    changeOrigin: true,
    bypass(req) {
      const url = req.url ?? '';
      if (url === '/auth/callback' || url.startsWith('/auth/callback?')) {
        return url;
      }
    },
  },
  '/api/v1': {
    target: gatewayUrl,
    changeOrigin: true,
  },
  // Parches MS directo
  '/api/parches': {
    target: 'http://localhost:8083',
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq, req) => {
        const auth = req.headers['authorization'];
        if (auth?.startsWith('Bearer ')) {
          try {
            const payload = auth.split('.')[1];
            const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
            if (decoded.sub) proxyReq.setHeader('X-User-Id', decoded.sub);
          } catch { /* ignore */ }
        }
      });
    },
  },
  '/api/invites': {
    target: 'http://localhost:8083',
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq, req) => {
        const auth = req.headers['authorization'];
        if (auth?.startsWith('Bearer ')) {
          try {
            const payload = auth.split('.')[1];
            const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
            if (decoded.sub) proxyReq.setHeader('X-User-Id', decoded.sub);
          } catch { /* ignore */ }
        }
      });
    },
  },
  '/api/events':    { target: gatewayUrl, changeOrigin: true },
  '/api/locations': { target: gatewayUrl, changeOrigin: true },
  // Comunicación MS directo
  '/api/chat':  { target: gatewayUrl, changeOrigin: true },
  '/api/voice': { target: gatewayUrl, changeOrigin: true },
  '/ws-stomp':  { target: 'http://localhost:8084', changeOrigin: true, ws: true },
  '/ws/geo':    { target: gatewayUrl, changeOrigin: true, ws: true },
  '/api/games': { target: 'http://localhost:8085', changeOrigin: true },
  '/parques-ws':{ target: 'http://localhost:8085', changeOrigin: true, ws: true },
},
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
  };
});
