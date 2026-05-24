/**
 * Roteirização nearest-neighbor a partir da sede da equipe.
 * Portado de inteligencia-no-territorio/projeto/pipeline/routing.py.
 * Distancia: Haversine (km).
 */

export interface Ponto {
  lat: number;
  lon: number;
}

export function haversineKm(a: Ponto, b: Ponto): number {
  const R = 6371.0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Retorna os indices de `pontos` na ordem de visita (NN a partir de `origem`).
 */
export function nearestNeighborOrder(origem: Ponto, pontos: Ponto[]): number[] {
  const restantes = new Set<number>(pontos.map((_, i) => i));
  const rota: number[] = [];
  let atual = origem;

  while (restantes.size > 0) {
    let melhor = -1;
    let melhorDist = Infinity;
    for (const i of restantes) {
      const d = haversineKm(atual, pontos[i]);
      if (d < melhorDist) {
        melhorDist = d;
        melhor = i;
      }
    }
    rota.push(melhor);
    atual = pontos[melhor];
    restantes.delete(melhor);
  }

  return rota;
}

export interface RotaItem<T> {
  ordem_visita: number;
  paciente: T;
  distancia_anterior_km: number;
  distancia_acumulada_km: number;
}

/**
 * Ordena `candidatos` (cada um com `endereco_latitude`/`endereco_longitude`)
 * em uma rota NN a partir da sede. Retorna lista enriquecida.
 */
export function buildRota<T extends { endereco_latitude: number; endereco_longitude: number }>(
  sede: Ponto,
  candidatos: T[],
): RotaItem<T>[] {
  if (candidatos.length === 0) return [];

  const pontos: Ponto[] = candidatos.map(c => ({ lat: c.endereco_latitude, lon: c.endereco_longitude }));
  const ordem = nearestNeighborOrder(sede, pontos);

  const itens: RotaItem<T>[] = [];
  let acumulado = 0;
  let anterior: Ponto = sede;

  ordem.forEach((idx, i) => {
    const p = candidatos[idx];
    const ponto: Ponto = { lat: p.endereco_latitude, lon: p.endereco_longitude };
    const d = haversineKm(anterior, ponto);
    acumulado += d;
    itens.push({
      ordem_visita: i + 1,
      paciente: p,
      distancia_anterior_km: Math.round(d * 100) / 100,
      distancia_acumulada_km: Math.round(acumulado * 100) / 100,
    });
    anterior = ponto;
  });

  return itens;
}
