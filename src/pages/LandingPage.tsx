import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PublicHeader } from '../components/layout/PublicHeader'
import { Button } from '../components/ui/Button'

const features = [
  { icon: '❤️', title: 'Пульс сердца', text: 'Один тап — партнёр чувствует, что вы рядом' },
  { icon: '💬', title: 'Личный чат', text: 'Только для вас двоих, без лишних глаз' },
  { icon: '📷', title: 'Общий альбом', text: 'Фото и воспоминания в одном месте' },
  { icon: '⚓', title: 'Игры', text: 'Морской бой и другие мини-игры для двоих' },
]

export function LandingPage() {
  const { user } = useAuth()

  if (user) return <Navigate to="/home" replace />

  return (
    <div className="min-h-screen lb-page flex flex-col">
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd4c8] via-[#ffe8f0] to-[#fff5e8] opacity-90" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24 text-center">
          <p className="font-script text-4xl sm:text-5xl text-[var(--lb-accent)] mb-2">
            Our Love Story
          </p>
          <h1 className="font-display text-4xl sm:text-6xl text-[var(--lb-text)] leading-tight max-w-2xl mx-auto">
            Welcome to Your Love Story
          </h1>
          <p className="mt-4 text-[var(--lb-muted)] max-w-lg mx-auto text-sm sm:text-base">
            Lovebirds — уютное пространство для пары. Счётчик «вместе», чат, альбом, игры и
            маленькие ритуалы только для вас двоих.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/login?mode=register">
              <Button className="!rounded-full !px-8 !py-3">Создать пару</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" className="!rounded-full !px-8 !py-3">
                Уже есть аккаунт
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16 w-full">
        <p className="font-script text-3xl text-center text-[var(--lb-accent)] mb-8">
          Что внутри
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="lb-card-peach p-5 text-center">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-display text-lg mt-3 text-[var(--lb-text)]">{f.title}</h3>
              <p className="text-xs text-[var(--lb-muted)] mt-2">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16 text-center">
        <div className="lb-card-cream p-8">
          <p className="font-display text-xl text-[var(--lb-text)]">
            Полный функционал откроется после входа и связки с партнёром
          </p>
          <p className="text-sm text-[var(--lb-muted)] mt-3">
            Один создаёт пару и отправляет ссылку — второй переходит по ней и выбирает дату «вместе
            с».
          </p>
        </div>
      </section>

      <footer className="mt-auto border-t border-[var(--lb-border)] bg-[var(--lb-accent-soft)]/40 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-[var(--lb-muted)]">
          Lovebirds · #FAF5F7 · только для вас двоих
        </div>
      </footer>
    </div>
  )
}
