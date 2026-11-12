import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: false,
  },
  resolve: {
    // Tesseract.js v6 is a CJS package. Vite/esbuild pre-bundling does not
    // automatically apply the package.json "browser" field remapping for CJS
    // modules, so the Node.js worker (using worker_threads / child_process) is
    // resolved instead of the browser Worker implementation. This alias
    // explicitly redirects both the short and absolute forms of the node worker
    // path to the browser worker, preventing the DataCloneError caused by the
    // wrong runtime adapter being loaded at bundle time.
    alias: [
      {
        // Matches the bare specifier used in createWorker.js: require('./worker/node')
        find: /.*\/tesseract\.js\/src\/worker\/node(\/index\.js)?$/,
        replacement: path.resolve(
          __dirname,
          'node_modules/tesseract.js/src/worker/browser/index.js',
        ),
      },
    ],
  },
  optimizeDeps: {
    // Force esbuild to pre-bundle tesseract.js so the alias above is applied
    // during dependency optimisation as well.
    include: ['tesseract.js'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
  },
});

