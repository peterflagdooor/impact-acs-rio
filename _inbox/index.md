# `_inbox/` — Índice

Pasta de **drops brutos** do hackathon Claude Impact (saúde). Tudo que cai aqui fica fora do git, mas indexado neste arquivo para o Claude conseguir localizar contexto rapidamente.

## Convenções

- Cada arquivo entra com nome descritivo em kebab-case: `<categoria>-<assunto>.<ext>`.
- Após adicionar um arquivo, registrar uma linha na tabela abaixo (1 linha por arquivo, ~150 chars).
- Não renomear nem editar conteúdo bruto. Se precisar de versão limpa/processada, salvar como `<nome>-clean.<ext>` ou levar para `scripts/`.
- Para datasets versionáveis (CSV/Parquet baixados do Google Drive), preferir manter em `_inbox/data/` e indexar aqui.

## Arquivos indexados

| Arquivo | Categoria | Origem | Conteúdo essencial |
|---|---|---|---|
| [transcricao-apresentacao-problema.md](transcricao-apresentacao-problema.md) | Briefing | Apresentação ao vivo (Carol Tarento + Pedro, SMS-Rio) | Contexto ACS, escala (6.2k agentes, 4.5M pessoas), populações prioritárias, descrição dos 5 datasets, técnicas de anonimização |
| [data/equipes.parquet](data/equipes.parquet) | Dataset | Google Drive (claude-impact-lab-saude) | 49 equipes, lat/lng da sede. ~6 KB |
| [data/pacientes.parquet](data/pacientes.parquet) | Dataset | Google Drive (claude-impact-lab-saude) | 97.938 pacientes, 12 colunas (demográficos + comorbidades + endereço). ~8.4 MB |
| [data/eventos_clinicos.parquet](data/eventos_clinicos.parquet) | Dataset | Google Drive (claude-impact-lab-saude) | 100.503 eventos, 2 tipos (`agendamento`, `urgencia-emergencia-ou-internacao`). ~5.5 MB |
| [data/visitas.parquet](data/visitas.parquet) | Dataset | Google Drive (claude-impact-lab-saude) | 159.599 visitas, 3.531 profissionais, 365 dias. ~7.3 MB |

## EDA rápido

Rodar EDA inicial sobre os 4 datasets:

```bash
.venv/bin/python scripts/eda_initial.py
```

## Referências externas (clones em `_refs/`)

- [_refs/claude-impact-lab-rio/](../_refs/claude-impact-lab-rio/) — instruções gerais, regras, agenda, critérios de julgamento
- [_refs/claude-impact-lab-saude/](../_refs/claude-impact-lab-saude/) — dataset, dicionário de dados, links de download (Parquet no Google Drive), referências de anonimização
