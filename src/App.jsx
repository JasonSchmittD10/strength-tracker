import { createHashRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import SplashScreen from '@/components/auth/SplashScreen'
import LoginScreen from '@/components/auth/LoginScreen'
import ResetPasswordScreen from '@/components/auth/ResetPasswordScreen'
import BottomNav from '@/components/shared/BottomNav'
import HomeScreen from '@/components/home/HomeScreen'
import HistoryTab from '@/components/history/HistoryTab'
import ProgressTab from '@/components/progress/ProgressTab'
import SettingsTab from '@/components/settings/SettingsTab'
import WorkoutScreen from '@/components/workout/WorkoutScreen'
import BuildWorkoutScreen from '@/components/workout/BuildWorkoutScreen'
import ProgramSelector from '@/components/programs/ProgramSelector'
import ProgramTab from '@/components/programs/ProgramTab'
import GroupsTab from '@/components/groups/GroupsTab'
import GroupDetailScreen from '@/components/groups/GroupDetailScreen'
import ProgramDetailScreen from '@/components/programs/ProgramDetailScreen'
import EditSchedule from '@/components/EditSchedule'
import ConditioningSession from '@/components/ConditioningSession'

function MainApp() {
  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      <div className="flex-1 overflow-y-scroll overscroll-y-contain pb-[54px]">
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
      { path: 'program', element: <ProgramTab /> },
      { path: 'progress', element: <ProgressTab /> },
      { path: 'groups', element: <GroupsTab /> },
      { path: 'settings', element: <SettingsTab /> },
      { path: 'program-selector', element: <ProgramSelector /> },
      { path: 'program-detail/:programId', element: <ProgramDetailScreen /> },
      { path: 'edit-schedule', element: <EditSchedule /> },
    ],
  },
  { path: '/groups/:groupId', element: <GroupDetailScreen /> },
  { path: '/workout', element: <WorkoutScreen /> },
  { path: '/conditioning', element: <ConditioningSession /> },
  { path: '/build-workout', element: <BuildWorkoutScreen /> },
])

export default function App() {
  const { loading, session, recoveryMode, setRecoveryMode } = useAuth()
  if (loading) return <SplashScreen />
  if (recoveryMode) return <ResetPasswordScreen onDone={() => setRecoveryMode(false)} />
  if (!session) return <LoginScreen />
  return <RouterProvider router={router} />
}
