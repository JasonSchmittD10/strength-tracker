import { createHashRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import LoginScreen from '@/components/auth/LoginScreen'
import BottomNav from '@/components/shared/BottomNav'
import HomeScreen from '@/components/home/HomeScreen'
import HistoryTab from '@/components/history/HistoryTab'
import ProgressTab from '@/components/progress/ProgressTab'
import SettingsTab from '@/components/settings/SettingsTab'
import WorkoutScreen from '@/components/workout/WorkoutScreen'

function MainApp() {
  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}

function GroupsTab() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-6 mt-12">
      <div className="text-4xl mb-4">👥</div>
      <h2 className="text-xl font-bold text-text-primary mb-2">Groups</h2>
      <p className="text-text-secondary text-sm">Coming soon — train with friends and share progress.</p>
    </div>
  )
}

const router = createHashRouter([
  {
    path: '/',
    element: <MainApp />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomeScreen /> },
      { path: 'history', element: <HistoryTab /> },
      { path: 'progress', element: <ProgressTab /> },
      { path: 'groups', element: <GroupsTab /> },
      { path: 'settings', element: <SettingsTab /> },
      { path: 'workout', element: <WorkoutScreen /> },
    ],
  },
])

export default function App() {
  const { loading, session } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!session) return <LoginScreen />
  return <RouterProvider router={router} />
}
