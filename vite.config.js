import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Dev only: serve the Vercel function api/agent.ts at /api/agent from the same `npm run dev`.
// GROQ_* comes from src/.env (an existing environment variable wins) and stays on the server.
function agentApi() {
  return {
    name: 'pip-agent-api',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, fileURLToPath(new URL('./src', import.meta.url)), 'GROQ_'));
      server.middlewares.use('/api/agent', async (req, res) => {
        try {
          const { handle } = await server.ssrLoadModule('/api/agent.ts');
          const ac = new AbortController();
          res.on('close', () => ac.abort()); // visitor closed the chat or the tab mid-reply
          const body = [];
          for await (const chunk of req) body.push(chunk);
          const headers = Object.fromEntries(Object.entries({ 'content-type': req.headers['content-type'], origin: req.headers.origin, 'x-forwarded-for': req.socket.remoteAddress }).filter(([, v]) => v));
          const response = await handle(new Request(`http://${req.headers.host}${req.originalUrl}`, { method: req.method, headers, body: req.method === 'POST' ? Buffer.concat(body) : undefined, signal: ac.signal }));
          res.writeHead(response.status, Object.fromEntries(response.headers));
          if (response.body) Readable.fromWeb(response.body).pipe(res);
          else res.end();
        } catch (err) {
          server.config.logger.error(`[pip-agent-api] ${err?.stack ?? err}`);
          if (!res.headersSent) res.statusCode = 500;
          res.end();
        }
      });
    },
  };
}

// base './' so the build works from any folder (GitHub Pages, Netlify, a sub-path...)
export default defineConfig({ plugins: [react(), agentApi()], base: './' });
