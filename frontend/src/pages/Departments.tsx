import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Building2 } from 'lucide-react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import type { Department, JobPosition } from '../lib/types'

const RISK_LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  LOW:       { label: 'Faible',     color: 'bg-green-100 text-green-700' },
  MEDIUM:    { label: 'Moyen',      color: 'bg-yellow-100 text-yellow-700' },
  HIGH:      { label: 'Élevé',      color: 'bg-orange-100 text-orange-700' },
  VERY_HIGH: { label: 'Très élevé', color: 'bg-red-100 text-red-700' },
}

type Tab = 'departments' | 'positions'

export default function Departments() {
  const [tab, setTab] = useState<Tab>('departments')

  return (
    <div className="space-y-5 max-w-5xl">
      <PageHeader title="Organisation" />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('departments')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'departments' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Départements
        </button>
        <button
          onClick={() => setTab('positions')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'positions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Postes de travail
        </button>
      </div>

      {tab === 'departments' ? <DepartmentsTab /> : <PositionsTab />}
    </div>
  )
}

function DepartmentsTab() {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', manager_name: '', site_location: '' })
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await api.get('/departments/?page_size=100')
      return data
    },
  })

  const mutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { data } = await api.post('/departments/', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['departments-all'] })
      setShowModal(false)
      setForm({ name: '', code: '', manager_name: '', site_location: '' })
      setError('')
    },
    onError: (err: any) => {
      const detail = err?.response?.data
      if (detail && typeof detail === 'object') {
        const msg = Object.entries(detail).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | ')
        setError(msg)
      } else {
        setError("Erreur lors de l'enregistrement.")
      }
    },
  })

  const departments: Department[] = data?.results ?? []

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => { setShowModal(true); setError('') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} /> Nouveau département
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-400">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.length === 0 ? (
            <p className="text-gray-400 col-span-3 py-8 text-center">Aucun département enregistré.</p>
          ) : departments.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <Building2 size={18} className="text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{d.name}</h3>
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded shrink-0">{d.code}</span>
                  </div>
                  {d.manager_name && (
                    <p className="text-xs text-gray-500 mt-1">Responsable: {d.manager_name}</p>
                  )}
                  {d.site_location && (
                    <p className="text-xs text-gray-400">{d.site_location}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Nouveau département" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Ex: Production"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Code *</label>
              <input required value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="Ex: PROD"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Responsable</label>
              <input value={form.manager_name} onChange={e => set('manager_name', e.target.value)}
                placeholder="Nom du responsable"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Site / Localisation</label>
              <input value={form.site_location} onChange={e => set('site_location', e.target.value)}
                placeholder="Ex: Bâtiment A"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={mutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors">
                {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

function PositionsTab() {
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', code: '', department: '', risk_level: 'LOW', description: '' })
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['job-positions', page],
    queryFn: async () => {
      const { data } = await api.get(`/job-positions/?page=${page}&page_size=25`)
      return data
    },
  })

  const { data: deptData } = useQuery({
    queryKey: ['departments-all'],
    queryFn: async () => {
      const { data } = await api.get('/departments/?page_size=100')
      return data
    },
    enabled: showModal,
  })

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const { data } = await api.post('/job-positions/', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-positions'] })
      queryClient.invalidateQueries({ queryKey: ['job-positions-all'] })
      setShowModal(false)
      setForm({ title: '', code: '', department: '', risk_level: 'LOW', description: '' })
      setError('')
    },
    onError: (err: any) => {
      const detail = err?.response?.data
      if (detail && typeof detail === 'object') {
        const msg = Object.entries(detail).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | ')
        setError(msg)
      } else {
        setError("Erreur lors de l'enregistrement.")
      }
    },
  })

  const positions: JobPosition[] = data?.results ?? []
  const departments: Department[] = deptData?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 25) : 1

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const payload: Record<string, string> = { ...form }
    if (!payload.department) delete payload.department
    mutation.mutate(payload)
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{data?.count ?? 0} poste(s)</span>
        <button
          onClick={() => { setShowModal(true); setError('') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} /> Nouveau poste
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Intitulé</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Département</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Niveau de risque</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400">Chargement...</td></tr>
            ) : positions.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400">Aucun poste enregistré.</td></tr>
            ) : positions.map((p) => {
              const risk = RISK_LEVEL_LABELS[p.risk_level]
              return (
                <tr key={p.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-600 text-xs">{p.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                  <td className="px-4 py-3 text-gray-600">{p.department?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {risk && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${risk.color}`}>
                        {risk.label}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex justify-end gap-2 text-sm text-gray-600">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Précédent</button>
            <span className="px-2 py-1">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Suivant</button>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Nouveau poste de travail" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Intitulé *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="Ex: Opérateur de production"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Code *</label>
              <input required value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="Ex: OP-PROD"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Département</label>
              <select value={form.department} onChange={e => set('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Sélectionner —</option>
                {departments.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Niveau de risque *</label>
              <select required value={form.risk_level} onChange={e => set('risk_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="LOW">Faible</option>
                <option value="MEDIUM">Moyen</option>
                <option value="HIGH">Élevé</option>
                <option value="VERY_HIGH">Très élevé</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={3} placeholder="Description du poste..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={mutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors">
                {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
