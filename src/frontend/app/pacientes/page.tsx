import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { PatientRow } from '@/components/patient-card';

export const dynamic = 'force-dynamic';

const FILTROS = [
  { score_min: 80,  label: 'Crítico (80+)',  bg: '#fce4e6',                     color: '#9b1c28', border: 'rgba(220,53,69,0.30)'  },
  { score_min: 50,  label: 'Urgente (50+)',  bg: 'rgba(253,126,20,0.12)',        color: '#8d4a0c', border: 'rgba(253,126,20,0.30)' },
  { score_min: 20,  label: 'Atenção (20+)',  bg: 'rgba(255,193,7,0.12)',         color: '#856404', border: 'rgba(255,193,7,0.35)'  },
  { score_min: 0,   label: 'Todos',          bg: 'var(--grey-card)',             color: 'var(--grey-text)', border: 'var(--grey-mid)' },
];

const PAGE_SIZE = 25;

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ score_min?: string; limit?: string; page?: string }>;
}) {
  const params = await searchParams;
  const scoreMin = params.score_min !== undefined ? Number(params.score_min) : 50;
  const page = params.page ? Math.max(1, Number(params.page)) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const patients = await apiClient.patients({ score_min: scoreMin, limit: PAGE_SIZE, offset });
  const totalForBadge = patients.length; // can show more with a full count endpoint later

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="t-section-label">Pacientes</p>
          <h1 className="text-3xl font-bold mt-1" style={{ color: 'var(--grey-dark)' }}>
            Lista Priorizada
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--grey-text)' }}>
            Ordenados pelo eixo composto — score ≥ {scoreMin}
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(f => {
          const isActive = scoreMin === f.score_min;
          return (
            <Link
              key={f.score_min}
              href={`/pacientes?score_min=${f.score_min}`}
              className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all"
              style={{
                background: isActive ? f.bg : 'var(--white)',
                color: isActive ? f.color : 'var(--grey-text)',
                borderColor: isActive ? f.border : 'var(--grey-card)',
              }}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--grey-card)' }}>
          <p className="font-semibold text-sm" style={{ color: 'var(--grey-dark)' }}>
            {totalForBadge} resultado{totalForBadge !== 1 ? 's' : ''}
          </p>
          {offset > 0 && (
            <p className="text-xs" style={{ color: 'var(--grey-text)' }}>
              Página {page}
            </p>
          )}
        </div>

        {patients.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--grey-text)' }}>
              Nenhum paciente encontrado com esse filtro.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="text-left text-xs font-semibold uppercase tracking-wider border-b"
                  style={{ background: 'var(--grey-card)', color: 'var(--grey-text)', borderColor: 'var(--grey-card)' }}
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
                {patients.map((p, i) => (
                  <PatientRow key={p.paciente_id} patient={p} rank={offset + i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {patients.length === PAGE_SIZE && (
        <div className="flex gap-2 justify-center">
          {page > 1 && (
            <Link
              href={`/pacientes?score_min=${scoreMin}&page=${page - 1}`}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-colors"
              style={{ background: 'var(--white)', color: 'var(--grey-text)', border: '1px solid var(--grey-card)' }}
            >
              ‹
            </Link>
          )}
          {[page - 1, page, page + 1].filter(n => n > 0).map(n => (
            <Link
              key={n}
              href={`/pacientes?score_min=${scoreMin}&page=${n}`}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-colors"
              style={
                n === page
                  ? { background: 'var(--blue-primary)', color: '#fff' }
                  : { background: 'var(--white)', color: 'var(--grey-text)', border: '1px solid var(--grey-card)' }
              }
            >
              {n}
            </Link>
          ))}
          <Link
            href={`/pacientes?score_min=${scoreMin}&page=${page + 1}`}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-colors"
            style={{ background: 'var(--white)', color: 'var(--grey-text)', border: '1px solid var(--grey-card)' }}
          >
            ›
          </Link>
        </div>
      )}
    </div>
  );
}
