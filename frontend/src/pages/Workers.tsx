import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus, Upload, Pencil, Trash2 } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { CONTRACT_TYPE } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'

const EMPTY_FORM = {
  matricule: '',
  first_name: '', last_name: '', gender: 'M',
  date_of_birth: '', hire_date: '',
  phone: '', contract_type: 'CDI',
  department: '', job_position: '',
  emergency_contact: '', emergency_phone: '',
  blood_type: 'UNKNOWN', known_allergies: '',
}

export default function Workers() {
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState('')
  const [contractType, setContractType] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [importMsg, setImportMsg] = useState('')
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteItem, setDeleteItem] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

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
    queryFn: async () => { const { data } = await api.get('/departments/?page_size=100'); return data },
    enabled: showModal || editItem !== null,
  })

  const { data: posData } = useQuery({
    queryKey: ['job-positions-all', form.department],
    queryFn: async () => {
      const params = new URLSearchParams({ page_size: '100' })
      if (form.department) params.set('department', form.department)
      const { data } = await api.get(`/job-positions/?${params}`)
      return data
    },
    enabled: showModal || editItem !== null,
  })

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const { data } = await api.post('/workers/', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      toast('Enregistrement réussi')
      setShowModal(false)
      setForm(EMPTY_FORM)
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
      const { data } = await api.patch(`/workers/${editItem!.id}/`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      toast('Modification réussie')
      setEditItem(null)
      setShowModal(false)
      setForm(EMPTY_FORM)
      setError('')
    },
    onError: (err: any) => {
      toast(errMsg || "Erreur lors de la modification", 'error')
      const detail = err?.response?.data
      if (detail && typeof detail === 'object') {
        setError(Object.entries(detail).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | '))
      } else setError("Erreur lors de la modification.")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/workers/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      setDeleteItem(null)
    },
  })

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/workers/import/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      toast(`Import: ${data.success_count} OK, ${data.error_count} erreur(s)`)
      setImportMsg(`Import terminé : ${data.success_count} succès, ${data.error_count} erreur(s).`)
    },
    onError: () => {
      toast('Erreur lors de l\'import', 'error')
      setImportMsg("Erreur lors de l'import.")
    },
  })

  const workers: any[] = data?.results ?? []
  const departments: any[] = deptData?.results ?? []
  const positions: any[] = posData?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 20) : 1

  function reset() { setPage(1) }
  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const payload: Record<string, string> = { ...form }
    if (!payload.department) delete payload.department
    if (!payload.job_position) delete payload.job_position
    if (!payload.date_of_birth) delete payload.date_of_birth
    if (!payload.hire_date) delete payload.hire_date
    if (editItem) {
      editMutation.mutate(payload)
    } else {
      mutation.mutate(payload)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImportMsg('')
      importMutation.mutate(file)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader
        title="Travailleurs"
        subtitle={`${data?.count ?? 0} travailleur(s)`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importMutation.isPending}
              className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload size={15} /> {importMutation.isPending ? 'Import...' : 'Importer Excel'}
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => { setShowModal(true); setEditItem(null); setForm(EMPTY_FORM); setError('') }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <UserPlus size={15} /> Ajouter
            </button>
          </div>
        }
      />

      {importMsg && (
        <p className={`text-sm px-4 py-2 rounded-lg ${importMsg.includes('Erreur') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {importMsg}
        </p>
      )}

      <div className="bg-gray-50 border border-blue-100 rounded-lg px-4 py-2 text-xs text-blue-700">
        <strong>Format Excel attendu :</strong> colonnes Matricule · Prénom · Nom · Genre (M/F) · Département · Poste
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Nom, matricule, téléphone..."
            value={search} onChange={(e) => { setSearch(e.target.value); reset() }}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
        </div>
        <select value={contractType} onChange={(e) => { setContractType(e.target.value); reset() }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les contrats</option>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
          <option value="INTERN">Stagiaire</option>
          <option value="CONTRACTOR">Sous-traitant</option>
        </select>
        <select value={isActive} onChange={(e) => { setIsActive(e.target.value); reset() }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Actif & Inactif</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Matricule</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nom & Prénom</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Département</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Poste</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Contrat</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Chargement...</td></tr>
            ) : workers.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Aucun travailleur trouvé.</td></tr>
            ) : workers.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{w.matricule}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{w.last_name} {w.first_name}</p>
                  <p className="text-xs text-gray-400">{w.gender === 'M' ? 'Homme' : 'Femme'}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{w.department_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{w.job_position_title ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded font-medium">
                    {CONTRACT_TYPE[w.contract_type] ?? w.contract_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${w.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {w.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => {
                      setEditItem(w)
                      setForm({
                        matricule: w.matricule,
                        first_name: w.first_name, last_name: w.last_name, gender: w.gender,
                        date_of_birth: w.date_of_birth ?? '',
                        hire_date: w.hire_date ?? '',
                        phone: w.phone ?? '',
                        contract_type: w.contract_type,
                        department: w.department ? String(w.department) : '',
                        job_position: w.job_position ? String(w.job_position) : '',
                        emergency_contact: w.emergency_contact ?? '',
                        emergency_phone: w.emergency_phone ?? '',
                        blood_type: w.blood_type,
                        known_allergies: w.known_allergies ?? '',
                      })
                      setShowModal(true)
                      setError('')
                    }}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Modifier">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteItem(w)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination page={page} totalPages={totalPages} totalCount={data?.count ?? 0}
          onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} label="travailleurs" />
      </div>

      {showModal && (
        <Modal title={editItem ? "Modifier le travailleur" : "Nouveau travailleur"} onClose={() => { setShowModal(false); setEditItem(null); setForm(EMPTY_FORM) }}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Matricule */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Matricule *</label>
              <input required value={form.matricule} onChange={e => set('matricule', e.target.value)}
                placeholder="Ex: BTW-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
            </div>

            {/* Nom / Prénom */}
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

            {/* Sexe / Date de naissance */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sexe *</label>
                <select required value={form.gender} onChange={e => set('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date de naissance</label>
                <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Contrat / Date d'embauche */}
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date d'embauche</label>
                <input type="date" value={form.hire_date} onChange={e => set('hire_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Département / Poste */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Département</label>
                <select value={form.department} onChange={e => { set('department', e.target.value); set('job_position', '') }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {departments.map((d: any) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Poste de travail</label>
                <select value={form.job_position} onChange={e => set('job_position', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {positions.map((p: any) => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
                </select>
              </div>
            </div>

            {/* Téléphone / Groupe sanguin */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+221 77 000 00 00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Groupe sanguin</label>
                <select value={form.blood_type} onChange={e => set('blood_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="UNKNOWN">Inconnu</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                </select>
              </div>
            </div>

            {/* Contact d'urgence */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contact d'urgence</label>
                <input value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)}
                  placeholder="Nom du contact"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tél. urgence</label>
                <input type="tel" value={form.emergency_phone} onChange={e => set('emergency_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Allergies connues</label>
              <textarea value={form.known_allergies} onChange={e => set('known_allergies', e.target.value)}
                rows={2} placeholder="Aucune connue..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowModal(false); setEditItem(null); setForm(EMPTY_FORM) }}
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
