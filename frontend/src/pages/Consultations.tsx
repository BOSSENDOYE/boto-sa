import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { Badge, ENCOUNTER_STATUS } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Modal } from '../components/ui/Modal'
import type { Consultation } from '../lib/types'

const EMPTY = {
  worker: '', doctor: '',
  encounter_date: new Date().toISOString().split('T')[0],
  encounter_time: '',
  chief_complaint: '',
  disease_history: '',
  family_history: '',
  personal_history: '',
  physical_exam_findings: '',
  working_diagnosis: '',
  final_diagnosis: '',
  icd10_code: '',
  treatment_plan: '',
  referral_needed: 'false',
  referral_note: '',
  follow_up_date: '',
  sick_leave_days: '0',
  work_restriction: '',
}

export default function Consultations() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [referral, setReferral] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteItem, setDeleteItem] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['consultations', search, referral, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: '20' })
      if (search) params.set('search', search)
      if (referral) params.set('referral_needed', referral)
      const { data } = await api.get(`/consultations/?${params}`)
      return data
    },
  })

  const { data: workersData } = useQuery({
    queryKey: ['workers-all'],
    queryFn: async () => { const { data } = await api.get('/workers/?page_size=200'); return data },
    enabled: showModal && !editItem,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-all'],
    queryFn: async () => { const { data } = await api.get('/auth/users/?page_size=100'); return data },
    enabled: showModal && !editItem,
  })

  const mutation = useMutation({
    mutationFn: async (payload: typeof EMPTY) => {
      // Step 1: create encounter
      const encRes = await api.post('/encounters/', {
        worker: payload.worker,
        doctor: payload.doctor,
        encounter_date: payload.encounter_date,
        encounter_time: payload.encounter_time || undefined,
        encounter_type: 'CONSULTATION',
      })
      // Step 2: create consultation
      const body: Record<string, any> = {
        encounter: encRes.data.id,
        chief_complaint: payload.chief_complaint,
        disease_history: payload.disease_history,
        family_history: payload.family_history,
        personal_history: payload.personal_history,
        physical_exam_findings: payload.physical_exam_findings,
        working_diagnosis: payload.working_diagnosis,
        final_diagnosis: payload.final_diagnosis,
        icd10_code: payload.icd10_code,
        treatment_plan: payload.treatment_plan,
        referral_needed: payload.referral_needed === 'true',
        referral_note: payload.referral_note,
        sick_leave_days: payload.sick_leave_days,
        work_restriction: payload.work_restriction,
      }
      if (payload.follow_up_date) body.follow_up_date = payload.follow_up_date
      const { data } = await api.post('/consultations/', body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] })
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
      const body: Record<string, any> = {
        chief_complaint: payload.chief_complaint,
        disease_history: payload.disease_history,
        family_history: payload.family_history,
        personal_history: payload.personal_history,
        physical_exam_findings: payload.physical_exam_findings,
        working_diagnosis: payload.working_diagnosis,
        final_diagnosis: payload.final_diagnosis,
        icd10_code: payload.icd10_code,
        treatment_plan: payload.treatment_plan,
        referral_needed: payload.referral_needed === 'true',
        referral_note: payload.referral_note,
        sick_leave_days: payload.sick_leave_days,
        work_restriction: payload.work_restriction,
      }
      if (payload.follow_up_date) body.follow_up_date = payload.follow_up_date
      const { data } = await api.patch(`/consultations/${editItem!.id}/`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] })
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
      await api.delete(`/consultations/${id}/`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] })
      setDeleteItem(null)
    },
  })

  const consultations: Consultation[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1
  const workers = workersData?.results ?? []
  const doctors = (usersData?.results ?? usersData ?? []).filter((u: any) => ['DOCTOR', 'SUPER_ADMIN'].includes(u.role))

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
        title="Consultations"
        subtitle={`${data?.count ?? 0} consultation(s)`}
        action={
          <button onClick={() => { setShowModal(true); setEditItem(null); setForm(EMPTY); setError('') }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} /> Nouvelle consultation
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Plainte, diagnostic, nom..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
        </div>
        <select value={referral} onChange={(e) => { setReferral(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous (référencement)</option>
          <option value="true">Référencement requis</option>
          <option value="false">Sans référencement</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Travailleur</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Motif principal</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Diagnostic final</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Arrêt (j.)</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Chargement...</td></tr>
            ) : consultations.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Aucune consultation trouvée.</td></tr>
            ) : consultations.map((c: any) => {
              const statusBadge = ENCOUNTER_STATUS[c.encounter?.status ?? '']
              return (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">
                    {c.encounter_date ? new Date(c.encounter_date).toLocaleDateString('fr-FR') : new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.worker_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{c.worker_matricule}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">{c.chief_complaint || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">
                    {c.final_diagnosis || c.working_diagnosis || '—'}
                    {c.icd10_code && <span className="ml-1 text-xs text-gray-400 font-mono">({c.icd10_code})</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.sick_leave_days > 0 ? <span className="text-orange-600 font-medium">{c.sick_leave_days}</span> : '0'}
                  </td>
                  <td className="px-4 py-3">{statusBadge && <Badge label={statusBadge.label} color={statusBadge.color} />}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => {
                        setEditItem(c)
                        setForm({
                          ...EMPTY,
                          worker: String(c.encounter?.worker?.id ?? ''),
                          doctor: String(c.encounter?.doctor?.id ?? ''),
                          encounter_date: c.encounter_date ?? EMPTY.encounter_date,
                          encounter_time: '',
                          chief_complaint: c.chief_complaint ?? '',
                          disease_history: c.disease_history ?? '',
                          family_history: c.family_history ?? '',
                          personal_history: c.personal_history ?? '',
                          physical_exam_findings: c.physical_exam_findings ?? '',
                          working_diagnosis: c.working_diagnosis ?? '',
                          final_diagnosis: c.final_diagnosis ?? '',
                          icd10_code: c.icd10_code ?? '',
                          treatment_plan: c.treatment_plan ?? '',
                          referral_needed: c.referral_needed ? 'true' : 'false',
                          referral_note: c.referral_note ?? '',
                          follow_up_date: c.follow_up_date ?? '',
                          sick_leave_days: String(c.sick_leave_days ?? 0),
                          work_restriction: c.work_restriction ?? '',
                        })
                        setShowModal(true)
                        setError('')
                      }}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteItem(c)}
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
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="consultations" />
      </div>

      {showModal && (
        <Modal title={editItem ? "Modifier la consultation" : "Nouvelle consultation"} onClose={() => { setShowModal(false); setEditItem(null); setForm(EMPTY) }} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identité & date — only shown for new consultations */}
            {!editItem && (
              <>
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Médecin *</label>
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Heure</label>
                    <input type="time" value={form.encounter_time} onChange={e => set('encounter_time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </>
            )}

            {editItem && (
              <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                Travailleur, médecin et date ne peuvent pas être modifiés.
              </p>
            )}

            {/* Motif & anamnèse */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Anamnèse</p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Motif de consultation {!editItem && '*'}</label>
              <textarea required={!editItem} value={form.chief_complaint} onChange={e => set('chief_complaint', e.target.value)}
                rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Histoire de la maladie</label>
              <textarea value={form.disease_history} onChange={e => set('disease_history', e.target.value)}
                rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Antécédents familiaux</label>
                <textarea value={form.family_history} onChange={e => set('family_history', e.target.value)}
                  rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Antécédents personnels</label>
                <textarea value={form.personal_history} onChange={e => set('personal_history', e.target.value)}
                  rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>

            {/* Examen & diagnostic */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Examen & diagnostic</p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Résultats de l'examen physique</label>
              <textarea value={form.physical_exam_findings} onChange={e => set('physical_exam_findings', e.target.value)}
                rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Diagnostic de travail</label>
              <input value={form.working_diagnosis} onChange={e => set('working_diagnosis', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Diagnostic final</label>
              <input value={form.final_diagnosis} onChange={e => set('final_diagnosis', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Code CIM-10</label>
              <input value={form.icd10_code} onChange={e => set('icd10_code', e.target.value)} placeholder="Ex: J06.9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Plan de traitement */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Plan de prise en charge</p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Plan de traitement</label>
              <textarea value={form.treatment_plan} onChange={e => set('treatment_plan', e.target.value)}
                rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Arrêt de travail (jours)</label>
                <input type="number" min="0" value={form.sick_leave_days} onChange={e => set('sick_leave_days', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date de suivi</label>
                <input type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Restriction de travail</label>
              <input value={form.work_restriction} onChange={e => set('work_restriction', e.target.value)}
                placeholder="Ex: Pas de port de charge > 10 kg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.referral_needed === 'true'}
                  onChange={e => set('referral_needed', e.target.checked ? 'true' : 'false')}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                Référencement nécessaire
              </label>
            </div>
            {form.referral_needed === 'true' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Note de référencement</label>
                <textarea value={form.referral_note} onChange={e => set('referral_note', e.target.value)}
                  rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            )}

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
          <p className="text-sm text-gray-700 mb-6">Voulez-vous vraiment supprimer <strong>la consultation de {deleteItem.worker_name}</strong> ? Cette action est irréversible.</p>
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
