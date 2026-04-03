import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Modal } from '../components/ui/Modal'

const ACTIVITY_TYPES: { value: string; label: string; color: string }[] = [
  { value: 'TEST',           label: 'Test',                color: 'bg-blue-100 text-blue-700' },
  { value: 'AWARENESS',      label: 'Sensibilisation',     color: 'bg-purple-100 text-purple-700' },
  { value: 'TRAINING',       label: 'Formation',           color: 'bg-indigo-100 text-indigo-700' },
  { value: 'JOB_VISIT',      label: 'Visite de poste',     color: 'bg-teal-100 text-teal-700' },
  { value: 'INSPECTION',     label: 'Inspection',          color: 'bg-orange-100 text-orange-700' },
  { value: 'COVERAGE',       label: 'Couverture médicale', color: 'bg-green-100 text-green-700' },
]
const TYPE_MAP = Object.fromEntries(ACTIVITY_TYPES.map(t => [t.value, t]))

const EMPTY = {
  activity_type: 'TEST',
  title: '',
  activity_date: new Date().toISOString().split('T')[0],
  location: '',
  participants_count: '0',
  description: '',
  outcome: '',
}

export default function Activities() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteItem, setDeleteItem] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['activities', search, typeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: '20' })
      if (search)     params.set('search', search)
      if (typeFilter) params.set('activity_type', typeFilter)
      const { data } = await api.get(`/activities/?${params}`)
      return data
    },
  })

  const mutation = useMutation({
    mutationFn: async (f: typeof EMPTY) => {
      const { data } = await api.post('/activities/', {
        ...f,
        participants_count: Number(f.participants_count),
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] })
      toast('Enregistrement réussi')
      setShow(false); setForm(EMPTY); setError('')
    },
    onError: (err: any) => {
      const d = err?.response?.data
      const errMsg = d && typeof d === 'object' ? Object.entries(d).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | ') : "Erreur lors de l'enregistrement."
      toast(errMsg, 'error')
      setError(errMsg)
    },
  })

  const editMutation = useMutation({
    mutationFn: async (f: typeof EMPTY) => {
      const { data } = await api.patch(`/activities/${editItem!.id}/`, {
        ...f,
        participants_count: Number(f.participants_count),
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] })
      toast('Modification réussie')
      setEditItem(null)
      setShow(false)
      setForm(EMPTY)
      setError('')
    },
    onError: (err: any) => {
      const d = err?.response?.data
      const errMsg = d && typeof d === 'object' ? Object.entries(d).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | ') : "Erreur lors de la modification."
      toast(errMsg, 'error')
      setError(errMsg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/activities/${id}/`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] })
      toast('Suppression réussie')
      setDeleteItem(null)
    },
  })

  const activities: any[] = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1

  function set(f: string, v: string) { setForm(prev => ({ ...prev, [f]: v })) }

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
        title="Activités du service médical"
        subtitle={`${data?.count ?? 0} activité(s)`}
        action={
          <button onClick={() => { setShow(true); setEditItem(null); setForm(EMPTY); setError('') }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} /> Nouvelle activité
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Titre, lieu..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les types</option>
          {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Titre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Lieu</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Participants</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Réalisé par</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Chargement...</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Aucune activité enregistrée.</td></tr>
            ) : activities.map((a: any) => {
              const typeMeta = TYPE_MAP[a.activity_type]
              return (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">{new Date(a.activity_date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    {a.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{a.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {typeMeta && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeMeta.color}`}>{typeMeta.label}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.location || '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-700 font-medium">{a.participants_count}</td>
                  <td className="px-4 py-3 text-gray-600">{a.conducted_by_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => {
                        setEditItem(a)
                        setForm({
                          activity_type: a.activity_type,
                          title: a.title,
                          activity_date: a.activity_date,
                          location: a.location ?? '',
                          participants_count: String(a.participants_count ?? 0),
                          description: a.description ?? '',
                          outcome: a.outcome ?? '',
                        })
                        setShow(true)
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
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="activités" />
      </div>

      {show && (
        <Modal title={editItem ? "Modifier l'activité" : "Nouvelle activité du service médical"} onClose={() => { setShow(false); setEditItem(null); setForm(EMPTY) }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type d'activité *</label>
              <select required value={form.activity_type} onChange={e => set('activity_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Titre *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="Ex: Sensibilisation au paludisme — Site Boto"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                <input required type="date" value={form.activity_date} onChange={e => set('activity_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Lieu</label>
                <input value={form.location} onChange={e => set('location', e.target.value)}
                  placeholder="Ex: Salle de réunion Boto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de participants</label>
              <input type="number" min="0" value={form.participants_count} onChange={e => set('participants_count', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Contenu, objectifs de l'activité..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Résultat / Bilan</label>
              <textarea rows={2} value={form.outcome} onChange={e => set('outcome', e.target.value)}
                placeholder="Résultats obtenus, difficultés rencontrées..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShow(false); setEditItem(null); setForm(EMPTY) }}
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
          <p className="text-sm text-gray-700 mb-6">Voulez-vous vraiment supprimer <strong>l'activité "{deleteItem.title}"</strong> ? Cette action est irréversible.</p>
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
