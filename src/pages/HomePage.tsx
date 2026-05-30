import { Link } from 'react-router-dom'
import { useCouple } from '../context/CoupleContext'
import { ActivityWidget } from '../components/dashboard/ActivityWidget'
import { AvatarUpload } from '../components/dashboard/AvatarUpload'
import { ChatWidget } from '../components/dashboard/ChatWidget'
import { ComplimentsWidget } from '../components/dashboard/ComplimentsWidget'
import { DissolveButton } from '../components/dashboard/DissolveButton'
import { FoodProfile } from '../components/dashboard/FoodProfile'
import { HeartButton } from '../components/dashboard/HeartButton'
import { ImportantDates } from '../components/dashboard/ImportantDates'
import { MeetingCountdown } from '../components/dashboard/MeetingCountdown'
import { MoodWidget } from '../components/dashboard/MoodWidget'
import { TogetherWidget } from '../components/dashboard/TogetherWidget'

export function HomePage() {
  const { partner } = useCouple()

  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--lb-gold)] mb-2">ваше пространство</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[var(--lb-text)]">
          {partner?.display_name ? `Вы и ${partner.display_name}` : 'Добро пожаловать'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <TogetherWidget />
        <MeetingCountdown />
        <HeartButton />
        <ComplimentsWidget />
        <ImportantDates />
        <MoodWidget />
        <ActivityWidget />
        <AvatarUpload />
        <ChatWidget />
        <FoodProfile />
      </div>

      <Link
        to="/album"
        className="mt-6 block rounded-2xl border border-[var(--lb-border)] bg-[var(--lb-card)] p-5 text-center hover:border-[var(--lb-gold)]/50 transition"
      >
        <span className="text-2xl">📷</span>
        <p className="font-medium text-[var(--lb-text)] mt-2">Общий альбом</p>
        <p className="text-xs text-[var(--lb-muted)]">Все фото — на отдельной странице</p>
      </Link>

      <DissolveButton />
    </>
  )
}
