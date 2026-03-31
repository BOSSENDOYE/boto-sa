interface BadgeProps {
  label: string
  color: string // tailwind bg+text classes e.g. "bg-green-100 text-green-700"
}

export function Badge({ label, color }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

// ─── Preset badge helpers ──────────────────────────────────────────────────

export const APPOINTMENT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:     { label: 'En attente',  color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED:   { label: 'Confirmé',    color: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'En cours',    color: 'bg-indigo-100 text-indigo-700' },
  COMPLETED:   { label: 'Terminé',     color: 'bg-green-100 text-green-700' },
  CANCELLED:   { label: 'Annulé',      color: 'bg-red-100 text-red-700' },
  NO_SHOW:     { label: 'Absent',      color: 'bg-gray-100 text-gray-600' },
}

export const ENCOUNTER_STATUS: Record<string, { label: string; color: string }> = {
  DRAFT:      { label: 'Brouillon',  color: 'bg-gray-100 text-gray-600' },
  COMPLETED:  { label: 'Complété',   color: 'bg-blue-100 text-blue-700' },
  VALIDATED:  { label: 'Validé',     color: 'bg-green-100 text-green-700' },
  CANCELLED:  { label: 'Annulé',     color: 'bg-red-100 text-red-700' },
}

export const ENCOUNTER_TYPE: Record<string, { label: string; color: string }> = {
  CONSULTATION:  { label: 'Consultation',    color: 'bg-blue-100 text-blue-700' },
  MEDICAL_VISIT: { label: 'Visite médicale', color: 'bg-purple-100 text-purple-700' },
  OBSERVATION:   { label: 'Observation',     color: 'bg-orange-100 text-orange-700' },
  EMERGENCY:     { label: 'Urgence',         color: 'bg-red-100 text-red-700' },
  ACT:           { label: 'Acte médical',    color: 'bg-teal-100 text-teal-700' },
}

export const VISIT_TYPE: Record<string, { label: string; color: string }> = {
  EMBAUCHE:   { label: "À l'embauche",    color: 'bg-blue-100 text-blue-700' },
  PERIODIQUE: { label: 'Périodique',      color: 'bg-green-100 text-green-700' },
  REPRISE:    { label: 'Reprise',         color: 'bg-orange-100 text-orange-700' },
  SPONTANEE:  { label: 'Spontanée',       color: 'bg-gray-100 text-gray-700' },
  DEPART:     { label: 'Départ',          color: 'bg-red-100 text-red-600' },
}

export const APTITUDE: Record<string, { label: string; color: string }> = {
  APT:        { label: 'Apte',              color: 'bg-green-100 text-green-700' },
  APT_R:      { label: 'Apte (restr.)',     color: 'bg-yellow-100 text-yellow-700' },
  TEMP_INAPT: { label: 'Inapte temp.',      color: 'bg-orange-100 text-orange-700' },
  INAPT:      { label: 'Inapte',            color: 'bg-red-100 text-red-700' },
}

export const ACCIDENT_SEVERITY: Record<string, { label: string; color: string }> = {
  MINOR:    { label: 'Mineur',   color: 'bg-yellow-100 text-yellow-700' },
  MODERATE: { label: 'Modéré',   color: 'bg-orange-100 text-orange-700' },
  SEVERE:   { label: 'Grave',    color: 'bg-red-100 text-red-700' },
  FATAL:    { label: 'Fatal',    color: 'bg-red-900 text-red-100' },
}

export const EXPLORATION_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: 'Complété',   color: 'bg-blue-100 text-blue-700' },
  VALIDATED: { label: 'Validé',     color: 'bg-green-100 text-green-700' },
  ABNORMAL:  { label: 'Anormal',    color: 'bg-red-100 text-red-700' },
}

export const SMS_STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: 'Active',    color: 'bg-green-100 text-green-700' },
  SUSPENDED: { label: 'Suspendue', color: 'bg-yellow-100 text-yellow-700' },
  ENDED:     { label: 'Terminée',  color: 'bg-gray-100 text-gray-600' },
}

export const RISK_LEVEL: Record<number, { label: string; color: string }> = {
  1: { label: 'Faible',     color: 'bg-green-100 text-green-700' },
  2: { label: 'Moyen',      color: 'bg-yellow-100 text-yellow-700' },
  3: { label: 'Élevé',      color: 'bg-orange-100 text-orange-700' },
  4: { label: 'Très élevé', color: 'bg-red-100 text-red-700' },
}

export const CONTRACT_TYPE: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', INTERN: 'Stagiaire', CONTRACTOR: 'Sous-traitant',
}

export const RISK_TYPE: Record<string, string> = {
  NOISE: 'Bruit', CHEMICAL: 'Chimique', RADIATION: 'Rayonnement',
  BIOLOGICAL: 'Biologique', DUST: 'Poussière', ERGONOMIC: 'Ergonomique',
  PHYSICAL: 'Physique', PSYCHOSOCIAL: 'Psychosocial', OTHER: 'Autre',
}
