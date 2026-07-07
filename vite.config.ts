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
        // /auth/** → Gateway → Auth Backend (8081)
        // EXCEPT /auth/callback which is a frontend SPA route
        '/auth': {
          target: gatewayUrl,
          changeOrigin: true,
          bypass(req) {
            const url = req.url ?? '';
            if (url === '/auth/callback' || url.startsWith('/auth/callback?')) {
              return url; // serve the SPA, don't proxy
            }
          },
        },
        // /api/v1/** → Gateway → User Backend (8082)
        '/api/v1': {
          target: gatewayUrl,
          changeOrigin: true,
        },
        // Parches / Events / Location REST → Gateway (injects X-User-Id from the JWT)
        '/api/parches': { target: gatewayUrl, changeOrigin: true },
        '/api/invites': { target: gatewayUrl, changeOrigin: true },
        '/api/events': { target: gatewayUrl, changeOrigin: true },
        '/api/locations': { target: gatewayUrl, changeOrigin: true },
        // Location live geo socket → Gateway → Location MS (STOMP over WS)
        '/ws/geo': { target: gatewayUrl, changeOrigin: true, ws: true },
        // Parqués game backend (8085)
        '/api/games': { target: 'http://localhost:8085', changeOrigin: true },
        '/parques-ws': { target: 'http://localhost:8085', changeOrigin: true, ws: true },
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
