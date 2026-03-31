import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus } from 'lucide-react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { CONTRACT_TYPE } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import type { Worker, Department, JobPosition } from '../lib/types'

const EMPTY_FORM = {
  first_name: '', last_name: '', gender: 'M', date_of_birth: '',
  phone: '', contract_type: 'CDI', department: '', job_position: '',
  hire_date: '', emergency_contact: '', emergency_phone: '',
}

export default function Workers() {
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState('')
  const [contractType, setContractType] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['workers', search, isActive, contractType, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: '20' })
      if (search) params.set('search', search)
      if (isActive) params.set('is_active', isActive)
      if (contractType) params.set('contract_type', contractType)
      const { data } = await api.get(`/workers/?${params}`)
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

  const { data: posData } = useQuery({
    queryKey: ['job-positions-all', form.department],
    queryFn: async () => {
      const params = new URLSearchParams({ page_size: '100' })
      if (form.department) params.set('department', form.department)
      const { data } = await api.get(`/job-positions/?${params}`)
      return data
    },
    enabled: showModal,
  })

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const { data } = await api.post('/workers/', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      setShowModal(false)
      setForm(EMPTY_FORM)
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

  const workers: Worker[] = data?.results ?? []
  const departments: Department[] = deptData?.results ?? []
  const positions: JobPosition[] = posData?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1

  function reset() { setPage(1) }

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const payload: Record<string, string> = { ...form }
    if (!payload.department) delete payload.department
    if (!payload.job_position) delete payload.job_position
    if (!payload.date_of_birth) delete payload.date_of_birth
    if (!payload.hire_date) delete payload.hire_date
    mutation.mutate(payload)
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader
        title="Travailleurs"
        subtitle={`${data?.count ?? 0} travailleur(s)`}
        action={
          <button
            onClick={() => { setShowModal(true); setError('') }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <UserPlus size={15} /> Ajouter
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Nom, matricule, téléphone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); reset() }}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <select
          value={contractType}
          onChange={(e) => { setContractType(e.target.value); reset() }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les contrats</option>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
          <option value="INTERN">Stagiaire</option>
          <option value="CONTRACTOR">Sous-traitant</option>
        </select>
        <select
          value={isActive}
          onChange={(e) => { setIsActive(e.target.value); reset() }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Actif & Inactif</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Matricule</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nom & Prénom</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Département</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Poste</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Contrat</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Chargement...</td></tr>
            ) : workers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Aucun travailleur trouvé.</td></tr>
            ) : workers.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{w.matricule}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{w.last_name} {w.first_name}</p>
                  <p className="text-xs text-gray-400">{w.gender === 'M' ? 'Homme' : 'Femme'} · {w.phone || '—'}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{w.department?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{w.job_position?.title ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded font-medium">
                    {CONTRACT_TYPE[w.contract_type] ?? w.contract_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    w.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {w.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={page} totalPages={totalPages} totalCount={data?.count ?? 0}
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)}
          label="travailleurs"
        />
      </div>

      {showModal && (
        <Modal title="Nouveau travailleur" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                <input required value={form.last_name} onChange={e => set('last_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
                <input required value={form.first_name} onChange={e => set('first_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sexe *</label>
                <select required value={form.gender} onChange={e => set('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date de naissance</label>
                <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type de contrat *</label>
                <select required value={form.contract_type} onChange={e => set('contract_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="INTERN">Stagiaire</option>
                  <option value="CONTRACTOR">Sous-traitant</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Département</label>
                <select value={form.department} onChange={e => { set('department', e.target.value); set('job_position', '') }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {departments.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Poste de travail</label>
                <select value={form.job_position} onChange={e => set('job_position', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {positions.map(p => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date d'embauche</label>
              <input type="date" value={form.hire_date} onChange={e => set('hire_date', e.target.value)}
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
    </div>
  )
}
