import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Nav from './Nav'
import { isAuthenticated } from '../lib/auth'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!isAuthenticated()) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-600 rounded-lg p-1.5 mr-2.5">
              <Menu size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">BOTO SA</p>
              <p className="text-xs text-gray-400 leading-tight">Menu</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Nav />
        </div>
      </div>

      {/* Desktop nav */}
      <Nav />

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">BOTO SA</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <Outlet />
      </main>
    </div>
  )
}
