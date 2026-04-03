import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { Badge, ENCOUNTER_STATUS, ENCOUNTER_TYPE } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Modal } from '../components/ui/Modal'
import type { ClinicalEncounter, EncounterType, EncounterStatus } from '../lib/types'

const TYPES: { value: EncounterType | ''; label: string }[] = [
  { value: '', label: 'Tous les types' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'MEDICAL_VISIT', label: 'Visite médicale' },
  { value: 'EMERGENCY', label: 'Urgence' },
  { value: 'OBSERVATION', label: 'Observation' },
  { value: 'ACT', label: 'Acte médical' },
]

const STATUSES: { value: EncounterStatus | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'COMPLETED', label: 'Complété' },
  { value: 'VALIDATED', label: 'Validé' },
  { value: 'CANCELLED', label: 'Annulé' },
]

const EMPTY = { worker: '', doctor: '', encounter_date: new Date().toISOString().split('T')[0], encounter_time: '', encounter_type: 'CONSULTATION' }

export default function Encounters() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [type, setType] = useState<EncounterType | ''>('')
  const [status, setStatus] = useState<EncounterStatus | ''>('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteItem, setDeleteItem] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['encounters', search, type, status, date, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: '20' })
      if (type) params.set('encounter_type', type)
      if (status) params.set('status', status)
      if (date) params.set('encounter_date', date)
      const { data } = await api.get(`/encounters/?${params}`)
      return data
    },
  })

  const { data: workersData } = useQuery({
    queryKey: ['workers-all'],
    queryFn: async () => { const { data } = await api.get('/workers/?page_size=200'); return data },
    enabled: showModal || editItem !== null,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-all'],
    queryFn: async () => { const { data } = await api.get('/auth/users/?page_size=100'); return data },
    enabled: showModal || editItem !== null,
  })

  const mutation = useMutation({
    mutationFn: async (payload: typeof EMPTY) => {
      const { data } = await api.post('/encounters/', payload)
      return data
    },
    onSuccess: () => {
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

  const editMutation = useMutation({
    mutationFn: async (payload: typeof EMPTY) => {
      const { data } = await api.patch(`/encounters/${editItem!.id}/`, payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['encounters'] })
      setEditItem(null)
      setShowModal(false)
      setForm(EMPTY)
      setError('')
    },
    onError: (err: any) => {
      const detail = err?.response?.data
      if (detail && typeof detail === 'object') {
        setError(Object.entries(detail).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | '))
      } else setError("Erreur lors de la modification.")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/encounters/${id}/`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['encounters'] })
      setDeleteItem(null)
    },
  })

  const encounters: ClinicalEncounter[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1
  const workers = workersData?.results ?? []
  const doctors = (usersData?.results ?? usersData ?? []).filter((u: any) => ['DOCTOR', 'SUPER_ADMIN'].includes(u.role))

  function reset() { setPage(1) }
  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (editItem) {
      editMutation.mutate(form)
    } else {
      mutation.mutate(form)
    }
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader
        title="Actes médicaux"
        subtitle={`${data?.count ?? 0} acte(s)`}
        action={
          <button onClick={() => { setShowModal(true); setEditItem(null); setForm(EMPTY); setError('') }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} /> Nouvel acte
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Rechercher..." value={search}
            onChange={(e) => { setSearch(e.target.value); reset() }}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
        </div>
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); reset() }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={type} onChange={(e) => { setType(e.target.value as EncounterType | ''); reset() }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value as EncounterStatus | ''); reset() }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {STATUSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Travailleur</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Médecin</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Chargement...</td></tr>
            ) : encounters.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Aucun acte trouvé.</td></tr>
            ) : encounters.map((enc) => {
              const typeBadge = ENCOUNTER_TYPE[enc.encounter_type]
              const statusBadge = ENCOUNTER_STATUS[enc.status]
              return (
                <tr key={enc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700">
                    {new Date(enc.encounter_date).toLocaleDateString('fr-FR')}
                    <span className="ml-2 text-gray-400 text-xs">{enc.encounter_time?.slice(0, 5)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{enc.worker.first_name} {enc.worker.last_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{enc.worker.matricule}</p>
                  </td>
                  <td className="px-4 py-3">{typeBadge && <Badge label={typeBadge.label} color={typeBadge.color} />}</td>
                  <td className="px-4 py-3 text-gray-600">Dr {enc.doctor.last_name}</td>
                  <td className="px-4 py-3">{statusBadge && <Badge label={statusBadge.label} color={statusBadge.color} />}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => {
                        setEditItem(enc)
                        setForm({
                          worker: String(enc.worker.id),
                          doctor: String(enc.doctor.id),
                          encounter_date: enc.encounter_date,
                          encounter_time: enc.encounter_time?.slice(0, 5) ?? '',
                          encounter_type: enc.encounter_type,
                        })
                        setShowModal(true)
                        setError('')
                      }}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteItem(enc)}
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
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="actes" />
      </div>

      {showModal && (
        <Modal title={editItem ? "Modifier l'acte médical" : "Nouvel acte médical"} onClose={() => { setShowModal(false); setEditItem(null); setForm(EMPTY) }}>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Type d'acte *</label>
              <select required value={form.encounter_type} onChange={e => set('encounter_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="CONSULTATION">Consultation</option>
                <option value="MEDICAL_VISIT">Visite médicale</option>
                <option value="EMERGENCY">Urgence</option>
                <option value="OBSERVATION">Observation</option>
                <option value="ACT">Acte médical</option>
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
              <button type="button" onClick={() => { setShowModal(false); setEditItem(null); setForm(EMPTY) }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={mutation.isPending || editMutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg">
                {(mutation.isPending || editMutation.isPending) ? 'Enregistrement...' : editItem ? 'Modifier' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteItem && (
        <Modal title="Confirmer la suppression" onClose={() => setDeleteItem(null)}>
          <p className="text-sm text-gray-700 mb-6">Voulez-vous vraiment supprimer <strong>l'acte du {new Date(deleteItem.encounter_date).toLocaleDateString('fr-FR')}</strong> ? Cette action est irréversible.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteItem(null)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
            <button type="button" onClick={() => deleteMutation.mutate(deleteItem.id)} disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg">
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
