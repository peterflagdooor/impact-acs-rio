"""One-shot extractor — gera docs/pitch/data.json com os números do dataset SMS Rio
que aparecem no scrollytelling do pitch.

Roda uma vez. Não roda em runtime. Pacientes nunca aparecem com hash — só ID público
sequencial (#001..#005) e dados clínicos agregados.

Uso:
    python scripts/extract_pitch_data.py
"""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "_inbox" / "data"
OUT = ROOT / "docs" / "pitch" / "data.json"

# Rio bounding box — filtra outliers de geocoding
RIO_LAT = (-23.10, -22.70)
RIO_LNG = (-43.80, -43.10)


def load() -> dict[str, pd.DataFrame]:
    out = {n: pd.read_parquet(DATA_DIR / f"{n}.parquet")
           for n in ["pacientes", "visitas", "eventos_clinicos", "equipes"]}
    out["visitas"]["registrados_em"] = pd.to_datetime(out["visitas"]["registrados_em"])
    out["eventos_clinicos"]["data_referencia"] = pd.to_datetime(
        out["eventos_clinicos"]["data_referencia"]
    )
    return out


def compute_totals(d: dict[str, pd.DataFrame]) -> dict:
    pac = d["pacientes"]
    vis = d["visitas"]
    ids_visitados = set(vis["paciente_id"].unique())
    pac = pac.assign(visitado=pac["paciente_id"].isin(ids_visitados))

    cadastros = len(pac)
    sem_visita = int((~pac["visitado"]).sum())

    idosos_total = int((pac["faixa_etaria"] == "66+").sum())
    idosos_sem_visita = int(((pac["faixa_etaria"] == "66+") & (~pac["visitado"])).sum())

    return {
        "cadastros": cadastros,
        "sem_visita_12m": sem_visita,
        "pct_sem_visita": round(sem_visita / cadastros, 4),
        "idosos_total": idosos_total,
        "idosos_sem_visita": idosos_sem_visita,
        "hipertensos_sem_visita": int(((pac["hipertenso"]) & (~pac["visitado"])).sum()),
        "diabeticos_sem_visita": int(((pac["diabetico"]) & (~pac["visitado"])).sum()),
        "gestantes_sem_visita": int(((pac["gestacao"]) & (~pac["visitado"])).sum()),
        "vulneraveis_sem_visita": int(((pac["situacao_vulnerabilidade"]) & (~pac["visitado"])).sum()),
        "n_equipes": int(pac["equipe_id"].nunique()),
        "visitas_total_ano": int(len(vis)),
    }


def compute_territorio(d: dict[str, pd.DataFrame], top_n: int = 8) -> list[dict]:
    """Clusters de pacientes sem visita por grid ~500m. Retorna top-N para o mapa."""
    pac = d["pacientes"]
    vis = d["visitas"]
    ids_visitados = set(vis["paciente_id"].unique())

    sv = pac[~pac["paciente_id"].isin(ids_visitados)].copy()
    sv = sv[sv["endereco_latitude"].between(*RIO_LAT)
            & sv["endereco_longitude"].between(*RIO_LNG)]

    grid = 0.005  # ~500m
    sv["glat"] = (sv["endereco_latitude"] / grid).round() * grid
    sv["glng"] = (sv["endereco_longitude"] / grid).round() * grid

    clusters = (sv.groupby(["glat", "glng"])
                  .size()
                  .reset_index(name="count")
                  .sort_values("count", ascending=False)
                  .head(top_n))

    return [
        {"lat": round(r.glat, 4), "lng": round(r.glng, 4), "count": int(r.count)}
        for r in clusters.itertuples()
    ]


def compute_top_pacientes(d: dict[str, pd.DataFrame], top_n: int = 5) -> list[dict]:
    """Score composto simples para a cena 'Plano 2 — Decisão'.

    Eixos: clínico (hipertensão+diabetes+gestação+vulnerabilidade),
    temporal (sem visita há 12m = peso máximo),
    gatilho (evento clínico nos últimos 60 dias),
    social (faixa etária 66+).

    Não usamos hash do paciente no output — só posição (1..N) e os atributos
    do dataset. Mantém anonimização forte.
    """
    pac = d["pacientes"]
    vis = d["visitas"]
    ev = d["eventos_clinicos"]

    ids_visitados = set(vis["paciente_id"].unique())
    pac = pac.assign(visitado=pac["paciente_id"].isin(ids_visitados))

    # Janela "60 dias antes do fim do dataset" = gatilho recente
    fim = ev["data_referencia"].max()
    inicio_gatilho = fim - pd.Timedelta(days=60)
    eventos_recentes = set(
        ev[ev["data_referencia"].between(inicio_gatilho, fim)]["paciente_id"].unique()
    )
    pac["gatilho_recente"] = pac["paciente_id"].isin(eventos_recentes)

    def score(row) -> int:
        s = 0
        # Clínico
        if row["hipertenso"]:
            s += 18
        if row["diabetico"]:
            s += 20
        if row["gestacao"]:
            s += 22
        if row["situacao_vulnerabilidade"]:
            s += 14
        # Social
        if row["faixa_etaria"] == "66+":
            s += 16
        elif row["faixa_etaria"] == "45-65":
            s += 6
        # Temporal
        if not row["visitado"]:
            s += 16
        # Gatilho
        if row["gatilho_recente"]:
            s += 14
        return s

    pac["score"] = pac.apply(score, axis=1)

    top = pac.nlargest(top_n, "score")

    out = []
    for i, r in enumerate(top.itertuples(), start=1):
        tags = []
        if r.hipertenso:
            tags.append("hipertenso")
        if r.diabetico:
            tags.append("diabético")
        if r.gestacao:
            tags.append("gestante")
        if r.situacao_vulnerabilidade:
            tags.append("vulnerável")
        if r.faixa_etaria == "66+":
            tags.append("idoso 66+")
        if r.gatilho_recente:
            tags.append("evento recente")
        if not r.visitado:
            tags.append("sem visita 12m")

        out.append({
            "id": f"P-{i:03d}",
            "faixa_etaria": r.faixa_etaria,
            "sexo": r.sexo,
            "score": int(r.score),
            "tags": tags[:3],  # 3 primeiras pra caber visualmente
        })

    return out


def build_payload() -> dict:
    d = load()
    return {
        "totals": compute_totals(d),
        "territorio_top": compute_territorio(d, top_n=8),
        "top_pacientes": compute_top_pacientes(d, top_n=5),
        "exemplo_extracao": {
            "input_whatsapp": (
                "Visitei dona Maria, 72 anos, rua X 123. Tosse seca há 3 dias, "
                "PA 14/9. Pedi pra ir no posto amanhã."
            ),
            "output_json": {
                "paciente": "Maria, 72",
                "sintomas": ["tosse seca 3d"],
                "pressao": "140/90",
                "gravidade": "média",
                "acao": "encaminhamento UBS",
            },
        },
        "exemplo_chat": {
            "pergunta": "Quais idosos da AP3.1 sem visita nos últimos 6 meses?",
            "tool_call": 'query_patients({ ap:"3.1", idade:">=66", sem_visita:"6m" })',
            "resposta_total": 312,
        },
        "extracted_at": datetime.now().strftime("%Y-%m-%d"),
    }


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = build_payload()
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} — {OUT.stat().st_size} bytes")
    print(json.dumps(payload["totals"], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
