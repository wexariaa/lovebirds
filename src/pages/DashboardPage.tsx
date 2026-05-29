import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCouple } from '../context/CoupleContext'
import { AppShell } from '../components/layout/AppShell'
import { ActivityWidget } from '../components/dashboard/ActivityWidget'
import { AlbumWidget } from '../components/dashboard/AlbumWidget'
import { AvatarUpload } from '../components/dashboard/AvatarUpload'
import { ChatWidget } from '../components/dashboard/ChatWidget'
import { ComplimentsWidget } from '../components/dashboard/ComplimentsWidget'
import { DissolveButton } from '../components/dashboard/DissolveButton'
import { FoodProfile } from '../components/dashboard/FoodProfile'
import { HeartButton } from '../components/dashboard/HeartButton'
import { ImportantDates } from '../components/dashboard/ImportantDates'
import { MeetingCountdown } from '../components/dashboard/MeetingCountdown'
import { MoodWidget } from '../components/dashboard/MoodWidget'
import { SavingsWidget } from '../components/dashboard/SavingsWidget'
import { TicTacToe } from '../components/dashboard/TicTacToe'
import { TogetherWidget } from '../components/dashboard/TogetherWidget'

export function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { isComplete, loading, partner } = useCouple()

  if (!authLoading && !user) return <Navigate to="/login" replace />
  if (!loading && !isComplete) return <Navigate to="/pair" replace />

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-rose-500">
        Загрузка…
      </div>
    )
  }

  return (
    <AppShell>
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-rose-700">
          Привет, влюблённые 💕
        </h1>
        {partner?.display_name && (
          <p className="text-rose-600/70 text-sm mt-1">вместе с {partner.display_name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <TogetherWidget />
        <MeetingCountdown />
        <HeartButton />
        <ComplimentsWidget />
        <ImportantDates />
        <MoodWidget />
        <ActivityWidget />
        <SavingsWidget />
        <TicTacToe />
        <AvatarUpload />
        <ChatWidget />
        <FoodProfile />
        <div className="md:col-span-2 lg:col-span-3">
          <AlbumWidget />
        </div>
      </div>

      <DissolveButton />
    </AppShell>
  )
}
