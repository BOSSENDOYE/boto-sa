import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, CheckCheck, ExternalLink } from 'lucide-react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { useToast } from '../hooks/useToast'

export default function Notifications() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/?page_size=50')
      return data
    },
  })

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read/'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-count'] })
      toast('Toutes les notifications marquées comme lues')
    },
  })

  const markRead = useMutation({
    mutationFn: (id: number) => api.post(`/notifications/${id}/read/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  const deleteNotif = useMutation({
    mutationFn: (id: number) => api.delete(`/notifications/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  const notifications: any[] = data?.results ?? data ?? []
  const unreadCount = notifications.filter(n => !n.is_read).length

  const TYPE_COLOR: Record<string, string> = {
    INFO:    'bg-blue-100 text-blue-700',
    WARNING: 'bg-yellow-100 text-yellow-700',
    SUCCESS: 'bg-green-100 text-green-700',
    ERROR:   'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est lu'}
        action={
          unreadCount > 0 ? (
            <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}
              className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <CheckCheck size={15} /> Tout marquer comme lu
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="text-center py-10 text-gray-400">Chargement...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <BellOff size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune notification.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div key={n.id}
              className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition-colors ${n.is_read ? 'border-gray-100 opacity-70' : 'border-blue-200 bg-blue-50/30'}`}>
              <div className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${TYPE_COLOR[n.notification_type] ?? 'bg-gray-100 text-gray-600'}`}>
                <Bell size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium text-gray-900 ${!n.is_read ? 'font-semibold' : ''}`}>{n.title}</p>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                {n.link && (
                  <a href={n.link} className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink size={11} /> Voir
                  </a>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                {!n.is_read && (
                  <button onClick={() => markRead.mutate(n.id)} title="Marquer comme lu"
                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                    <CheckCheck size={14} />
                  </button>
                )}
                <button onClick={() => deleteNotif.mutate(n.id)} title="Supprimer"
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
