import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { Badge, SMS_STATUS, RISK_LEVEL, RISK_TYPE } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Modal } from '../components/ui/Modal'
import type { SpecialMedicalSurveillance, WorkRisk, SMSStatus } from '../lib/types'

type Tab = 'sms' | 'risks'

export default function Occupational() {
  const path = window.location.pathname
  const defaultTab: Tab = path.includes('/risks') ? 'risks' : 'sms'
  const [tab, setTab] = useState<Tab>(defaultTab)

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader title="Santé au travail" />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('sms')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'sms' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          Surveillance médicale spéciale
        </button>
        <button onClick={() => setTab('risks')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'risks' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          Risques professionnels
        </button>
      </div>

      {tab === 'sms' ? <SMSTab /> : <RisksTab />}
    </div>
  )
}

function SMSTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<SMSStatus | ''>('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    worker: '', assigned_doctor: '', risk_type: 'NOISE', risk_agent: '',
    started_date: new Date().toISOString().split('T')[0],
    review_date: '', frequency_months: '6',
  })
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['sms', search, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: '20' })
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      const { data } = await api.get(`/sms/?${params}`)
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
    mutationFn: async (payload: typeof form) => {
      const { data } = await api.post('/sms/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sms'] })
      setShowModal(false)
      setForm({ worker: '', assigned_doctor: '', risk_type: 'NOISE', risk_agent: '', started_date: new Date().toISOString().split('T')[0], review_date: '', frequency_months: '6' })
      setError('')
    },
    onError: (err: any) => {
      const detail = err?.response?.data
      if (detail && typeof detail === 'object') {
        setError(Object.entries(detail).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | '))
      } else setError("Erreur lors de l'enregistrement.")
    },
  })

  const items: SpecialMedicalSurveillance[] = data?.results ?? []
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
    <>
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Nom, agent..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value as SMSStatus | ''); setPage(1) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspendue</option>
            <option value="ENDED">Terminée</option>
          </select>
        </div>
        <button onClick={() => { setShowModal(true); setError('') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={15} /> Nouvelle SMS
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Travailleur</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Risque</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Agent</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Médecin référent</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Prochaine revue</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fréquence</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Chargement...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Aucune surveillance trouvée.</td></tr>
            ) : items.map((s) => {
              const badge = SMS_STATUS[s.status]
              return (
                <tr key={s.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.worker?.first_name} {s.worker?.last_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{s.worker?.matricule}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{RISK_TYPE[s.risk_type] ?? s.risk_type}</td>
                  <td className="px-4 py-3 text-gray-600">{s.risk_agent || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">Dr {s.assigned_doctor?.last_name}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(s.review_date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-gray-600">{s.frequency_months} mois</td>
                  <td className="px-4 py-3">{badge && <Badge label={badge.label} color={badge.color} />}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} totalCount={data?.count ?? 0}
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="protocoles" />
      </div>

      {showModal && (
        <Modal title="Nouvelle surveillance médicale spéciale" onClose={() => setShowModal(false)}>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Médecin référent *</label>
              <select required value={form.assigned_doctor} onChange={e => set('assigned_doctor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Sélectionner —</option>
                {doctors.map((u: any) => <option key={u.id} value={String(u.id)}>Dr {u.last_name} {u.first_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type de risque *</label>
                <select required value={form.risk_type} onChange={e => set('risk_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="NOISE">Bruit</option>
                  <option value="CHEMICAL">Chimique</option>
                  <option value="RADIATION">Radiation</option>
                  <option value="BIOLOGICAL">Biologique</option>
                  <option value="DUST">Poussière</option>
                  <option value="ERGONOMIC">Ergonomique</option>
                  <option value="PHYSICAL">Physique</option>
                  <option value="PSYCHOSOCIAL">Psychosocial</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Agent exposant</label>
                <input value={form.risk_agent} onChange={e => set('risk_agent', e.target.value)} placeholder="Ex: Benzène"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date de début *</label>
                <input required type="date" value={form.started_date} onChange={e => set('started_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date de revue *</label>
                <input required type="date" value={form.review_date} onChange={e => set('review_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fréquence (mois) *</label>
              <input required type="number" min="1" value={form.frequency_months} onChange={e => set('frequency_months', e.target.value)}
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
    </>
  )
}

function RisksTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    job_position: '', risk_type: 'NOISE', risk_agent: '',
    risk_level: '1', preventive_measures: '', ppe_required: '',
  })
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['work-risks', page],
    queryFn: async () => {
      const { data } = await api.get(`/work-risks/?page=${page}&page_size=20`)
      return data
    },
  })

  const { data: positionsData } = useQuery({
    queryKey: ['job-positions-all'],
    queryFn: async () => { const { data } = await api.get('/job-positions/?page_size=100'); return data },
    enabled: showModal,
  })

  const mutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { data } = await api.post('/work-risks/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-risks'] })
      setShowModal(false)
      setForm({ job_position: '', risk_type: 'NOISE', risk_agent: '', risk_level: '1', preventive_measures: '', ppe_required: '' })
      setError('')
    },
    onError: (err: any) => {
      const detail = err?.response?.data
      if (detail && typeof detail === 'object') {
        setError(Object.entries(detail).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | '))
      } else setError("Erreur lors de l'enregistrement.")
    },
  })

  const risks: WorkRisk[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1
  const positions = positionsData?.results ?? []

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => { setShowModal(true); setError('') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={15} /> Ajouter un risque
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Poste</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type de risque</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Agent</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Niveau</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">EPI requis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Chargement...</td></tr>
            ) : risks.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Aucun risque enregistré.</td></tr>
            ) : risks.map((r) => {
              const levelBadge = RISK_LEVEL[r.risk_level]
              return (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 font-medium">{r.job_position?.title}</td>
                  <td className="px-4 py-3 text-gray-600">{RISK_TYPE[r.risk_type] ?? r.risk_type}</td>
                  <td className="px-4 py-3 text-gray-600">{r.risk_agent || '—'}</td>
                  <td className="px-4 py-3">{levelBadge && <Badge label={levelBadge.label} color={levelBadge.color} />}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{r.ppe_required || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} totalCount={data?.count ?? 0}
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="risques" />
      </div>

      {showModal && (
        <Modal title="Ajouter un risque professionnel" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Poste de travail *</label>
              <select required value={form.job_position} onChange={e => set('job_position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Sélectionner —</option>
                {positions.map((p: any) => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type de risque *</label>
                <select required value={form.risk_type} onChange={e => set('risk_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="NOISE">Bruit</option>
                  <option value="CHEMICAL">Chimique</option>
                  <option value="RADIATION">Radiation</option>
                  <option value="BIOLOGICAL">Biologique</option>
                  <option value="DUST">Poussière</option>
                  <option value="ERGONOMIC">Ergonomique</option>
                  <option value="PHYSICAL">Physique</option>
                  <option value="PSYCHOSOCIAL">Psychosocial</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Niveau (1-4) *</label>
                <select required value={form.risk_level} onChange={e => set('risk_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="1">1 — Faible</option>
                  <option value="2">2 — Moyen</option>
                  <option value="3">3 — Élevé</option>
                  <option value="4">4 — Très élevé</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Agent exposant</label>
              <input value={form.risk_agent} onChange={e => set('risk_agent', e.target.value)} placeholder="Ex: Silice cristalline"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">EPI requis</label>
              <input value={form.ppe_required} onChange={e => set('ppe_required', e.target.value)} placeholder="Ex: Masque FFP2, lunettes de protection"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mesures préventives</label>
              <textarea value={form.preventive_measures} onChange={e => set('preventive_measures', e.target.value)} rows={2}
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
    </>
  )
}
