import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Plus, CheckCircle, XCircle, Play, Pencil, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { Badge, APPOINTMENT_STATUS } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Modal } from '../components/ui/Modal'
import type { Appointment, AppointmentStatus } from '../lib/types'

const STATUSES: { value: AppointmentStatus | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'CONFIRMED', label: 'Confirmé' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminé' },
  { value: 'CANCELLED', label: 'Annulé' },
  { value: 'NO_SHOW', label: 'Absent' },
]

const EMPTY = { worker: '', doctor: '', appointment_type: '', scheduled_at: '', reason: '' }

export default function Appointments() {
  const qc = useQueryClient()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState<AppointmentStatus | ''>('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteItem, setDeleteItem] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', date, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: '20' })
      if (date) params.set('scheduled_date', date)
      if (status) params.set('status', status)
      const { data } = await api.get(`/appointments/?${params}`)
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

  const { data: apptTypesData } = useQuery({
    queryKey: ['appointment-types'],
    queryFn: async () => { const { data } = await api.get('/appointment-types/?page_size=50'); return data },
    enabled: showModal || editItem !== null,
  })

  const action = useMutation({
    mutationFn: ({ id, act }: { id: number; act: 'confirm' | 'cancel' | 'start' }) =>
      api.post(`/appointments/${id}/${act}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const { data } = await api.post('/appointments/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
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
    mutationFn: async (payload: Record<string, string>) => {
      const { data } = await api.patch(`/appointments/${editItem!.id}/`, payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
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
      await api.delete(`/appointments/${id}/`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      setDeleteItem(null)
    },
  })

  const appointments: Appointment[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const payload: Record<string, string> = { ...form }
    if (!payload.appointment_type) delete payload.appointment_type
    if (editItem) {
      editMutation.mutate(payload)
    } else {
      mutation.mutate(payload)
    }
  }

  const workers = workersData?.results ?? []
  const doctors = (usersData?.results ?? usersData ?? []).filter((u: any) => ['DOCTOR', 'SUPER_ADMIN'].includes(u.role))
  const apptTypes = apptTypesData?.results ?? apptTypesData ?? []

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader
        title="Rendez-vous"
        subtitle={`${data?.count ?? 0} rendez-vous`}
        action={
          <button
            onClick={() => { setShowModal(true); setEditItem(null); setForm(EMPTY); setError('') }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} /> Nouveau RV
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-gray-400" />
          <input
            type="date" value={date}
            onChange={(e) => { setDate(e.target.value); setPage(1) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {date && (
            <button onClick={() => setDate('')} className="text-xs text-gray-400 hover:text-gray-600 underline">Tous</button>
          )}
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as AppointmentStatus | ''); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date / Heure</th>
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
            ) : appointments.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Aucun rendez-vous.</td></tr>
            ) : appointments.map((a) => {
              const badge = APPOINTMENT_STATUS[a.status]
              return (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700">
                    <p>{new Date(a.scheduled_at).toLocaleDateString('fr-FR')}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(a.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{a.worker.first_name} {a.worker.last_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{a.worker.matricule}</p>
                  </td>
                  <td className="px-4 py-3">
                    {a.appointment_type ? (
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: a.appointment_type.color_hex }} />
                        {a.appointment_type.name}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">Dr {a.doctor.last_name}</td>
                  <td className="px-4 py-3">{badge && <Badge label={badge.label} color={badge.color} />}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {a.status === 'PENDING' && (
                        <button onClick={() => action.mutate({ id: a.id, act: 'confirm' })} title="Confirmer"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {(a.status === 'PENDING' || a.status === 'CONFIRMED') && (
                        <>
                          <button onClick={() => action.mutate({ id: a.id, act: 'start' })} title="Démarrer"
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <Play size={15} />
                          </button>
                          <button onClick={() => action.mutate({ id: a.id, act: 'cancel' })} title="Annuler"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                      <button onClick={() => {
                        setEditItem(a)
                        setForm({
                          worker: String(a.worker.id),
                          doctor: String(a.doctor.id),
                          appointment_type: a.appointment_type ? String(a.appointment_type.id) : '',
                          scheduled_at: a.scheduled_at ? a.scheduled_at.slice(0, 16) : '',
                          reason: a.reason ?? '',
                        })
                        setShowModal(true)
                        setError('')
                      }}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteItem(a)}
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
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="rendez-vous" />
      </div>

      {showModal && (
        <Modal title={editItem ? "Modifier le rendez-vous" : "Nouveau rendez-vous"} onClose={() => { setShowModal(false); setEditItem(null); setForm(EMPTY) }}>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Type de RV</label>
              <select value={form.appointment_type} onChange={e => set('appointment_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Sélectionner —</option>
                {apptTypes.map((t: any) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date et heure *</label>
              <input required type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Motif</label>
              <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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
          <p className="text-sm text-gray-700 mb-6">Voulez-vous vraiment supprimer <strong>le rendez-vous du {new Date(deleteItem.scheduled_at).toLocaleDateString('fr-FR')}</strong> ? Cette action est irréversible.</p>
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
