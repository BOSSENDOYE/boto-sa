import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Activity, FlaskConical, Pill, Scissors, Pencil, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'

type Tab = 'vitals' | 'rdts' | 'medications' | 'dressings'

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: 'vitals',      label: 'Constantes',  icon: Activity },
  { value: 'rdts',        label: 'Tests (TDR)', icon: FlaskConical },
  { value: 'medications', label: 'Médicaments', icon: Pill },
  { value: 'dressings',   label: 'Pansements',  icon: Scissors },
]

const RDT_TYPES = [
  { value: 'MALARIA',  label: 'Paludisme' },
  { value: 'HIV',      label: 'VIH' },
  { value: 'HEP_B',   label: 'Hépatite B' },
  { value: 'HEP_C',   label: 'Hépatite C' },
  { value: 'SYPHILIS', label: 'Syphilis' },
  { value: 'GLYCEMIA', label: 'Glycémie' },
  { value: 'OTHER',    label: 'Autre' },
]
const RDT_RESULTS = [
  { value: 'POSITIVE', label: 'Positif',   color: 'bg-red-100 text-red-700' },
  { value: 'NEGATIVE', label: 'Négatif',   color: 'bg-green-100 text-green-700' },
  { value: 'INVALID',  label: 'Invalide',  color: 'bg-gray-100 text-gray-600' },
  { value: 'PENDING',  label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
]

export default function NursingActs() {
  const [tab, setTab] = useState<Tab>('vitals')

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader title="Actes infirmiers" subtitle="Constantes, TDR, Médicaments, Pansements" />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button key={value} onClick={() => setTab(value)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === 'vitals'      && <VitalsTab />}
      {tab === 'rdts'        && <RDTsTab />}
      {tab === 'medications' && <MedicationsTab />}
      {tab === 'dressings'   && <DressingsTab />}
    </div>
  )
}

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function useWorkers(enabled: boolean) {
  return useQuery({
    queryKey: ['workers-all'],
    queryFn: async () => { const { data } = await api.get('/workers/?page_size=200'); return data },
    enabled,
  })
}
function useUsers(enabled: boolean) {
  return useQuery({
    queryKey: ['users-all'],
    queryFn: async () => { const { data } = await api.get('/auth/users/?page_size=100'); return data },
    enabled,
  })
}

function errMsg(err: any) {
  const d = err?.response?.data
  if (d && typeof d === 'object') return Object.entries(d).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | ')
  return "Erreur lors de l'enregistrement."
}

async function createEncounter(worker: string, doctor: string, date: string, time: string) {
  const { data } = await api.post('/encounters/', {
    worker, doctor,
    encounter_date: date,
    encounter_time: time || undefined,
    encounter_type: 'ACT',
  })
  return data
}

/* ─── Constantes ─────────────────────────────────────────────────────────── */

const EMPTY_VITALS = {
  worker: '', doctor: '',
  encounter_date: new Date().toISOString().split('T')[0], encounter_time: '',
  weight_kg: '', height_cm: '', bp_systolic: '', bp_diastolic: '',
  heart_rate: '', respiratory_rate: '', temperature: '', oxygen_saturation: '',
  notes: '',
}

function VitalsTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(EMPTY_VITALS)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['acts-vitals', page],
    queryFn: async () => {
      const { data } = await api.get(`/encounters/?encounter_type=ACT&page=${page}&page_size=20`)
      return data
    },
  })

  const { data: workersData } = useWorkers(show)
  const { data: usersData }   = useUsers(show)

  const mutation = useMutation({
    mutationFn: async (f: typeof EMPTY_VITALS) => {
      const enc = await createEncounter(f.worker, f.doctor, f.encounter_date, f.encounter_time)
      const payload: Record<string, any> = {}
      if (f.weight_kg)         payload.weight_kg = f.weight_kg
      if (f.height_cm)         payload.height_cm = f.height_cm
      if (f.bp_systolic)       payload.bp_systolic = f.bp_systolic
      if (f.bp_diastolic)      payload.bp_diastolic = f.bp_diastolic
      if (f.heart_rate)        payload.heart_rate = f.heart_rate
      if (f.respiratory_rate)  payload.respiratory_rate = f.respiratory_rate
      if (f.temperature)       payload.temperature = f.temperature
      if (f.oxygen_saturation) payload.oxygen_saturation = f.oxygen_saturation
      if (f.notes)             payload.notes = f.notes
      await api.post(`/encounters/${enc.id}/vitals/`, payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['acts-vitals'] }); setShow(false); setForm(EMPTY_VITALS); setError('') },
    onError: (e: any) => setError(errMsg(e)),
  })

  const workers = workersData?.results ?? []
  const doctors = (usersData?.results ?? usersData ?? []).filter((u: any) => ['DOCTOR', 'SUPER_ADMIN', 'NURSE'].includes(u.role))
  const encounters: any[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1

  function set(f: string, v: string) { setForm(prev => ({ ...prev, [f]: v })) }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => { setShow(true); setError('') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={15} /> Nouvelles constantes
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Travailleur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">TA (mmHg)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">FC (/min)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Temp. (°C)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">SpO2 (%)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Poids/Taille</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Chargement...</td></tr>
            ) : encounters.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Aucune constante enregistrée.</td></tr>
            ) : encounters.map((enc) =>
              (enc.vitals?.length > 0 ? enc.vitals : [null]).map((v: any, vi: number) => (
                <tr key={`${enc.id}-${vi}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{new Date(enc.encounter_date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{enc.worker_name}</td>
                  {v ? <>
                    <td className="px-4 py-3 text-gray-700">{v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{v.heart_rate ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{v.temperature ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{v.oxygen_saturation ? `${v.oxygen_saturation}%` : '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{v.weight_kg ? `${v.weight_kg}kg` : '—'}{v.height_cm ? ` / ${v.height_cm}cm` : ''}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => {
                          // TODO: Implement edit
                        }}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Modifier">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => {
                          // TODO: Implement delete
                        }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </> : <td colSpan={6} className="px-4 py-3 text-gray-400 italic">Pas de constantes</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="disabled:opacity-40 hover:text-gray-700">Précédent</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="disabled:opacity-40 hover:text-gray-700">Suivant</button>
        </div>
      </div>

      {show && (
        <Modal title="Nouvelles constantes" onClose={() => setShow(false)}>
          <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(form) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Travailleur *</label>
                <select required value={form.worker} onChange={e => set('worker', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {workers.map((w: any) => <option key={w.id} value={String(w.id)}>{w.last_name} {w.first_name} ({w.matricule})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Médecin / Infirmier *</label>
                <select required value={form.doctor} onChange={e => set('doctor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {doctors.map((u: any) => <option key={u.id} value={String(u.id)}>{u.last_name} {u.first_name}</option>)}
                </select>
              </div>
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
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Constantes</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Poids (kg)</label>
                <input type="number" step="0.1" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Taille (cm)</label>
                <input type="number" value={form.height_cm} onChange={e => set('height_cm', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">TA Systolique (mmHg)</label>
                <input type="number" value={form.bp_systolic} onChange={e => set('bp_systolic', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">TA Diastolique (mmHg)</label>
                <input type="number" value={form.bp_diastolic} onChange={e => set('bp_diastolic', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fréquence cardiaque (/min)</label>
                <input type="number" value={form.heart_rate} onChange={e => set('heart_rate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fréquence respiratoire (/min)</label>
                <input type="number" value={form.respiratory_rate} onChange={e => set('respiratory_rate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Température (°C)</label>
                <input type="number" step="0.1" value={form.temperature} onChange={e => set('temperature', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SpO2 (%)</label>
                <input type="number" min="0" max="100" value={form.oxygen_saturation} onChange={e => set('oxygen_saturation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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

/* ─── TDR ────────────────────────────────────────────────────────────────── */

const EMPTY_RDT = {
  worker: '', doctor: '',
  encounter_date: new Date().toISOString().split('T')[0], encounter_time: '',
  test_type: 'MALARIA', test_name: '', result: 'PENDING', notes: '',
}

function RDTsTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(EMPTY_RDT)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['acts-rdts', page],
    queryFn: async () => {
      const { data } = await api.get(`/encounters/?encounter_type=ACT&page=${page}&page_size=20`)
      return data
    },
  })

  const { data: workersData } = useWorkers(show)
  const { data: usersData }   = useUsers(show)

  const mutation = useMutation({
    mutationFn: async (f: typeof EMPTY_RDT) => {
      const enc = await createEncounter(f.worker, f.doctor, f.encounter_date, f.encounter_time)
      await api.post(`/encounters/${enc.id}/rdts/`, {
        test_type: f.test_type, test_name: f.test_name,
        result: f.result, notes: f.notes,
      })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['acts-rdts'] }); setShow(false); setForm(EMPTY_RDT); setError('') },
    onError: (e: any) => setError(errMsg(e)),
  })

  const workers = workersData?.results ?? []
  const doctors = (usersData?.results ?? usersData ?? []).filter((u: any) => ['DOCTOR', 'SUPER_ADMIN', 'NURSE'].includes(u.role))
  const encounters: any[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1

  function set(f: string, v: string) { setForm(prev => ({ ...prev, [f]: v })) }

  const rdtRows = encounters.flatMap((enc: any) =>
    enc.rdts?.length > 0
      ? enc.rdts.map((r: any) => ({ ...r, _worker: enc.worker_name, _date: enc.encounter_date }))
      : []
  )

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => { setShow(true); setError('') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={15} /> Nouveau TDR
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Travailleur</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type de test</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Résultat</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Chargement...</td></tr>
            ) : rdtRows.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucun TDR enregistré.</td></tr>
            ) : rdtRows.map((r: any) => {
              const resMeta = RDT_RESULTS.find(x => x.value === r.result)
              const typeMeta = RDT_TYPES.find(x => x.value === r.test_type)
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{new Date(r._date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r._worker}</td>
                  <td className="px-4 py-3 text-gray-700">{typeMeta?.label ?? r.test_type}{r.test_name ? ` — ${r.test_name}` : ''}</td>
                  <td className="px-4 py-3">
                    {resMeta && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${resMeta.color}`}>{resMeta.label}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{r.notes || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="disabled:opacity-40 hover:text-gray-700">Précédent</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="disabled:opacity-40 hover:text-gray-700">Suivant</button>
        </div>
      </div>

      {show && (
        <Modal title="Nouveau test de diagnostic rapide" onClose={() => setShow(false)}>
          <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(form) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Travailleur *</label>
                <select required value={form.worker} onChange={e => set('worker', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {workers.map((w: any) => <option key={w.id} value={String(w.id)}>{w.last_name} {w.first_name} ({w.matricule})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Réalisé par *</label>
                <select required value={form.doctor} onChange={e => set('doctor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {doctors.map((u: any) => <option key={u.id} value={String(u.id)}>{u.last_name} {u.first_name}</option>)}
                </select>
              </div>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type de test *</label>
                <select required value={form.test_type} onChange={e => set('test_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {RDT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Résultat *</label>
                <select required value={form.result} onChange={e => set('result', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {RDT_RESULTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom du kit (optionnel)</label>
              <input value={form.test_name} onChange={e => set('test_name', e.target.value)} placeholder="Ex: SD Bioline Malaria Ag P.f"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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

/* ─── Médicaments ────────────────────────────────────────────────────────── */

const EMPTY_MED = {
  worker: '', doctor: '',
  encounter_date: new Date().toISOString().split('T')[0], encounter_time: '',
  drug_name: '', dosage: '', route: 'oral', frequency: '', duration_days: '', instructions: '',
}

function MedicationsTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(EMPTY_MED)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['acts-meds', page],
    queryFn: async () => {
      const { data } = await api.get(`/encounters/?encounter_type=ACT&page=${page}&page_size=20`)
      return data
    },
  })

  const { data: workersData } = useWorkers(show)
  const { data: usersData }   = useUsers(show)

  const mutation = useMutation({
    mutationFn: async (f: typeof EMPTY_MED) => {
      const enc = await createEncounter(f.worker, f.doctor, f.encounter_date, f.encounter_time)
      const payload: Record<string, any> = {
        drug_name: f.drug_name, dosage: f.dosage, route: f.route, frequency: f.frequency,
      }
      if (f.duration_days) payload.duration_days = f.duration_days
      if (f.instructions)  payload.instructions  = f.instructions
      await api.post(`/encounters/${enc.id}/medications/`, payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['acts-meds'] }); setShow(false); setForm(EMPTY_MED); setError('') },
    onError: (e: any) => setError(errMsg(e)),
  })

  const workers = workersData?.results ?? []
  const doctors = (usersData?.results ?? usersData ?? []).filter((u: any) => ['DOCTOR', 'SUPER_ADMIN'].includes(u.role))
  const encounters: any[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1

  function set(f: string, v: string) { setForm(prev => ({ ...prev, [f]: v })) }

  const medRows = encounters.flatMap((enc: any) =>
    enc.medications?.length > 0
      ? enc.medications.map((m: any) => ({ ...m, _worker: enc.worker_name, _date: enc.encounter_date }))
      : []
  )

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => { setShow(true); setError('') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={15} /> Nouveau médicament
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Travailleur</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Médicament</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Posologie</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Voie</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Durée</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chargement...</td></tr>
            ) : medRows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucune prescription enregistrée.</td></tr>
            ) : medRows.map((m: any) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{new Date(m._date).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{m._worker}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{m.drug_name}</td>
                <td className="px-4 py-3 text-gray-700">{m.dosage} — {m.frequency}</td>
                <td className="px-4 py-3 text-gray-600">{m.route}</td>
                <td className="px-4 py-3 text-gray-600">{m.duration_days ? `${m.duration_days}j` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="disabled:opacity-40 hover:text-gray-700">Précédent</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="disabled:opacity-40 hover:text-gray-700">Suivant</button>
        </div>
      </div>

      {show && (
        <Modal title="Prescription médicamenteuse" onClose={() => setShow(false)}>
          <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(form) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Travailleur *</label>
                <select required value={form.worker} onChange={e => set('worker', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {workers.map((w: any) => <option key={w.id} value={String(w.id)}>{w.last_name} {w.first_name} ({w.matricule})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Prescrit par *</label>
                <select required value={form.doctor} onChange={e => set('doctor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {doctors.map((u: any) => <option key={u.id} value={String(u.id)}>Dr {u.last_name} {u.first_name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                <input required type="date" value={form.encounter_date} onChange={e => set('encounter_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Médicament *</label>
                <input required value={form.drug_name} onChange={e => set('drug_name', e.target.value)} placeholder="Ex: Paracétamol 1g"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Dosage *</label>
                <input required value={form.dosage} onChange={e => set('dosage', e.target.value)} placeholder="Ex: 1 comprimé"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Voie *</label>
                <select required value={form.route} onChange={e => set('route', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="oral">Orale</option>
                  <option value="IV">Intraveineuse</option>
                  <option value="IM">Intramusculaire</option>
                  <option value="SC">Sous-cutanée</option>
                  <option value="topique">Topique</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Durée (jours)</label>
                <input type="number" min="1" value={form.duration_days} onChange={e => set('duration_days', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fréquence *</label>
              <input required value={form.frequency} onChange={e => set('frequency', e.target.value)} placeholder="Ex: 3 fois par jour"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Instructions</label>
              <textarea rows={2} value={form.instructions} onChange={e => set('instructions', e.target.value)} placeholder="Ex: Prendre après le repas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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

/* ─── Pansements ─────────────────────────────────────────────────────────── */

const EMPTY_DRESS = {
  worker: '', doctor: '',
  encounter_date: new Date().toISOString().split('T')[0], encounter_time: '',
  wound_location: '', wound_type: '', dressing_type: '', products_used: '',
  wound_size_cm: '', notes: '',
}

function DressingsTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(EMPTY_DRESS)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['acts-dressings', page],
    queryFn: async () => {
      const { data } = await api.get(`/encounters/?encounter_type=ACT&page=${page}&page_size=20`)
      return data
    },
  })

  const { data: workersData } = useWorkers(show)
  const { data: usersData }   = useUsers(show)

  const mutation = useMutation({
    mutationFn: async (f: typeof EMPTY_DRESS) => {
      const enc = await createEncounter(f.worker, f.doctor, f.encounter_date, f.encounter_time)
      await api.post(`/encounters/${enc.id}/dressings/`, {
        wound_location: f.wound_location, wound_type: f.wound_type,
        dressing_type: f.dressing_type, products_used: f.products_used,
        wound_size_cm: f.wound_size_cm, notes: f.notes,
      })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['acts-dressings'] }); setShow(false); setForm(EMPTY_DRESS); setError('') },
    onError: (e: any) => setError(errMsg(e)),
  })

  const workers = workersData?.results ?? []
  const doctors = (usersData?.results ?? usersData ?? []).filter((u: any) => ['DOCTOR', 'SUPER_ADMIN', 'NURSE'].includes(u.role))
  const encounters: any[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1

  function set(f: string, v: string) { setForm(prev => ({ ...prev, [f]: v })) }

  const dressRows = encounters.flatMap((enc: any) =>
    enc.dressings?.length > 0
      ? enc.dressings.map((d: any) => ({ ...d, _worker: enc.worker_name, _date: enc.encounter_date }))
      : []
  )

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => { setShow(true); setError('') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={15} /> Nouveau pansement
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Travailleur</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Localisation</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type de plaie</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type de pansement</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Produits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chargement...</td></tr>
            ) : dressRows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun pansement enregistré.</td></tr>
            ) : dressRows.map((d: any) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{new Date(d._date).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{d._worker}</td>
                <td className="px-4 py-3 text-gray-700">{d.wound_location}</td>
                <td className="px-4 py-3 text-gray-700">{d.wound_type}</td>
                <td className="px-4 py-3 text-gray-700">{d.dressing_type}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{d.products_used || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="disabled:opacity-40 hover:text-gray-700">Précédent</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="disabled:opacity-40 hover:text-gray-700">Suivant</button>
        </div>
      </div>

      {show && (
        <Modal title="Nouveau pansement" onClose={() => setShow(false)}>
          <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(form) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Travailleur *</label>
                <select required value={form.worker} onChange={e => set('worker', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {workers.map((w: any) => <option key={w.id} value={String(w.id)}>{w.last_name} {w.first_name} ({w.matricule})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Réalisé par *</label>
                <select required value={form.doctor} onChange={e => set('doctor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {doctors.map((u: any) => <option key={u.id} value={String(u.id)}>{u.last_name} {u.first_name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                <input required type="date" value={form.encounter_date} onChange={e => set('encounter_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Localisation de la plaie *</label>
                <input required value={form.wound_location} onChange={e => set('wound_location', e.target.value)} placeholder="Ex: Main droite"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type de plaie *</label>
                <input required value={form.wound_type} onChange={e => set('wound_type', e.target.value)} placeholder="Ex: Coupure, brûlure..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type de pansement *</label>
                <input required value={form.dressing_type} onChange={e => set('dressing_type', e.target.value)} placeholder="Ex: Compresse stérile"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Taille (cm)</label>
                <input value={form.wound_size_cm} onChange={e => set('wound_size_cm', e.target.value)} placeholder="Ex: 3x2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Produits utilisés</label>
                <input value={form.products_used} onChange={e => set('products_used', e.target.value)} placeholder="Ex: Bétadine, Dakin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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
