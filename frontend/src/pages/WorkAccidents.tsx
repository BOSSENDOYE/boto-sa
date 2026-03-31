import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { Badge, ACCIDENT_SEVERITY } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Modal } from '../components/ui/Modal'
import type { WorkAccident, AccidentSeverity } from '../lib/types'

const SEVERITIES: { value: AccidentSeverity | ''; label: string }[] = [
  { value: '', label: 'Toutes les sévérités' },
  { value: 'MINOR', label: 'Mineur' },
  { value: 'MODERATE', label: 'Modéré' },
  { value: 'SEVERE', label: 'Grave' },
  { value: 'FATAL', label: 'Fatal' },
]

const EMPTY = {
  worker: '',
  accident_date: new Date().toISOString().split('T')[0],
  location: '', circumstance: '', body_part_injured: '',
  injury_type: '', severity: 'MINOR', lost_work_days: '0',
}

export default function WorkAccidents() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState<AccidentSeverity | ''>('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['work-accidents', search, severity, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: '20' })
      if (search) params.set('search', search)
      if (severity) params.set('severity', severity)
      const { data } = await api.get(`/work-accidents/?${params}`)
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
      const { data } = await api.post('/work-accidents/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-accidents'] })
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

  const accidents: WorkAccident[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1
  const workers = workersData?.results ?? []

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader
        title="Accidents du travail"
        subtitle={`${data?.count ?? 0} accident(s)`}
        action={
          <button onClick={() => { setShowModal(true); setError('') }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} /> Déclarer un accident
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Nom, matricule, lieu..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
        </div>
        <select value={severity} onChange={(e) => { setSeverity(e.target.value as AccidentSeverity | ''); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {SEVERITIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Travailleur</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Lieu</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Partie blessée</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Sévérité</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Arrêt (j.)</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reconnu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Chargement...</td></tr>
            ) : accidents.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Aucun accident trouvé.</td></tr>
            ) : accidents.map((a) => {
              const badge = ACCIDENT_SEVERITY[a.severity]
              return (
                <tr key={a.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-gray-700">{new Date(a.accident_date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{a.worker.first_name} {a.worker.last_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{a.worker.matricule}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{a.location || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{a.body_part_injured || '—'}</td>
                  <td className="px-4 py-3">{badge && <Badge label={badge.label} color={badge.color} />}</td>
                  <td className="px-4 py-3 text-center">
                    {a.lost_work_days > 0 ? <span className="text-orange-600 font-medium">{a.lost_work_days}</span> : '0'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.is_recognized ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {a.is_recognized ? 'Oui' : 'Non'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} totalCount={data?.count ?? 0}
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="accidents" />
      </div>

      {showModal && (
        <Modal title="Déclarer un accident du travail" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Travailleur *</label>
              <select required value={form.worker} onChange={e => set('worker', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Sélectionner —</option>
                {workers.map((w: any) => <option key={w.id} value={String(w.id)}>{w.last_name} {w.first_name} ({w.matricule})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date de l'accident *</label>
                <input required type="date" value={form.accident_date} onChange={e => set('accident_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sévérité *</label>
                <select required value={form.severity} onChange={e => set('severity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="MINOR">Mineur</option>
                  <option value="MODERATE">Modéré</option>
                  <option value="SEVERE">Grave</option>
                  <option value="FATAL">Fatal</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lieu de l'accident</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Ex: Atelier de production"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Circonstances</label>
              <textarea value={form.circumstance} onChange={e => set('circumstance', e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Partie blessée</label>
                <input value={form.body_part_injured} onChange={e => set('body_part_injured', e.target.value)} placeholder="Ex: Main droite"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type de blessure</label>
                <input value={form.injury_type} onChange={e => set('injury_type', e.target.value)} placeholder="Ex: Coupure"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Jours d'arrêt</label>
              <input type="number" min="0" value={form.lost_work_days} onChange={e => set('lost_work_days', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
