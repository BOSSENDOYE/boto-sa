import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, UserCheck, UserX, Pencil, Trash2 } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Modal } from '../components/ui/Modal'
import type { User, UserRole } from '../lib/types'

const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'SUPER_ADMIN',  label: 'Super Admin',  color: 'bg-purple-100 text-purple-700' },
  { value: 'DOCTOR',       label: 'Médecin',      color: 'bg-blue-100 text-blue-700' },
  { value: 'NURSE',        label: 'Infirmier(e)',  color: 'bg-teal-100 text-teal-700' },
  { value: 'TECHNICIAN',   label: 'Technicien',   color: 'bg-orange-100 text-orange-700' },
  { value: 'HR_ADMIN',     label: 'RH Admin',     color: 'bg-green-100 text-green-700' },
  { value: 'VIEWER',       label: 'Lecteur',      color: 'bg-gray-100 text-gray-700' },
]

const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.value, r]))

const EMPTY = {
  email: '', first_name: '', last_name: '',
  role: 'VIEWER' as UserRole,
  password: '', phone: '', specialization: '',
}

export default function Users() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteItem, setDeleteItem] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: '20' })
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      const { data } = await api.get(`/auth/users/?${params}`)
      return data
    },
  })

  const mutation = useMutation({
    mutationFn: async (payload: typeof EMPTY) => {
      const { data } = await api.post('/auth/users/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast('Enregistrement réussi')
      setShowModal(false)
      setForm(EMPTY)
      setError('')
    },
    onError: (err: any) => {
      const detail = err?.response?.data
      if (detail && typeof detail === 'object') {
        setError(Object.entries(detail).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | '))
      } else setError("Erreur lors de la création.")
    },
  })

  const editMutation = useMutation({
    mutationFn: async (payload: typeof EMPTY) => {
      const body: any = {
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        role: payload.role,
        phone: payload.phone,
        specialization: payload.specialization,
      }
      if (payload.password) body.password = payload.password
      const { data } = await api.patch(`/auth/users/${editItem!.id}/`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast('Modification réussie')
      setEditItem(null)
      setShowModal(false)
      setForm(EMPTY)
      setError('')
    },
    onError: (err: any) => {
      const detail = err?.response?.data
      const errMsg = detail && typeof detail === 'object' ? Object.entries(detail).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | ') : "Erreur lors de la modification."
      toast(errMsg, 'error')
      setError(errMsg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/auth/users/${id}/`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast('Suppression réussie')
      setDeleteItem(null)
    },
  })

  const users: User[] = data?.results ?? data ?? []
  const totalCount = data?.count ?? users.length
  const totalPages = Math.max(1, Math.ceil(totalCount / 20))

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
    <div className="space-y-5 max-w-5xl">
      <PageHeader
        title="Utilisateurs"
        subtitle={`${totalCount} utilisateur(s)`}
        action={
          <button onClick={() => { setShowModal(true); setEditItem(null); setForm(EMPTY); setError('') }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} /> Nouvel utilisateur
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Nom, email..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les rôles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rôle</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Spécialisation</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Chargement...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Aucun utilisateur trouvé.</td></tr>
            ) : users.map((u) => {
              const roleMeta = ROLE_MAP[u.role]
              return (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.last_name} {u.first_name}</p>
                    {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    {roleMeta && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleMeta.color}`}>
                        {roleMeta.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.specialization || '—'}</td>
                  <td className="px-4 py-3">
                    {u.is_active
                      ? <span className="inline-flex items-center gap-1 text-xs text-green-700"><UserCheck size={13} /> Actif</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-red-500"><UserX size={13} /> Inactif</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => {
                        setEditItem(u)
                        setForm({ email: u.email, first_name: u.first_name, last_name: u.last_name, role: u.role, password: '', phone: u.phone ?? '', specialization: u.specialization ?? '' })
                        setShowModal(true)
                        setError('')
                      }}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteItem(u)}
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
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount}
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="utilisateurs" />
      </div>

      {showModal && (
        <Modal title={editItem ? "Modifier l'utilisateur" : "Nouvel utilisateur"} onClose={() => { setShowModal(false); setEditItem(null); setForm(EMPTY) }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
                <input required value={form.first_name} onChange={e => set('first_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                <input required value={form.last_name} onChange={e => set('last_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Adresse email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {editItem ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe *"}
              </label>
              <input required={!editItem} type="password" value={form.password} onChange={e => set('password', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rôle *</label>
              <select required value={form.role} onChange={e => set('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+221 77 000 00 00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Spécialisation</label>
                <input value={form.specialization} onChange={e => set('specialization', e.target.value)} placeholder="Ex: Médecine du travail"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowModal(false); setEditItem(null); setForm(EMPTY) }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={mutation.isPending || editMutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg">
                {(mutation.isPending || editMutation.isPending) ? 'Enregistrement...' : editItem ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteItem && (
        <Modal title="Confirmer la suppression" onClose={() => setDeleteItem(null)}>
          <p className="text-sm text-gray-700 mb-6">Voulez-vous vraiment supprimer <strong>{deleteItem.last_name} {deleteItem.first_name}</strong> ? Cette action est irréversible.</p>
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
