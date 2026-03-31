import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ClipboardList, MapPin } from 'lucide-react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Modal } from '../components/ui/Modal'

type Tab = 'sheets' | 'visits'

const RISK_LEVEL_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Faible',      color: 'bg-green-100 text-green-700' },
  2: { label: 'Moyen',       color: 'bg-yellow-100 text-yellow-700' },
  3: { label: 'Élevé',       color: 'bg-orange-100 text-orange-700' },
  4: { label: 'Très élevé',  color: 'bg-red-100 text-red-700' },
}

const EMPTY_SHEET = {
  job_position: '',
  tools_equipment: '',
  work_environment: '',
  work_schedule: '',
  overall_risk_level: '1',
}

const EMPTY_VISIT = {
  job_position: '',
  visit_date: new Date().toISOString().split('T')[0],
  observations: '',
  identified_risks: '',
  recommendations: '',
  follow_up_date: '',
}

export default function JobSheet() {
  const [tab, setTab] = useState<Tab>('sheets')

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader title="Fiche de poste" subtitle="Fiches de poste et visites de terrain" />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('sheets')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'sheets' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          <ClipboardList size={14} /> Fiches de poste
        </button>
        <button onClick={() => setTab('visits')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'visits' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          <MapPin size={14} /> Visites de terrain
        </button>
      </div>

      {tab === 'sheets' ? <SheetsTab /> : <VisitsTab />}
    </div>
  )
}

/* ─── Fiches de poste ────────────────────────────────────────────────────── */

function SheetsTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(EMPTY_SHEET)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['job-sheets', page],
    queryFn: async () => {
      const { data } = await api.get(`/job-sheets/?page=${page}&page_size=20`)
      return data
    },
  })

  const { data: posData } = useQuery({
    queryKey: ['job-positions-all'],
    queryFn: async () => { const { data } = await api.get('/job-positions/?page_size=100'); return data },
    enabled: show,
  })

  const mutation = useMutation({
    mutationFn: async (f: typeof EMPTY_SHEET) => {
      const { data } = await api.post('/job-sheets/', {
        job_position: f.job_position,
        tools_equipment: f.tools_equipment,
        work_environment: f.work_environment,
        work_schedule: f.work_schedule,
        overall_risk_level: Number(f.overall_risk_level),
        task_list: [],
        physical_risks: [], chemical_risks: [], biological_risks: [],
        ergonomic_risks: [], psychosocial_risks: [],
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-sheets'] })
      setShow(false); setForm(EMPTY_SHEET); setError('')
    },
    onError: (err: any) => {
      const d = err?.response?.data
      if (d && typeof d === 'object') setError(Object.entries(d).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | '))
      else setError("Erreur lors de l'enregistrement.")
    },
  })

  const sheets: any[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1
  const positions: any[] = posData?.results ?? []

  function set(f: string, v: string) { setForm(prev => ({ ...prev, [f]: v })) }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => { setShow(true); setError('') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={15} /> Nouvelle fiche
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Poste</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Version</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Niveau de risque</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Environnement</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Créé par</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chargement...</td></tr>
            ) : sheets.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucune fiche de poste.</td></tr>
            ) : sheets.map((s: any) => {
              const lvl = RISK_LEVEL_LABELS[s.overall_risk_level]
              return (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.job_position_title}</td>
                  <td className="px-4 py-3 text-gray-600">v{s.version}</td>
                  <td className="px-4 py-3">
                    {lvl && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lvl.color}`}>{lvl.label}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{s.work_environment || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.created_by_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.is_current ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.is_current ? 'En vigueur' : 'Archivée'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} totalCount={data?.count ?? 0}
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="fiches" />
      </div>

      {show && (
        <Modal title="Nouvelle fiche de poste" onClose={() => setShow(false)}>
          <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(form) }} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Poste de travail *</label>
              <select required value={form.job_position} onChange={e => set('job_position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Sélectionner —</option>
                {positions.map((p: any) => <option key={p.id} value={String(p.id)}>{p.title} ({p.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Niveau de risque global *</label>
              <select required value={form.overall_risk_level} onChange={e => set('overall_risk_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="1">1 — Faible</option>
                <option value="2">2 — Moyen</option>
                <option value="3">3 — Élevé</option>
                <option value="4">4 — Très élevé</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Environnement de travail</label>
              <textarea rows={2} value={form.work_environment} onChange={e => set('work_environment', e.target.value)}
                placeholder="Ex: Site minier à ciel ouvert, exposition solaire intense, poussières..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Outillage / Équipements</label>
              <textarea rows={2} value={form.tools_equipment} onChange={e => set('tools_equipment', e.target.value)}
                placeholder="Ex: Foreuse, marteau-piqueur, chargeur frontal..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Horaires de travail</label>
              <input value={form.work_schedule} onChange={e => set('work_schedule', e.target.value)}
                placeholder="Ex: 2x12h (jour/nuit), rotation hebdomadaire"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShow(false)}
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

/* ─── Visites de terrain ─────────────────────────────────────────────────── */

function VisitsTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(EMPTY_VISIT)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['job-visits', page],
    queryFn: async () => {
      const { data } = await api.get(`/job-visits/?page=${page}&page_size=20`)
      return data
    },
  })

  const { data: posData } = useQuery({
    queryKey: ['job-positions-all'],
    queryFn: async () => { const { data } = await api.get('/job-positions/?page_size=100'); return data },
    enabled: show,
  })

  const mutation = useMutation({
    mutationFn: async (f: typeof EMPTY_VISIT) => {
      const payload: Record<string, any> = {
        job_position: f.job_position,
        visit_date: f.visit_date,
        observations: f.observations,
        identified_risks: f.identified_risks,
        recommendations: f.recommendations,
        action_items: [],
      }
      if (f.follow_up_date) payload.follow_up_date = f.follow_up_date
      const { data } = await api.post('/job-visits/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-visits'] })
      setShow(false); setForm(EMPTY_VISIT); setError('')
    },
    onError: (err: any) => {
      const d = err?.response?.data
      if (d && typeof d === 'object') setError(Object.entries(d).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | '))
      else setError("Erreur lors de l'enregistrement.")
    },
  })

  const visits: any[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1
  const positions: any[] = posData?.results ?? []

  function set(f: string, v: string) { setForm(prev => ({ ...prev, [f]: v })) }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => { setShow(true); setError('') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={15} /> Nouvelle visite
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Poste visité</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Observations</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Risques identifiés</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Prochaine visite</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Visiteur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chargement...</td></tr>
            ) : visits.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucune visite de terrain enregistrée.</td></tr>
            ) : visits.map((v: any) => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600">{new Date(v.visit_date).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{v.job_position_title}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{v.observations || '—'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{v.identified_risks || '—'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {v.follow_up_date ? new Date(v.follow_up_date).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{v.visited_by_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} totalCount={data?.count ?? 0}
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="visites" />
      </div>

      {show && (
        <Modal title="Nouvelle visite de terrain" onClose={() => setShow(false)}>
          <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(form) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Poste visité *</label>
                <select required value={form.job_position} onChange={e => set('job_position', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {positions.map((p: any) => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date de visite *</label>
                <input required type="date" value={form.visit_date} onChange={e => set('visit_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Observations</label>
              <textarea rows={3} value={form.observations} onChange={e => set('observations', e.target.value)}
                placeholder="Description des conditions de travail observées..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Risques identifiés</label>
              <textarea rows={2} value={form.identified_risks} onChange={e => set('identified_risks', e.target.value)}
                placeholder="Ex: Exposition aux poussières de silice, bruit > 85dB..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Recommandations</label>
              <textarea rows={2} value={form.recommendations} onChange={e => set('recommendations', e.target.value)}
                placeholder="Actions correctives recommandées..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date de suivi</label>
              <input type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShow(false)}
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
