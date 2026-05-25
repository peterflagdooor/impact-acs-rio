import { apiClient } from '@/lib/api';
import { KpiCard } from '@/components/kpi-card';
import { PatientRow } from '@/components/patient-card';
import { MapSection } from '@/components/map-section';
import { PressaoTable } from '@/components/pressao-table';
import { InvisivelCounters } from '@/components/invisivel-counters';
import { Users, UserCheck, AlertTriangle, Activity, Bell } from 'lucide-react';

export const dynamic = 'force-dynamic';

const DAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export default async function Dashboard() {
  const [kpis, topPatients, hotspots, equipes, painel, invisiveis] = await Promise.all([
    apiClient.kpis(),
    apiClient.patients({ limit: 12 }),
    apiClient.heatmap().catch(() => []),
    apiClient.equipesSedes().catch(() => []),
    apiClient.gestaoPainel().catch(() => []),
    apiClient.gestaoInvisiveis({ limit: 1 }).catch(() => ({ total: 0, por_categoria: { 1: 0, 2: 0, 3: 0 }, invisiveis: [] })),
  ]);

  const today = new Date();
  const dayLabel = DAYS[today.getDay()];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="t-section-label">Reunião Semanal</p>
          <h1 className="text-3xl font-bold mt-1" style={{ color: 'var(--grey-dark)' }}>
            Inteligência no Território
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--grey-text)' }}>
            Visão do território — {dayLabel}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {/* Notification chip */}
          <div
            className="relative w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}
          >
            <Bell size={16} style={{ color: 'var(--grey-text)' }} />
            {kpis.alertas_abertos > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: 'var(--red)', color: '#fff' }}
              >
                {kpis.alertas_abertos > 9 ? '9+' : kpis.alertas_abertos}
              </span>
            )}
          </div>
          {/* Profile chip */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: 'var(--white)', border: '1px solid var(--grey-card)', color: 'var(--grey-dark)' }}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--blue-primary)', color: '#fff' }}
            >
              A
            </div>
            ACS
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Pacientes Cadastrados"
          value={kpis.total_pacientes.toLocaleString('pt-BR')}
          icon={Users}
        />
        <KpiCard
          label="Pacientes Visitados"
          value={kpis.pacientes_visitados.toLocaleString('pt-BR')}
          hint={`Cobertura ${kpis.cobertura_pct}%`}
          icon={UserCheck}
        />
        <KpiCard
          label="Alertas Abertos"
          value={kpis.alertas_abertos}
          icon={AlertTriangle}
        />
        <KpiCard
          label="Urgências 30d"
          value={kpis.urgencias_30d.toLocaleString('pt-BR')}
          icon={Activity}
        />
      </section>

      {/* Top priorities table + invisíveis */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table takes 2 cols */}
        <div
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--grey-card)' }}>
            <h2 className="font-semibold text-base" style={{ color: 'var(--grey-dark)' }}>
              Top Prioridades
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--grey-text)' }}>
              {topPatients.length} pacientes de maior score
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ background: 'var(--grey-card)', color: 'var(--grey-text)' }}
                >
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Paciente ID</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Faixa</th>
                  <th className="px-4 py-3">Sexo</th>
                  <th className="px-4 py-3">Tags</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {topPatients.map((p, i) => (
                  <PatientRow key={p.paciente_id} patient={p} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Invisíveis */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--grey-card)' }}>
            <h2 className="font-semibold text-base" style={{ color: 'var(--grey-dark)' }}>
              Pacientes Invisíveis
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--grey-text)' }}>
              Total: {invisiveis.total.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="p-4">
            <InvisivelCounters data={invisiveis} />
          </div>
        </div>
      </section>

      {/* Pressão por equipe */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-base" style={{ color: 'var(--grey-dark)' }}>
              Pressão por Equipe
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--grey-text)' }}>
              Ranking de pressão operacional — top 10 equipes
            </p>
          </div>
        </div>
        <PressaoTable painel={painel} limit={10} />
      </section>

      {/* Mapa */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-base" style={{ color: 'var(--grey-dark)' }}>
              Mapa do Território
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--grey-text)' }}>
              Hotspots de urgência · Sedes de equipe · Alcance a pé
            </p>
          </div>
        </div>
        <MapSection hotspots={hotspots} equipes={equipes} />
      </section>
    </div>
  );
}
