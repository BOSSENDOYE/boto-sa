import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { User, Lock, Save } from 'lucide-react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { useToast } from '../hooks/useToast'

export default function Profile() {
  const { toast } = useToast()
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '', specialization: '', department: '' })
  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [pwdError, setPwdError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me/')
      return data
    },
    onSuccess: (data: any) => {
      if (!loaded) {
        setProfileForm({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          phone: data.phone ?? '',
          specialization: data.specialization ?? '',
          department: data.department ?? '',
        })
        setLoaded(true)
      }
    },
  })

  const profileMutation = useMutation({
    mutationFn: async (payload: typeof profileForm) => {
      const { data } = await api.patch('/auth/me/', payload)
      return data
    },
    onSuccess: () => toast('Profil mis à jour'),
    onError: () => toast('Erreur lors de la mise à jour', 'error'),
  })

  const pwdMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/change-password/', {
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      })
    },
    onSuccess: () => {
      toast('Mot de passe changé')
      setPwdForm({ old_password: '', new_password: '', confirm: '' })
      setPwdError('')
    },
    onError: (err: any) => {
      const d = err?.response?.data
      setPwdError(d?.old_password?.[0] ?? d?.new_password?.[0] ?? d?.detail ?? 'Erreur')
    },
  })

  const ROLES: Record<string, string> = {
    SUPER_ADMIN: 'Super Administrateur', DOCTOR: 'Médecin', NURSE: 'Infirmier(e)',
    TECHNICIAN: 'Technicien', HR_ADMIN: 'Admin RH', VIEWER: 'Lecteur',
  }

  function handlePwd(e: React.FormEvent) {
    e.preventDefault()
    if (pwdForm.new_password !== pwdForm.confirm) { setPwdError('Les mots de passe ne correspondent pas'); return }
    setPwdError('')
    pwdMutation.mutate()
  }

  function sp(f: string, v: string) { setProfileForm(p => ({ ...p, [f]: v })) }
  function sw(f: string, v: string) { setPwdForm(p => ({ ...p, [f]: v })) }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Mon profil" subtitle={me ? `${me.email} — ${ROLES[me.role] ?? me.role}` : ''} />

      {/* Profile info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg"><User size={18} className="text-blue-600" /></div>
          <h2 className="font-semibold text-gray-800">Informations personnelles</h2>
        </div>
        <form onSubmit={e => { e.preventDefault(); profileMutation.mutate(profileForm) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prénom</label>
              <input value={profileForm.first_name} onChange={e => sp('first_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
              <input value={profileForm.last_name} onChange={e => sp('last_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
              <input value={profileForm.phone} onChange={e => sp('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Département</label>
              <input value={profileForm.department} onChange={e => sp('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Spécialisation</label>
            <input value={profileForm.specialization} onChange={e => sp('specialization', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={profileMutation.isPending}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <Save size={15} /> {profileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-orange-50 rounded-lg"><Lock size={18} className="text-orange-600" /></div>
          <h2 className="font-semibold text-gray-800">Changer le mot de passe</h2>
        </div>
        <form onSubmit={handlePwd} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mot de passe actuel *</label>
            <input required type="password" value={pwdForm.old_password} onChange={e => sw('old_password', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nouveau mot de passe *</label>
              <input required type="password" value={pwdForm.new_password} onChange={e => sw('new_password', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirmer *</label>
              <input required type="password" value={pwdForm.confirm} onChange={e => sw('confirm', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {pwdError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{pwdError}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={pwdMutation.isPending}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <Lock size={15} /> {pwdMutation.isPending ? 'Changement...' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
