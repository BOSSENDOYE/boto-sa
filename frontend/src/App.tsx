import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Workers from './pages/Workers'
import Appointments from './pages/Appointments'
import Encounters from './pages/Encounters'
import Consultations from './pages/Consultations'
import MedicalVisits from './pages/MedicalVisits'
import Explorations from './pages/Explorations'
import WorkAccidents from './pages/WorkAccidents'
import Occupational from './pages/Occupational'
import Departments from './pages/Departments'
import Reports from './pages/Reports'
import Users from './pages/Users'
import NursingActs from './pages/NursingActs'
import JobSheet from './pages/JobSheet'
import Activities from './pages/Activities'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import { ToastProvider } from './components/ui/ToastProvider'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Workers */}
            <Route path="/workers" element={<Workers />} />
            {/* Appointments */}
            <Route path="/appointments" element={<Appointments />} />
            {/* Medical */}
            <Route path="/encounters" element={<Encounters />} />
            <Route path="/consultations" element={<Consultations />} />
            <Route path="/medical-visits" element={<MedicalVisits />} />
            <Route path="/explorations" element={<Explorations />} />
            {/* Profile & Notifications */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            {/* Occupational */}
            <Route path="/work-accidents" element={<WorkAccidents />} />
            <Route path="/occupational/sms" element={<Occupational />} />
            <Route path="/occupational/risks" element={<Occupational />} />
            {/* Admin */}
            <Route path="/departments" element={<Departments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<Users />} />
            {/* Nursing / Occupational extras */}
            <Route path="/nursing-acts" element={<NursingActs />} />
            <Route path="/job-sheets" element={<JobSheet />} />
            <Route path="/activities" element={<Activities />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
