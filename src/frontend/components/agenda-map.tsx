'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Agenda } from '@/lib/api';

interface Props {
  agenda: Agenda;
}

export function AgendaMap({ agenda }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Leaflet marca o DIV com _leaflet_id quando inicializa. Em StrictMode dev
    // e HMR o effect re-roda e o container pode chegar aqui ainda marcado.
    // Limpa antes pra evitar "Map container is being reused".
    const container = containerRef.current as HTMLDivElement & { _leaflet_id?: number };
    if (container._leaflet_id != null) {
      delete container._leaflet_id;
    }

    const map = L.map(containerRef.current);
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CartoDB',
      maxZoom: 19,
    }).addTo(map);

    const pts: [number, number][] = [
      [agenda.sede.lat, agenda.sede.lon],
      ...agenda.agenda.map(a => [a.endereco_latitude, a.endereco_longitude] as [number, number]),
    ];

    map.fitBounds(pts, { padding: [30, 30] });

    // Sede — white circle with purple ring
    L.circleMarker([agenda.sede.lat, agenda.sede.lon], {
      radius: 10,
      color: '#682EC7',
      weight: 3,
      fillColor: '#ffffff',
      fillOpacity: 0.95,
    })
      .addTo(map)
      .bindTooltip('Sede da equipe', { permanent: false });

    // Linha da rota (tracejada)
    L.polyline(pts, {
      color: '#682EC7',
      weight: 3,
      opacity: 0.55,
      dashArray: '6,8',
    }).addTo(map);

    // Pontos numerados
    agenda.agenda.forEach(a => {
      const color =
        a.prioridade === 'CRITICO'
          ? '#dc3545'
          : a.prioridade === 'URGENTE'
            ? '#fd7e14'
            : a.prioridade === 'ATENCAO'
              ? '#ffc107'
              : '#28a745';

      const html = `<div style="
        background:${color};
        color:white;
        width:28px;height:28px;
        border-radius:50%;
        border:2px solid white;
        box-shadow:0 1px 4px rgba(0,0,0,.35);
        display:flex;align-items:center;justify-content:center;
        font-weight:900;font-size:13px;font-family:sans-serif;
      ">${a.ordem_visita}</div>`;

      const icon = L.divIcon({
        html,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([a.endereco_latitude, a.endereco_longitude], { icon })
        .addTo(map)
        .bindTooltip(
          `Visita ${a.ordem_visita} · ${a.prioridade ?? 'ROTINA'} · ${a.distancia_anterior_km.toFixed(2)} km`,
          { permanent: false }
        );
    });

    return () => {
      map.remove();
      mapRef.current = null;
      // Limpa marca Leaflet do DIV pra próxima montagem não reutilizar instância
      const c = container as HTMLDivElement & { _leaflet_id?: number };
      if (c._leaflet_id != null) delete c._leaflet_id;
    };
  }, [agenda]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden"
      style={{ height: '420px', border: '1px solid rgba(255,255,255,0.06)' }}
    />
  );
}
