import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
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

export default function MedicalVisits() {
  const qc = useQueryClient()
  const [visitType, setVisitType] = useState<VisitType | ''>('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
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
    enabled: showModal,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-all'],
    queryFn: async () => { const { data } = await api.get('/auth/users/?page_size=100'); return data },
    enabled: showModal,
  })

  const mutation = useMutation({
    mutationFn: async (payload: typeof EMPTY) => {
      // Step 1: create encounter
      const encRes = await api.post('/encounters/', {
        worker: payload.worker,
        doctor: payload.doctor,
        encounter_date: payload.encounter_date,
        encounter_time: payload.encounter_time || undefined,
        encounter_type: 'MEDICAL_VISIT',
      })
      // Step 2: create medical visit
      const { data } = await api.post('/medical-visits/', {
        encounter: encRes.data.id,
        visit_type: payload.visit_type,
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-visits'] })
      qc.invalidateQueries({ queryKey: ['encounters'] })
      setShowModal(false)
      setForm(EMPTY)
      setError('')
    },
    onError: (err: any) => {
      const detail = err?.response?.data
      if (detail && typeof detail === 'object') {
        setError(Object.entries(detail).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | '))
      } else setError("Erreur lors de l'enregistrement.")
    },
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
          <button onClick={() => { setShowModal(true); setError('') }}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Chargement...</td></tr>
            ) : visits.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Aucune visite trouvée.</td></tr>
            ) : visits.map((v) => {
              const typeBadge = VISIT_TYPE[v.visit_type]
              const aptBadge = v.aptitude_certificate ? APTITUDE[v.aptitude_certificate.aptitude] : null
              return (
                <tr key={v.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-gray-700">{v.encounter?.encounter_date ? new Date(v.encounter.encounter_date).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{v.encounter?.worker?.first_name} {v.encounter?.worker?.last_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{v.encounter?.worker?.matricule}</p>
                  </td>
                  <td className="px-4 py-3">{typeBadge && <Badge label={typeBadge.label} color={typeBadge.color} />}</td>
                  <td className="px-4 py-3 text-gray-600">Dr {v.encounter?.doctor?.last_name}</td>
                  <td className="px-4 py-3">
                    {aptBadge ? <Badge label={aptBadge.label} color={aptBadge.color} /> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {v.aptitude_certificate?.next_visit_date
                      ? new Date(v.aptitude_certificate.next_visit_date).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} totalCount={data?.count ?? 0}
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="visites" />
      </div>

      {showModal && (
        <Modal title="Nouvelle visite médicale" onClose={() => setShowModal(false)}>
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
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={mutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg">
                {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
