import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import 'dotenv/config';

import {
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
