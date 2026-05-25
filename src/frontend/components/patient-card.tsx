'use client';

import Link from 'next/link';
import type { Paciente } from '@/lib/api';
import { scoreToPriority } from '@/lib/api';
import { ScoreBadge } from './score-badge';
import { ClinicalTag, factorToTagKind } from './clinical-tag';

/** Table-row variant — used inside <tbody> in list pages */
export function PatientRow({ patient, rank }: { patient: Paciente; rank?: number }) {
  const tagKinds = Array.from(new Set(patient.fatores.map(factorToTagKind)));

  return (
    <tr
      className="border-b group transition-colors"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {rank !== undefined && (
        <td
          className="px-4 py-3 text-xs font-mono"
          style={{ color: 'var(--text-muted)' }}
        >
          {rank}
        </td>
      )}
      <td className="px-4 py-3">
        <Link
          href={`/pacientes/${patient.paciente_id}`}
          className="font-mono text-xs hover:underline"
          style={{ color: 'var(--purple-light)' }}
        >
          #{patient.paciente_id.slice(0, 8)}…
        </Link>
      </td>
      <td className="px-4 py-3">
        <ScoreBadge score={patient.score} />
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>
        {patient.faixa_etaria}
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
        {patient.sexo}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {tagKinds.slice(0, 3).map(k => <ClinicalTag key={k} kind={k} />)}
          {tagKinds.length > 3 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--bg-card-2)', color: 'var(--text-muted)' }}
            >
              +{tagKinds.length - 3}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/pacientes/${patient.paciente_id}`}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
          style={{ background: 'rgba(104,46,199,0.15)', color: 'var(--purple-light)' }}
        >
          Ver
        </Link>
      </td>
    </tr>
  );
}

/** Card variant — kept for detail page usage */
export function PatientCard({ patient }: { patient: Paciente }) {
  const priority = scoreToPriority(patient.score);
  const accentColor = {
    1: 'var(--red)',
    2: 'var(--purple-light)',
    3: 'var(--orange)',
    4: 'var(--green)',
  }[priority];

  const tagKinds = Array.from(new Set(patient.fatores.map(factorToTagKind)));

  return (
    <Link
      href={`/pacientes/${patient.paciente_id}`}
      className="block rounded-2xl p-5 transition-all duration-150 hover:border-purple/30"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            #{patient.paciente_id.slice(0, 8)}… · Eq #{patient.equipe_id.slice(0, 6)}
          </p>
          <p className="font-semibold text-sm mt-1" style={{ color: 'var(--text)' }}>
            {patient.faixa_etaria} · {patient.sexo}
          </p>
        </div>
        <ScoreBadge score={patient.score} />
      </div>
      <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
        {patient.ultima_visita
          ? `Última visita: ${patient.ultima_visita}`
          : 'Nunca recebeu visita do ACS.'}
        {' '}
        {patient.fatores.length} fator{patient.fatores.length !== 1 ? 'es' : ''} de risco.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tagKinds.slice(0, 5).map(k => <ClinicalTag key={k} kind={k} />)}
      </div>
      {/* Bottom accent line */}
      <div
        className="mt-4 h-0.5 rounded-full opacity-40"
        style={{ background: accentColor }}
      />
    </Link>
  );
}
