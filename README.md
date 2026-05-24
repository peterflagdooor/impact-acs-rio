# ACS Inteligente — Apoio à reunião semanal das equipes de Saúde da Família

> Submissão para o **Claude Impact Lab Rio 2026** — tema saúde pública (Inteligência no Território).

## Equipe

- **Peter Flag** ([@peterflagdooor](https://github.com/peterflagdooor))
- *(adicionar demais membros do time aqui antes da submissão final)*

## Tema

Saúde pública — **Inteligência no Território** (apoio aos Agentes Comunitários de Saúde do Rio de Janeiro).

## Resumo da solução

Mini-ERP web institucional (visual SMS Rio) que apoia a **reunião semanal** da equipe de Saúde da Família (médico, enfermeiro, ACS) com três frentes integradas:

1. **Ingestão via WhatsApp** — ACS manda texto pós-visita; Claude extrai sintomas, alertas e ações; sistema atualiza paciente em segundos. *Reduz a fricção do "caderninho do ACS".*
2. **Dashboard de priorização** — pacientes ordenados por score composto (4 eixos: clínico, social, temporal, gatilho), heatmap territorial de urgências, marcação de sedes das equipes com isócronas a pé (10/15 min) via OpenRouteService.
3. **Chat IA contextual** — durante a reunião semanal, qualquer membro da equipe pergunta em linguagem natural ("Quem precisa de visita amanhã na equipe X?", "Quantas gestantes sem visita recente?") e o Claude consulta o banco em tempo real via tool use.

**Justificativa do impacto** (baseado em EDA do dataset, ver [docs/analise-completa-dataset-saude.md](docs/analise-completa-dataset-saude.md)):

- **50% dos cadastros nunca foram visitados em 1 ano** (48.838 de 97.938)
- **54.4% dos pacientes pós-urgência demoram +30 dias por followup** (mediana 36d)
- **43% dos pacientes são "fantasma"** — sem visita E sem evento clínico no ano
- **12.636 idosos 66+** sem visita

## Arquitetura

```
ACS no campo ──► WhatsApp ──► Twilio Sandbox ──► ngrok webhook ──► Backend Hono
                                                                      │
                                                                      ▼
                                                  Claude Haiku 4.5 (extração estruturada)
                                                                      │
                                                                      ▼
                                                          Supabase Postgres
                                                                      │
                                            ┌────── score recompute por paciente ──────┐
                                            ▼                                            ▼
                                Dashboard Next.js                              Chat IA (Claude Sonnet 4.6)
                                  + Leaflet heatmap                              via tool use whitelist
                                  + ORS isochrones                                 (4 ferramentas read-only)
```

**Como o Claude foi usado:**
- **Extração estruturada** de mensagem livre do ACS (Haiku 4.5) → JSON com sintomas, alertas, ações
- **Chat com tool use** (Sonnet 4.6) — 4 ferramentas read-only: `query_patients`, `query_alerts`, `query_kpis`, `query_group_stats`. Claude decide quais chamar e como compor a resposta.

**Stack:**
- Frontend: Next.js 16 (App Router) + Tailwind v4 + Cera Pro + Leaflet + brand institucional Prefeitura Rio
- Backend: Node 20 + TypeScript + Hono + `postgres` (porsager)
- Banco: Supabase Postgres (`Hackaton-Claude-Impact`, us-east-1) — schema versionado em `supabase/migrations/`
- IA: Anthropic Claude (Sonnet 4.6 + Haiku 4.5) via `@anthropic-ai/sdk`
- WhatsApp: Twilio SDK direto (sandbox)
- Mapa: Leaflet + OpenStreetMap + ORS isochrones (proxy backend)
- Dados originais: 4 Parquets anonimizados (SMS Rio) carregados no Supabase

## Como rodar localmente

```bash
# 1. Clone e setup
git clone https://github.com/peterflagdooor/impact-acs-rio.git
cd impact-acs-rio

# 2. Configurar .env por subapp (copiar templates e preencher com credenciais reais)
cp src/backend/.env.example  src/backend/.env       # ANTHROPIC + TWILIO + ORS + DATABASE_URL (Supabase)
cp src/frontend/.env.example src/frontend/.env.local

# 3. Aplicar schema no Supabase (ver supabase/migrations/)
supabase link --project-ref <seu-project-ref>
supabase db push

# 4. Backend (porta 3001)
cd src/backend && npm install && npm run dev &

# 5. Frontend (porta 3000)
cd ../frontend && npm install && npm run dev &

# 6. Webhook público pro Twilio (terminal separado)
ngrok http 3001
# atualizar Twilio Console → Sandbox webhook URL pra https://<id>.ngrok.io/webhook/whatsapp
```

> **Sobre os dados:** o schema está versionado em `supabase/migrations/`. Os dados originais (Parquets em `_inbox/data/`) foram carregados uma única vez no Supabase durante o desenvolvimento. Pra re-popular do zero a partir dos Parquets, o histórico em `git log` antes do commit de cleanup tem o script de import (`scripts/migrate_sqlite_to_supabase.py`).

Abrir [http://localhost:3000](http://localhost:3000).

## Documentação

- [Spec do MVP](docs/superpowers/specs/2026-05-24-mvp-acs-design.md) — design completo
- [Plano de implementação](docs/superpowers/plans/2026-05-24-mvp-acs-implementation.md)
- [Análise completa do dataset](docs/analise-completa-dataset-saude.md) — quantitativa + qualitativa
- [Briefing oficial do desafio](_inbox/briefing-acs-vulnerabilidade.md)
- [Transcrição do Q&A com SMS-Rio](_inbox/transcricao-qa-sms-rio.md)

## Roadmap (próximas evoluções)

- **Áudio**: aceitar voice notes do WhatsApp (Whisper para transcrição, depois Claude para extração)
- **Família como entidade**: ACS confirma família em campo via WhatsApp, sistema passa a operar família-cêntrico (já temos calibração técnica em `scripts/eda_completo.py`)
- **Integração com Vitacare**: export/import com o prontuário oficial da SMS Rio
- **Roteirização otimizada** com OpenRouteService routing (já temos a key configurada, faltou tempo no MVP)
- **Multi-tenant**: várias unidades de saúde com isolamento de dados
- **Mobile-first**: PWA específica pro ACS (hoje canal é WhatsApp + dashboard no laptop da reunião)

## Demo

*(adicionar link de aplicação deployada OU vídeo de 60s aqui antes da submissão)*
