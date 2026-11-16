/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Content-Security-Policy: the browser refuses any request to another origin,
 * so sensitive text can never leave the machine even if a dependency tried.
 * 'wasm-unsafe-eval' is needed later for the in-browser NER model (ONNX/WASM).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')

// Dev server additionally needs inline scripts (React refresh preamble) and the HMR websocket.
const DEV_CSP = CSP.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'").replace(
  "connect-src 'self' blob:",
  'connect-src \'self\' blob: ws://localhost:* ws://127.0.0.1:*',
)

/** Bake the strict CSP into the built index.html as a meta tag. */
function cspMeta(): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
  }
}

export default defineConfig({
  plugins: [react(), cspMeta()],
  server: { host: 'localhost', headers: { 'Content-Security-Policy': DEV_CSP } },
  preview: { host: 'localhost', headers: { 'Content-Security-Policy': CSP } },
  test: { include: ['tests/**/*.test.ts'] },
})
