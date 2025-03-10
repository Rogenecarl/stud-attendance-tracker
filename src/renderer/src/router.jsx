import { createHashRouter, Navigate } from 'react-router-dom'
import DefaultLayout from './components/DefaultLayout'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Attendance from './pages/Attendance'
import Settings from './pages/Settings'
import GuestLayout from './components/GuestLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProtectedRoute from './components/ProtectedRoute'
import Sections from './pages/Sections'

const router = createHashRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" />,
  },
  {
    path: '/',
    element: <GuestLayout />,
    children: [
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'signup',
        element: <Signup />
      }
    ]
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DefaultLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'students',
        element: <Students />
      },
      {
        path: 'attendance',
        element: <Attendance />
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: 'sections',
        element: <Sections />
      }
    ]
  }
])

export default router
