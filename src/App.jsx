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
import ProgramSelector from '@/components/programs/ProgramSelector'
import GroupsTab from '@/components/groups/GroupsTab'
import GroupDetailScreen from '@/components/groups/GroupDetailScreen'

function MainApp() {
  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      <div className="flex-1 overflow-y-scroll overscroll-y-contain" style={{ paddingBottom: 'calc(54px + env(safe-area-inset-bottom, 0px))' }}>
        <Outlet />
      </div>
      <BottomNav />
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
      { path: 'program-selector', element: <ProgramSelector /> },
    ],
  },
  { path: '/groups/:groupId', element: <GroupDetailScreen /> },
])

export default function App() {
  const { loading, session } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!session) return <LoginScreen />
  return <RouterProvider router={router} />
}
