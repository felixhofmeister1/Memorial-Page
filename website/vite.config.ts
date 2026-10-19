import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';

// Nothing on the built page may load from anywhere else, and nothing may leave the browser.
// (Only in the build: the dev server needs a websocket for live reload.)
const CSP = [
  "default-src 'self'",
  "img-src 'self' blob: data:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self' blob: data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
  };
}

// Relative asset paths, so the built site works at any address
// (GitHub Pages serves it from /Memorial-Page/).
export default defineConfig({
  base: './',
  plugins: [preact(), contentSecurityPolicy()],
  build: { target: 'es2022', assetsInlineLimit: 0 },
});
