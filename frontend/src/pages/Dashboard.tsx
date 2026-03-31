import { useQuery } from '@tanstack/react-query'
import {
  Users, CalendarDays, Stethoscope, HeartPulse,
  AlertTriangle, Activity, TrendingUp, Briefcase,
} from 'lucide-react'
import { api } from '../lib/api'
import type { DashboardData, Appointment } from '../lib/types'
import { Badge, APPOINTMENT_STATUS } from '../components/ui/Badge'

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: number | string; icon: React.ElementType; color: string; sub?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 leading-tight">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const { data: stats } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/')
      return data
    },
    refetchInterval: 60_000,
  })

  const { data: appointmentsData, isLoading: loadingAppts } = useQuery({
    queryKey: ['appointments-today-dash'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await api.get(`/appointments/?scheduled_date=${today}&page_size=10`)
      return data
    },
  })

  const todayAppts: Appointment[] = appointmentsData?.results ?? []
  const s = stats

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900">
        Tableau de bord
        <span className="ml-2 text-sm font-normal text-gray-400">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </h1>

      {/* Today */}
      <Section title="Aujourd'hui">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard label="Actes médicaux" value={s?.today.total_encounters ?? '—'} icon={HeartPulse} color="bg-blue-500" />
          <StatCard label="Consultations" value={s?.today.consultations ?? '—'} icon={Stethoscope} color="bg-indigo-500" />
          <StatCard label="Visites médicales" value={s?.today.medical_visits ?? '—'} icon={Briefcase} color="bg-purple-500" />
          <StatCard label="Urgences" value={s?.today.emergencies ?? '—'} icon={Activity} color="bg-red-500" />
          <StatCard
            label="TDR effectués"
            value={s?.today.rdts ?? '—'}
            icon={CalendarDays}
            color="bg-teal-500"
            sub={s ? `${s.today.rdt_positive} positif(s)` : undefined}
          />
          <StatCard label="Travailleurs actifs" value={s?.this_month.active_workers ?? '—'} icon={Users} color="bg-green-500" />
        </div>
      </Section>

      {/* This month */}
      <Section title="Ce mois-ci">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Actes totaux" value={s?.this_month.total_encounters ?? '—'} icon={TrendingUp} color="bg-blue-400" />
          <StatCard label="Accidents travail" value={s?.this_month.work_accidents ?? '—'} icon={AlertTriangle} color="bg-orange-500" />
          <StatCard
            label="Avec arrêt"
            value={s?.this_month.accidents_with_stop ?? '—'}
            icon={AlertTriangle}
            color="bg-red-400"
            sub={s ? `${s.this_month.lost_work_days} j. perdus` : undefined}
          />
          <StatCard label="Sans arrêt" value={s?.this_month.accidents_without_stop ?? '—'} icon={AlertTriangle} color="bg-yellow-500" />
        </div>
      </Section>

      {/* Today's appointments */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Rendez-vous du jour</h2>
          <span className="text-sm text-gray-400">{appointmentsData?.count ?? 0} RV</span>
        </div>
        {loadingAppts ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : todayAppts.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucun rendez-vous aujourd'hui.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {todayAppts.map((appt) => {
              const badge = APPOINTMENT_STATUS[appt.status]
              return (
                <li key={appt.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {appt.worker.first_name} {appt.worker.last_name}
                      <span className="ml-2 text-xs text-gray-400 font-mono font-normal">{appt.worker.matricule}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {appt.appointment_type?.name ?? 'RV'} —{' '}
                      {new Date(appt.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {' '} · Dr {appt.doctor.last_name}
                    </p>
                  </div>
                  {badge && <Badge label={badge.label} color={badge.color} />}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
