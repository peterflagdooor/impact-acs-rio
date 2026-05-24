import { apiClient } from '@/lib/api';
import { KpiCard } from '@/components/kpi-card';
import { PatientCard } from '@/components/patient-card';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [kpis, topPatients] = await Promise.all([
    apiClient.kpis(),
    apiClient.patients({ limit: 12 }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <p className="t-section-label">Reunião Semanal</p>
        <h1 className="t-section-title">Inteligência no Território</h1>
        <p className="text-sm mt-3 max-w-2xl leading-relaxed" style={{ color: 'var(--grey-text)' }}>
          Visão do território com pacientes priorizados, alertas operacionais
          e concentração de risco. Ferramenta de apoio à decisão na reunião
          semanal da equipe de Saúde da Família.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Pacientes" value={kpis.total_pacientes.toLocaleString('pt-BR')} accent="blue" />
        <KpiCard
          label="Cobertura"
          value={`${kpis.cobertura_pct}%`}
          hint={`${kpis.pacientes_visitados.toLocaleString('pt-BR')} visitados`}
          accent="green"
        />
        <KpiCard label="Alertas abertos" value={kpis.alertas_abertos} accent="red" />
        <KpiCard label="Urgências 30d" value={kpis.urgencias_30d.toLocaleString('pt-BR')} accent="cyan" />
      </section>

      <section>
        <h2 className="text-2xl font-black mb-5" style={{ color: 'var(--blue-secondary)' }}>
          Top 12 prioridades
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topPatients.map(p => <PatientCard key={p.paciente_id} patient={p} />)}
        </div>
      </section>
    </div>
  );
}
