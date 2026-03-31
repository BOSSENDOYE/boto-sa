import { Outlet, Navigate } from 'react-router-dom'
import Nav from './Nav'
import { isAuthenticated } from '../lib/auth'

export default function Layout() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Nav />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
