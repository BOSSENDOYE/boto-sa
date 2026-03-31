import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart3, FileText, Download } from 'lucide-react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'

interface GeneratedReport {
  id: number
  name: string
  report_type: string
  period_start: string
  period_end: string
  format: string
  status: string
  generated_at: string
  file: string | null
}

const REPORT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'En attente',   color: 'bg-yellow-100 text-yellow-700' },
  GENERATING: { label: 'Génération...', color: 'bg-blue-100 text-blue-700' },
  READY:      { label: 'Prêt',         color: 'bg-green-100 text-green-700' },
  FAILED:     { label: 'Erreur',       color: 'bg-red-100 text-red-700' },
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  DAILY: 'Journalier', WEEKLY: 'Hebdomadaire', MONTHLY: 'Mensuel', CUSTOM: 'Personnalisé',
}

const EMPTY = {
  name: '',
  report_type: 'MONTHLY',
  period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  period_end: new Date().toISOString().split('T')[0],
  format: 'PDF',
}

export default function Reports() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data } = await api.get('/reports/?page_size=25')
      return data
    },
  })

  const mutation = useMutation({
    mutationFn: async (payload: typeof EMPTY) => {
      const { data } = await api.post('/reports/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] })
      setShowModal(false)
      setForm(EMPTY)
      setError('')
    },
    onError: (err: any) => {
      const detail = err?.response?.data
      if (detail && typeof detail === 'object') {
        setError(Object.entries(detail).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | '))
      } else setError("Erreur lors de la génération.")
    },
  })

  const reports: GeneratedReport[] = data?.results ?? []

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <PageHeader
        title="Rapports"
        subtitle="Rapports générés"
        action={
          <button onClick={() => { setShowModal(true); setError('') }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <BarChart3 size={15} /> Générer un rapport
          </button>
        }
      />

      {isLoading ? (
        <div className="text-center py-10 text-gray-400">Chargement...</div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun rapport généré pour le moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rapport</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Période</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Format</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((r) => {
                const badge = REPORT_STATUS[r.status]
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600">{REPORT_TYPE_LABELS[r.report_type] ?? r.report_type}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {new Date(r.period_start).toLocaleDateString('fr-FR')} {'->'}{' '}
                      {new Date(r.period_end).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono">{r.format}</span>
                    </td>
                    <td className="px-4 py-3">
                      {badge && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.file && r.status === 'READY' && (
                        <a href={r.file} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium">
                          <Download size={13} /> Télécharger
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="Générer un rapport" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom du rapport *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Ex: Rapport mensuel Mars 2026"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                <select required value={form.report_type} onChange={e => set('report_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="DAILY">Journalier</option>
                  <option value="WEEKLY">Hebdomadaire</option>
                  <option value="MONTHLY">Mensuel</option>
                  <option value="CUSTOM">Personnalisé</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Format *</label>
                <select required value={form.format} onChange={e => set('format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="PDF">PDF</option>
                  <option value="EXCEL">Excel</option>
                  <option value="CSV">CSV</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Début de période *</label>
                <input required type="date" value={form.period_start} onChange={e => set('period_start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fin de période *</label>
                <input required type="date" value={form.period_end} onChange={e => set('period_end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={mutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg">
                {mutation.isPending ? 'Génération...' : 'Générer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
