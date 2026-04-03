


import React, { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Plus, FlaskConical, ClipboardList, Award, Pencil, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { Badge, VISIT_TYPE, APTITUDE } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Modal } from '../components/ui/Modal'
import type { MedicalVisit, VisitType } from '../lib/types'

const VISIT_TYPES: { value: VisitType | ''; label: string }[] = [
  { value: '', label: 'Tous les types' },
  { value: 'EMBAUCHE', label: "À l'embauche" },
  { value: 'PERIODIQUE', label: 'Périodique' },
  { value: 'REPRISE', label: 'Reprise' },
  { value: 'SPONTANEE', label: 'Spontanée' },
  { value: 'DEPART', label: 'Départ' },
]

const EMPTY = {
  worker: '', doctor: '',
  encounter_date: new Date().toISOString().split('T')[0],
  encounter_time: '',
  visit_type: 'PERIODIQUE',
}

const URINE_QTY = ['ABSENT', 'TRACES', '+', '++', '+++']
const NITRITE_VALS = ['POS', 'NEG']

const EMPTY_URINE = {
  glucose: 'ABSENT', proteins: 'ABSENT', blood: 'ABSENT', leukocytes: 'ABSENT',
  nitrites: 'NEG', ph: '', specific_gravity: '', notes: '',
}

const EMPTY_PHYSICAL = {
  cardiovascular: '', respiratory: '', abdominal: '', neurological: '',
  musculoskeletal: '', skin_examination: '', ent_examination: '',
  ophthalmological: '', dental_notes: '', other_findings: '',
}

const EMPTY_APTITUDE = {
  aptitude: 'APT', restrictions: '', next_visit_date: '', valid_until: '',
}

type DetailTab = 'urine' | 'physical' | 'aptitude'

function errMsg(err: any) {
  const d = err?.response?.data
  if (d && typeof d === 'object') return Object.entries(d).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | ')
  return "Erreur lors de l'enregistrement."
}

export default function MedicalVisits() {
  const qc = useQueryClient()
  const [visitType, setVisitType] = useState<VisitType | ''>('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['medical-visits', visitType, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: '20' })
      if (visitType) params.set('visit_type', visitType)
      const { data } = await api.get(`/medical-visits/?${params}`)
      return data
    },
  })

  const { data: workersData } = useQuery({
    queryKey: ['workers-all'],
    queryFn: async () => { const { data } = await api.get('/workers/?page_size=200'); return data },
    enabled: showCreate,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-all'],
    queryFn: async () => { const { data } = await api.get('/auth/users/?page_size=100'); return data },
    enabled: showCreate,
  })

  const mutation = useMutation({
    mutationFn: async (payload: typeof EMPTY) => {
      const encRes = await api.post('/encounters/', {
        worker: payload.worker,
        doctor: payload.doctor,
        encounter_date: payload.encounter_date,
        encounter_time: payload.encounter_time || undefined,
        encounter_type: 'MEDICAL_VISIT',
      })
      const { data } = await api.post('/medical-visits/', {
        encounter: encRes.data.id,
        visit_type: payload.visit_type,
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-visits'] })
      qc.invalidateQueries({ queryKey: ['encounters'] })
      setShowCreate(false)
      setForm(EMPTY)
      setError('')
    },
    onError: (err: any) => { setError(errMsg(err)) },
  })

  const visits: MedicalVisit[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1
  const workers = workersData?.results ?? []
  const doctors = (usersData?.results ?? usersData ?? []).filter((u: any) => ['DOCTOR', 'SUPER_ADMIN'].includes(u.role))

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader
        title="Visites médicales"
        subtitle={`${data?.count ?? 0} visite(s)`}
        action={
          <button onClick={() => { setShowCreate(true); setError('') }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} /> Nouvelle visite
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <select value={visitType} onChange={(e) => { setVisitType(e.target.value as VisitType | ''); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {VISIT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Travailleur</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type de visite</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Médecin</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Aptitude</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Prochaine visite</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Chargement...</td></tr>
            ) : visits.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Aucune visite trouvée.</td></tr>
            ) : visits.map((v: any) => {
              const typeBadge = VISIT_TYPE[v.visit_type]
              const aptBadge = v.aptitude_certificate ? APTITUDE[v.aptitude_certificate.aptitude] : null
              return (
                <tr key={v.id} onClick={() => setSelectedVisit(v)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-gray-700">
                    {v.encounter_date ? new Date(v.encounter_date).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{v.worker_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{v.worker_matricule}</p>
                  </td>
                  <td className="px-4 py-3">{typeBadge && <Badge label={typeBadge.label} color={typeBadge.color} />}</td>
                  <td className="px-4 py-3 text-gray-600">{v.doctor_name ? `Dr ${v.doctor_name}` : '—'}</td>
                  <td className="px-4 py-3">
                    {aptBadge ? <Badge label={aptBadge.label} color={aptBadge.color} /> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {v.aptitude_certificate?.next_visit_date
                      ? new Date(v.aptitude_certificate.next_visit_date).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); /* TODO: edit */ }}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); /* TODO: delete */ }}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} totalCount={data?.count ?? 0}
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="visites" />
      </div>

      {/* Modal création */}
      {showCreate && (
        <Modal title="Nouvelle visite médicale" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Travailleur *</label>
              <select required value={form.worker} onChange={e => set('worker', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Sélectionner —</option>
                {workers.map((w: any) => <option key={w.id} value={String(w.id)}>{w.last_name} {w.first_name} ({w.matricule})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Médecin *</label>
              <select required value={form.doctor} onChange={e => set('doctor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Sélectionner —</option>
                {doctors.map((u: any) => <option key={u.id} value={String(u.id)}>Dr {u.last_name} {u.first_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type de visite *</label>
              <select required value={form.visit_type} onChange={e => set('visit_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="EMBAUCHE">À l'embauche</option>
                <option value="PERIODIQUE">Périodique</option>
                <option value="REPRISE">Reprise</option>
                <option value="SPONTANEE">Spontanée</option>
                <option value="DEPART">Départ</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                <input required type="date" value={form.encounter_date} onChange={e => set('encounter_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Heure</label>
                <input type="time" value={form.encounter_time} onChange={e => set('encounter_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={mutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg">
                {mutation.isPending ? 'Enregistrement...' : 'Créer la visite'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal détail visite */}
      {selectedVisit && (
        <VisitDetailModal
          visit={selectedVisit}
          onClose={() => { setSelectedVisit(null); qc.invalidateQueries({ queryKey: ['medical-visits'] }) }}
        />
      )}
    </div>
  )
}

/* ─── Modal détail visite ────────────────────────────────────────────────── */

function VisitDetailModal({ visit, onClose }: { visit: any; onClose: () => void }) {
  const [tab, setTab] = useState<DetailTab>('urine')

  const typeBadge = VISIT_TYPE[visit.visit_type]

  return (
    <Modal
      title={`Visite — ${visit.worker_name ?? ''} (${visit.encounter_date ? new Date(visit.encounter_date).toLocaleDateString('fr-FR') : ''})`}
      onClose={onClose}
      wide
    >
      {/* Type badge */}
      <div className="flex items-center gap-2 mb-4">
        {typeBadge && <Badge label={typeBadge.label} color={typeBadge.color} />}
        {visit.doctor_name && <span className="text-sm text-gray-500">Dr {visit.doctor_name}</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-5">
        <button onClick={() => setTab('urine')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'urine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          <FlaskConical size={13} /> Examen urinaire
        </button>
        <button onClick={() => setTab('physical')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'physical' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          <ClipboardList size={13} /> Examen physique
        </button>
        <button onClick={() => setTab('aptitude')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'aptitude' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          <Award size={13} /> Certificat d'aptitude
        </button>
      </div>

      {tab === 'urine'    && <UrineExamTab    visitId={visit.id} existing={visit.urine_exam} />}
      {tab === 'physical' && <PhysicalExamTab visitId={visit.id} existing={visit.physical_exam} />}
      {tab === 'aptitude' && <AptitudeTab     visitId={visit.id} existing={visit.aptitude_certificate} />}
    </Modal>
  )
}

/* ─── Examen urinaire ────────────────────────────────────────────────────── */

function UrineExamTab({ visitId, existing }: { visitId: number; existing: any }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(existing ? {
    glucose: existing.glucose ?? 'ABSENT',
    proteins: existing.proteins ?? 'ABSENT',
    blood: existing.blood ?? 'ABSENT',
    leukocytes: existing.leukocytes ?? 'ABSENT',
    nitrites: existing.nitrites ?? 'NEG',
    ph: existing.ph ?? '',
    specific_gravity: existing.specific_gravity ?? '',
    notes: existing.notes ?? '',
  } : EMPTY_URINE)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async (f: typeof EMPTY_URINE) => {
      const body = { ...f, ph: f.ph ? Number(f.ph) : undefined }
      if (existing) {
        const { data } = await api.put(`/medical-visits/${visitId}/urine_exam/`, body)
        return data
      }
      const { data } = await api.post(`/medical-visits/${visitId}/urine_exam/`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-visits'] })
      setError('')
    },
    onError: (err: any) => setError(errMsg(err)),
  })

  function set(f: string, v: string) { setForm(prev => ({ ...prev, [f]: v })) }

  const selectClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(['glucose', 'proteins', 'blood', 'leukocytes'] as const).map(field => (
          <div key={field}>
            <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">
              {field === 'glucose' ? 'Glucose' : field === 'proteins' ? 'Protéines' : field === 'blood' ? 'Sang' : 'Leucocytes'}
            </label>
            <select value={(form as any)[field]} onChange={e => set(field, e.target.value)} className={selectClass}>
              {URINE_QTY.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nitrites</label>
          <select value={form.nitrites} onChange={e => set('nitrites', e.target.value)} className={selectClass}>
            {NITRITE_VALS.map(v => <option key={v} value={v}>{v === 'POS' ? 'Positif' : 'Négatif'}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">pH</label>
          <input type="number" step="0.1" min="0" max="14" value={form.ph} onChange={e => set('ph', e.target.value)}
            placeholder="Ex: 6.5" className={selectClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Densité</label>
          <input value={form.specific_gravity} onChange={e => set('specific_gravity', e.target.value)}
            placeholder="Ex: 1.015" className={selectClass} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
        <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={mutation.isPending}
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg">
          {mutation.isPending ? 'Enregistrement...' : existing ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </div>
      {mutation.isSuccess && <p className="text-xs text-green-600 text-right">Enregistré ✓</p>}
    </form>
  )
}

/* ─── Examen physique ────────────────────────────────────────────────────── */

const PHYSICAL_FIELDS: { key: keyof typeof EMPTY_PHYSICAL; label: string }[] = [
  { key: 'cardiovascular',   label: 'Cardiovasculaire' },
  { key: 'respiratory',      label: 'Respiratoire' },
  { key: 'abdominal',        label: 'Abdominal' },
  { key: 'neurological',     label: 'Neurologique' },
  { key: 'musculoskeletal',  label: 'Ostéo-articulaire' },
  { key: 'skin_examination', label: 'Cutané' },
  { key: 'ent_examination',  label: 'ORL' },
  { key: 'ophthalmological', label: 'Ophtalmologique' },
  { key: 'dental_notes',     label: 'Dentaire' },
  { key: 'other_findings',   label: 'Autres constatations' },
]

function PhysicalExamTab({ visitId, existing }: { visitId: number; existing: any }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<typeof EMPTY_PHYSICAL>(existing
    ? Object.fromEntries(PHYSICAL_FIELDS.map(f => [f.key, existing[f.key] ?? ''])) as typeof EMPTY_PHYSICAL
    : { ...EMPTY_PHYSICAL })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async (f: typeof EMPTY_PHYSICAL) => {
      if (existing) {
        const { data } = await api.put(`/medical-visits/${visitId}/physical_exam/`, f)
        return data
      }
      const { data } = await api.post(`/medical-visits/${visitId}/physical_exam/`, f)
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['medical-visits'] }); setError('') },
    onError: (err: any) => setError(errMsg(err)),
  })

  function set(f: string, v: string) { setForm(prev => ({ ...prev, [f]: v })) }

  return (
    <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(form) }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {PHYSICAL_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
            <textarea rows={2} value={(form as any)[key]} onChange={e => set(key, e.target.value)}
              placeholder="Normal"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        ))}
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={mutation.isPending}
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg">
          {mutation.isPending ? 'Enregistrement...' : existing ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </div>
      {mutation.isSuccess && <p className="text-xs text-green-600 text-right">Enregistré ✓</p>}
    </form>
  )
}

/* ─── Certificat d'aptitude ──────────────────────────────────────────────── */

const APTITUDE_OPTIONS = [
  { value: 'APT',       label: 'Apte' },
  { value: 'APT_R',     label: 'Apte avec restrictions' },
  { value: 'TEMP_INAPT', label: 'Temporairement inapte' },
  { value: 'INAPT',     label: 'Inapte' },
]

function AptitudeTab({ visitId, existing }: { visitId: number; existing: any }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(existing ? {
    aptitude: existing.aptitude ?? 'APT',
    restrictions: existing.restrictions ?? '',
    next_visit_date: existing.next_visit_date ?? '',
    valid_until: existing.valid_until ?? '',
  } : { ...EMPTY_APTITUDE })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async (f: typeof EMPTY_APTITUDE) => {
      const body: Record<string, any> = {
        aptitude: f.aptitude,
        restrictions: f.restrictions,
      }
      if (f.next_visit_date) body.next_visit_date = f.next_visit_date
      if (f.valid_until) body.valid_until = f.valid_until
      const { data } = await api.post(`/medical-visits/${visitId}/aptitude_certificate/`, body)
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['medical-visits'] }); setError('') },
    onError: (err: any) => setError(errMsg(err)),
  })

  function set(f: string, v: string) { setForm(prev => ({ ...prev, [f]: v })) }

  return (
    <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(form) }} className="space-y-4">
      {existing && (
        <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">N° certificat :</span> {existing.certificate_number}</p>
          {existing.signed_by_name && <p><span className="font-medium">Signé par :</span> Dr {existing.signed_by_name}</p>}
          {existing.pdf_file && (
            <a href={existing.pdf_file} target="_blank" rel="noreferrer"
              className="text-blue-600 hover:underline text-xs">Télécharger le PDF</a>
          )}
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Conclusion d'aptitude *</label>
        <select required value={form.aptitude} onChange={e => set('aptitude', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {APTITUDE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {(form.aptitude === 'APT_R' || form.aptitude === 'TEMP_INAPT') && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Restrictions / Aménagements</label>
          <textarea rows={2} value={form.restrictions} onChange={e => set('restrictions', e.target.value)}
            placeholder="Ex: Pas de travail en hauteur, port de charges limité à 5 kg..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Prochaine visite</label>
          <input type="date" value={form.next_visit_date} onChange={e => set('next_visit_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Valable jusqu'au</label>
          <input type="date" value={form.valid_until} onChange={e => set('valid_until', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={mutation.isPending || !!existing}
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg">
          {mutation.isPending ? 'Enregistrement...' : existing ? 'Certificat déjà émis' : 'Émettre le certificat'}
        </button>
      </div>
      {mutation.isSuccess && <p className="text-xs text-green-600 text-right">Certificat émis ✓</p>}
    </form>
  )
}
