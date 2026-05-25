import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { PatientRow } from '@/components/patient-card';

export const dynamic = 'force-dynamic';

const FILTROS = [
  { score_min: 80,  label: 'Crítico (80+)',  bg: 'rgba(255,77,109,0.15)',  color: '#FF4D6D',  border: 'rgba(255,77,109,0.30)' },
  { score_min: 50,  label: 'Urgente (50+)',  bg: 'rgba(104,46,199,0.15)', color: '#9B6FE8',  border: 'rgba(104,46,199,0.30)' },
  { score_min: 20,  label: 'Atenção (20+)',  bg: 'rgba(255,159,10,0.15)', color: '#FF9F0A',  border: 'rgba(255,159,10,0.30)' },
  { score_min: 0,   label: 'Todos',          bg: 'rgba(255,255,255,0.06)', color: '#74769A', border: 'rgba(255,255,255,0.10)' },
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
          <h1 className="text-3xl font-bold mt-1" style={{ color: 'var(--text)' }}>
            Lista Priorizada
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
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
                background: isActive ? f.bg : 'var(--bg-card)',
                color: isActive ? f.color : 'var(--text-muted)',
                borderColor: isActive ? f.border : 'var(--border-subtle)',
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
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
            {totalForBadge} resultado{totalForBadge !== 1 ? 's' : ''}
          </p>
          {offset > 0 && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Página {page}
            </p>
          )}
        </div>

        {patients.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhum paciente encontrado com esse filtro.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="text-left text-xs font-semibold uppercase tracking-wider border-b"
                  style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
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
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
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
                  ? { background: 'var(--purple)', color: '#fff' }
                  : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }
              }
            >
              {n}
            </Link>
          ))}
          <Link
            href={`/pacientes?score_min=${scoreMin}&page=${page + 1}`}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-colors"
            style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
          >
            ›
          </Link>
        </div>
      )}
    </div>
  );
}
