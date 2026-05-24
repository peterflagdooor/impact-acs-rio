import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import 'dotenv/config';

import { getKpis } from './lib/db.js';
import { recomputeAndSave } from './lib/scoring.js';

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/', (c) => c.json({ status: 'ok', service: 'impact-acs-backend' }));

app.get('/api/kpis', (c) => {
  try {
    return c.json(getKpis());
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.post('/api/score/recompute/:id', (c) => {
  const id = c.req.param('id');
  try {
    return c.json(recomputeAndSave(id));
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }
});

const port = Number(process.env.PORT ?? 3001);
console.log(`🚀 Backend rodando em http://localhost:${port}`);
serve({ fetch: app.fetch, port });
