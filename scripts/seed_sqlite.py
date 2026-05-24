"""ETL: Parquet → SQLite + scoring batch inicial.

Roda na raiz do repo:
    .venv/bin/python scripts/seed_sqlite.py

Cria db.sqlite com:
    - 4 tabelas portadas dos Parquets (equipes, pacientes, visitas, eventos_clinicos)
    - 3 tabelas novas (registros_whatsapp, alertas, pacientes_scores)
    - Scoring batch inicial pra todos os pacientes
"""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "_inbox" / "data"
DB_PATH = ROOT / "db.sqlite"
WEIGHTS_PATH = ROOT / "src" / "backend" / "src" / "config" / "scoring-weights.json"


SCHEMA = """
CREATE TABLE IF NOT EXISTS equipes (
  equipe_id           TEXT PRIMARY KEY,
  endereco_latitude   REAL,
  endereco_longitude  REAL
);

CREATE TABLE IF NOT EXISTS pacientes (
  paciente_id               TEXT PRIMARY KEY,
  equipe_id                 TEXT REFERENCES equipes(equipe_id),
  unidade_id                TEXT,
  faixa_etaria              TEXT,
  sexo                      TEXT,
  raca_cor                  TEXT,
  situacao_vulnerabilidade  INTEGER,
  endereco_latitude         REAL,
  endereco_longitude        REAL,
  hipertenso                INTEGER,
  diabetico                 INTEGER,
  gestacao                  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_pacientes_equipe ON pacientes(equipe_id);

CREATE TABLE IF NOT EXISTS visitas (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  profissional_id   TEXT,
  registrados_em    TEXT,
  ordem_visita_dia  INTEGER,
  paciente_id       TEXT REFERENCES pacientes(paciente_id),
  origem            TEXT DEFAULT 'parquet'
);
CREATE INDEX IF NOT EXISTS idx_visitas_paciente ON visitas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_visitas_data ON visitas(registrados_em);

CREATE TABLE IF NOT EXISTS eventos_clinicos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id     TEXT REFERENCES pacientes(paciente_id),
  tipo            TEXT,
  data_referencia TEXT
);
CREATE INDEX IF NOT EXISTS idx_eventos_paciente ON eventos_clinicos(paciente_id);

CREATE TABLE IF NOT EXISTS registros_whatsapp (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  whatsapp_msg_id     TEXT UNIQUE,
  from_number         TEXT,
  profissional_id     TEXT,
  mensagem_texto      TEXT,
  dados_extraidos     TEXT,
  paciente_id         TEXT REFERENCES pacientes(paciente_id),
  status              TEXT DEFAULT 'recebido',
  recebido_em         DATETIME DEFAULT CURRENT_TIMESTAMP,
  processado_em       DATETIME
);

CREATE TABLE IF NOT EXISTS alertas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id   TEXT REFERENCES pacientes(paciente_id),
  tipo          TEXT,
  mensagem      TEXT,
  prioridade    INTEGER DEFAULT 2,
  origem        TEXT,
  criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolvido_em  DATETIME
);
CREATE INDEX IF NOT EXISTS idx_alertas_paciente ON alertas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_alertas_status ON alertas(resolvido_em);

CREATE TABLE IF NOT EXISTS pacientes_scores (
  paciente_id    TEXT PRIMARY KEY REFERENCES pacientes(paciente_id),
  score          REAL,
  fatores        TEXT,
  justificativa  TEXT,
  calculado_em   DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scores_value ON pacientes_scores(score DESC);
"""


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)
    conn.commit()


def port_parquet_to_table(conn: sqlite3.Connection, name: str) -> int:
    df = pd.read_parquet(DATA_DIR / f"{name}.parquet")
    for col in df.columns:
        if df[col].dtype == bool:
            df[col] = df[col].astype(int)
    for col in df.columns:
        if "date" in col.lower() or "registrados_em" in col or "data_referencia" in col:
            df[col] = pd.to_datetime(df[col]).dt.strftime("%Y-%m-%d")
    df.to_sql(name, conn, if_exists="replace", index=False, method="multi", chunksize=500)
    return len(df)


def load_weights() -> dict:
    with open(WEIGHTS_PATH) as f:
        return json.load(f)


def compute_score(
    paciente: dict,
    ultima_visita: str | None,
    eventos: list[dict],
    weights: dict,
    today: datetime,
) -> tuple[float, list[str]]:
    fatores: list[str] = []
    total = 0.0
    f = weights["factors"]

    if paciente.get("gestacao"):
        fatores.append("gestante")
        total += f["clinical"]["gestante"]
    if paciente.get("faixa_etaria") == "0-6":
        fatores.append("crianca_0_6")
        total += f["clinical"]["crianca_0_6"]
    h, d = bool(paciente.get("hipertenso")), bool(paciente.get("diabetico"))
    if h and d:
        fatores.append("hipertenso_e_diabetico")
        total += f["clinical"]["hipertenso_e_diabetico"]
    elif h or d:
        fatores.append("hipertenso_xor_diabetico")
        total += f["clinical"]["hipertenso_xor_diabetico"]
    if paciente.get("faixa_etaria") == "66+":
        fatores.append("idoso_66_mais")
        total += f["clinical"]["idoso_66_mais"]

    if paciente.get("situacao_vulnerabilidade"):
        fatores.append("situacao_vulnerabilidade")
        total += f["social"]["situacao_vulnerabilidade"]

    if ultima_visita is None:
        fatores.append("sem_visita_180_mais")
        total += f["temporal"]["sem_visita_180_mais"]
    else:
        dt = datetime.strptime(ultima_visita, "%Y-%m-%d")
        dias = (today - dt).days
        if dias > 180:
            fatores.append("sem_visita_180_mais")
            total += f["temporal"]["sem_visita_180_mais"]
        elif dias > 90:
            fatores.append("sem_visita_90_a_180")
            total += f["temporal"]["sem_visita_90_a_180"]
        elif dias > 30:
            fatores.append("sem_visita_30_a_90")
            total += f["temporal"]["sem_visita_30_a_90"]

    urgencias = [
        datetime.strptime(e["data_referencia"], "%Y-%m-%d")
        for e in eventos
        if e["tipo"] == "urgencia-emergencia-ou-internacao"
    ]
    if urgencias:
        ultima_urg = max(urgencias)
        dias = (today - ultima_urg).days
        if dias < 30:
            fatores.append("urgencia_menor_30d")
            total += f["gatilho"]["urgencia_menor_30d"]
        elif dias < 90:
            fatores.append("urgencia_30_a_90d")
            total += f["gatilho"]["urgencia_30_a_90d"]

    agendamentos_proximos = [
        datetime.strptime(e["data_referencia"], "%Y-%m-%d")
        for e in eventos
        if e["tipo"] == "agendamento"
        and 0 <= (datetime.strptime(e["data_referencia"], "%Y-%m-%d") - today).days <= 14
    ]
    if agendamentos_proximos:
        fatores.append("agendamento_proximo_14d")
        total += f["gatilho"]["agendamento_proximo_14d"]

    return min(total, weights["max_score"]), fatores


def _columns(conn: sqlite3.Connection, table: str) -> list[str]:
    return [r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()]


def batch_scoring(conn: sqlite3.Connection) -> int:
    weights = load_weights()
    today = datetime(2025, 12, 31)

    pacientes = {row[0]: dict(zip(_columns(conn, "pacientes"), row))
                 for row in conn.execute("SELECT * FROM pacientes")}

    ultima_visita = dict(
        conn.execute(
            "SELECT paciente_id, MAX(registrados_em) FROM visitas GROUP BY paciente_id"
        ).fetchall()
    )

    eventos_por_pac: dict[str, list[dict]] = {}
    for pid, tipo, data in conn.execute(
        "SELECT paciente_id, tipo, data_referencia FROM eventos_clinicos"
    ):
        eventos_por_pac.setdefault(pid, []).append({"tipo": tipo, "data_referencia": data})

    rows = []
    for pid, paciente in pacientes.items():
        score, fatores = compute_score(
            paciente,
            ultima_visita.get(pid),
            eventos_por_pac.get(pid, []),
            weights,
            today,
        )
        rows.append((pid, score, json.dumps(fatores), None))

    conn.executemany(
        "INSERT OR REPLACE INTO pacientes_scores (paciente_id, score, fatores, justificativa) VALUES (?, ?, ?, ?)",
        rows,
    )
    conn.commit()
    return len(rows)


def main() -> int:
    if DB_PATH.exists():
        print(f"Removendo db.sqlite existente em {DB_PATH}")
        DB_PATH.unlink()

    conn = sqlite3.connect(str(DB_PATH))
    init_schema(conn)

    for name in ["equipes", "pacientes", "visitas", "eventos_clinicos"]:
        n = port_parquet_to_table(conn, name)
        print(f"  {name}: {n:,} linhas")

    print("\nCalculando scoring inicial pra todos os pacientes...")
    n_scores = batch_scoring(conn)
    print(f"  pacientes_scores: {n_scores:,} linhas")

    print("\nTop 5 scores:")
    for row in conn.execute(
        "SELECT paciente_id, score, fatores FROM pacientes_scores ORDER BY score DESC LIMIT 5"
    ):
        print(f"  {row[0][:12]}... → {row[1]:.0f}  fatores={row[2]}")

    conn.close()
    print(f"\n✅ db.sqlite pronto em {DB_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
