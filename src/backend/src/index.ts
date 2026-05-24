import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import 'dotenv/config';

import {
  db,
  getKpis,
  listPatients,
  getPatient,
  getPatientVisits,
  getPatientEvents,
  getPatientAlerts,
  getOpenAlerts,
  getTerritoryHeatmap,
} from './lib/db.js';
import { recomputeAndSave } from './lib/scoring.js';
import { getIsochrones } from './lib/ors.js';
import { webhook } from './routes/webhook.js';
import { chat } from './routes/chat.js';

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

app.get('/api/patients', (c) => {
  try {
    const equipe_id = c.req.query('equipe_id');
    const score_min = c.req.query('score_min');
    const limit = c.req.query('limit');
    const offset = c.req.query('offset');
    const patients = listPatients({
      equipe_id: equipe_id ?? undefined,
      scoreMin: score_min ? Number(score_min) : undefined,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
    return c.json(patients);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.get('/api/patients/:id', (c) => {
  const id = c.req.param('id');
  try {
    const paciente = getPatient(id);
    if (!paciente) return c.json({ error: 'Not found' }, 404);
    const visitas = getPatientVisits(id);
    const eventos = getPatientEvents(id);
    const alertas = getPatientAlerts(id);
    return c.json({ paciente, visitas, eventos, alertas });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.get('/api/alerts', (c) => {
  try {
    return c.json(getOpenAlerts(100));
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.get('/api/territory/heatmap', (c) => {
  try {
    return c.json(getTerritoryHeatmap());
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.get('/api/territory/equipes', (c) => {
  try {
    const rows = db.prepare(`
      SELECT equipe_id, endereco_latitude AS lat, endereco_longitude AS lng,
             (SELECT COUNT(*) FROM pacientes WHERE equipe_id = e.equipe_id) AS n_pacientes
      FROM equipes e
      WHERE endereco_latitude BETWEEN -23.5 AND -22.5
        AND endereco_longitude BETWEEN -43.9 AND -43.0
    `).all();
    return c.json(rows);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.post('/api/territory/isochrones', async (c) => {
  try {
    const { lat, lng, ranges_min } = await c.req.json<{ lat: number; lng: number; ranges_min?: number[] }>();
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return c.json({ error: 'lat e lng numéricos obrigatórios' }, 400);
    }
    const seconds = (ranges_min ?? [10, 15]).map(m => m * 60);
    const data = await getIsochrones(lat, lng, seconds, 'foot-walking');
    return c.json(data);
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

app.route('/webhook', webhook);
app.route('/api/chat', chat);

app.post('/api/extract', async (c) => {
  const { text } = await c.req.json();
  try {
    const { extractMessage } = await import('./lib/extract.js');
    const data = await extractMessage(text);
    return c.json(data);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

const port = Number(process.env.PORT ?? 3001);
console.log(`🚀 Backend rodando em http://localhost:${port}`);
serve({ fetch: app.fetch, port });
