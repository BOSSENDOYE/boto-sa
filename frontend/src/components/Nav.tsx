import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope,
  Building2, Microscope, ShieldCheck, BarChart3,
  HeartPulse, AlertTriangle, Briefcase, Settings,
  Activity, ClipboardList, Megaphone, Bell,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { logout } from '../lib/auth'
import { useAuth } from '../hooks/useAuth'

const sections = [
  {
    label: null,
    links: [
      { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Gestion RH',
    links: [
      { to: '/workers', label: 'Travailleurs', icon: Users },
      { to: '/departments', label: 'Départements', icon: Building2 },
    ],
  },
  {
    label: 'Médecine',
    links: [
      { to: '/appointments', label: 'Rendez-vous', icon: CalendarDays },
      { to: '/encounters', label: 'Actes médicaux', icon: HeartPulse },
      { to: '/nursing-acts', label: 'Actes infirmiers', icon: Activity },
      { to: '/consultations', label: 'Consultations', icon: Stethoscope },
      { to: '/medical-visits', label: 'Visites médicales', icon: Briefcase },
      { to: '/explorations', label: 'Explorations', icon: Microscope },
    ],
  },
  {
    label: 'Santé au travail',
    links: [
      { to: '/occupational/sms', label: 'Surveillance méd.', icon: ShieldCheck },
      { to: '/occupational/risks', label: 'Risques', icon: AlertTriangle },
      { to: '/work-accidents', label: 'Accidents travail', icon: AlertTriangle },
      { to: '/job-sheets', label: 'Fiches de poste', icon: ClipboardList },
      { to: '/activities', label: 'Activités service', icon: Megaphone },
    ],
  },
  {
    label: 'Rapports',
    links: [
      { to: '/reports', label: 'Rapports', icon: BarChart3 },
    ],
  },
]

export default function Nav() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/?page_size=1&is_read=false')
      return data?.count ?? 0
    },
    refetchInterval: 30000,
  })
  const unreadCount = unreadCountData ?? 0

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col min-h-screen shrink-0 hidden lg:flex">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-200">
        <div className="bg-blue-600 rounded-lg p-1.5 mr-2.5">
          <Stethoscope size={16} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm leading-tight">BOTO SA</p>
          <p className="text-xs text-gray-400 leading-tight">Médecine du Travail</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {sections.map((section, i) => (
          <div key={i} className="mb-1">
            {section.label && (
              <p className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.label}
              </p>
            )}
            {section.links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Admin section */}
        {(user?.role === 'SUPER_ADMIN') && (
          <div className="mb-1">
            <p className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Administration
            </p>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Settings size={16} />
              Utilisateurs
            </NavLink>
          </div>
        )}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-gray-200 p-3">
        {user && (
          <div className="px-2 py-1.5 mb-1">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.role}</p>
          </div>
        )}
        {unreadCount > 0 && (
          <a href="/notifications" className="relative p-1.5 mx-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors group">
            <Bell size={18} />
            <div className="absolute -top-1 -right-1 min-w-[18px] h-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          </a>
        )}
        <div className="px-2 py-1.5 mb-1 relative">
          <button className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors group">
            <span className="truncate">{user?.first_name} {user?.last_name}</span>
            <svg className="w-4 h-4 ml-auto group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mon profil</a>
            <a href="/notifications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Notifications ({unreadCount})</a>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
