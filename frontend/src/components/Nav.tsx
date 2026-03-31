import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope,
  LogOut, Building2, Microscope, ShieldCheck, BarChart3,
  HeartPulse, AlertTriangle, Briefcase, Settings,
} from 'lucide-react'
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

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col min-h-screen shrink-0">
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
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
