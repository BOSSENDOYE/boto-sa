import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { Badge, EXPLORATION_STATUS } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Modal } from '../components/ui/Modal'
import type { ExplorationResult, ExplorationStatus } from '../lib/types'

const STATUSES: { value: ExplorationStatus | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'COMPLETED', label: 'Complété' },
  { value: 'VALIDATED', label: 'Validé' },
  { value: 'ABNORMAL', label: 'Anormal' },
]

const SUB_MODULES = [
  { path: '/explorations/', label: 'Tous' },
  { path: '/explorations/ecg/', label: 'ECG' },
  { path: '/explorations/audiometry/', label: 'Audiométrie' },
  { path: '/explorations/vision/', label: 'Vision' },
  { path: '/explorations/spirometry/', label: 'Spirométrie' },
]

const EMPTY = {
  worker: '',
  performed_date: new Date().toISOString().split('T')[0],
  notes: '',
}

export default function Explorations() {
  const qc = useQueryClient()
  const [activeModule, setActiveModule] = useState('/explorations/')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ExplorationStatus | ''>('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['explorations', activeModule, search, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: '20' })
      if (status) params.set('status', status)
      const { data } = await api.get(`${activeModule}?${params}`)
      return data
    },
  })

  const { data: workersData } = useQuery({
    queryKey: ['workers-all'],
    queryFn: async () => { const { data } = await api.get('/workers/?page_size=200'); return data },
    enabled: showModal,
  })

  const mutation = useMutation({
    mutationFn: async (payload: typeof EMPTY) => {
      const { data } = await api.post('/explorations/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['explorations'] })
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

  const explorations: ExplorationResult[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1
  const workers = workersData?.results ?? []

  function reset() { setPage(1) }
  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader
        title="Explorations paracliniques"
        subtitle={`${data?.count ?? 0} résultat(s)`}
        action={
          <button onClick={() => { setShowModal(true); setError('') }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} /> Nouvelle exploration
          </button>
        }
      />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {SUB_MODULES.map((m) => (
          <button key={m.path} onClick={() => { setActiveModule(m.path); reset() }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeModule === m.path ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Rechercher..." value={search}
            onChange={(e) => { setSearch(e.target.value); reset() }}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value as ExplorationStatus | ''); reset() }}
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
              <th className="text-left px-4 py-3 font-medium text-gray-600">Réalisé par</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fichier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Chargement...</td></tr>
            ) : explorations.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Aucune exploration trouvée.</td></tr>
            ) : explorations.map((e) => {
              const badge = EXPLORATION_STATUS[e.status]
              return (
                <tr key={e.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-gray-700">{new Date(e.performed_date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{e.worker.first_name} {e.worker.last_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{e.worker.matricule}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{e.performed_by.first_name} {e.performed_by.last_name}</td>
                  <td className="px-4 py-3">{badge && <Badge label={badge.label} color={badge.color} />}</td>
                  <td className="px-4 py-3">
                    {e.file_upload ? (
                      <a href={e.file_upload} target="_blank" rel="noreferrer"
                        className="text-blue-600 hover:underline text-xs"
                        onClick={(ev) => ev.stopPropagation()}>Voir fichier</a>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} totalCount={data?.count ?? 0}
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="explorations" />
      </div>

      {showModal && (
        <Modal title="Nouvelle exploration paraclinique" onClose={() => setShowModal(false)}>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input required type="date" value={form.performed_date} onChange={e => set('performed_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes / Observations</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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
