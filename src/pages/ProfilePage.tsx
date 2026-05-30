import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCouple } from '../context/CoupleContext'
import { AvatarUpload } from '../components/dashboard/AvatarUpload'
import { DissolveButton } from '../components/dashboard/DissolveButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const { partner, isComplete, couple } = useCouple()

  const loginMeta = user?.user_metadata?.login as string | undefined

  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--lb-gold)] mb-2">аккаунт</p>
        <h1 className="font-display text-3xl text-[var(--lb-text)]">Профиль</h1>
      </div>

      <div className="max-w-md mx-auto space-y-5">
        <Card>
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-16 h-16 rounded-full object-cover ring-2 ring-[var(--lb-gold)]/50"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[var(--lb-accent-soft)] flex items-center justify-center text-2xl font-display text-[var(--lb-accent)]">
                {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <p className="font-display text-xl text-[var(--lb-text)]">
                {profile?.display_name ?? 'Без имени'}
              </p>
              {loginMeta && (
                <p className="text-sm text-[var(--lb-muted)]">@{loginMeta}</p>
              )}
            </div>
          </div>
        </Card>

        <AvatarUpload />

        <Card title="Пара">
          {isComplete ? (
            <p className="text-sm text-[var(--lb-muted)]">
              Вместе с {partner?.display_name ?? 'партнёром'}
              {couple?.together_since && (
                <span> · с {new Date(couple.together_since).toLocaleDateString('ru-RU')}</span>
              )}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--lb-muted)]">Пара ещё не связана полностью.</p>
              <Link to="/pair">
                <Button variant="secondary" className="w-full">
                  Настроить пару
                </Button>
              </Link>
            </div>
          )}
        </Card>

        <Button variant="secondary" className="w-full" onClick={() => signOut()}>
          Выйти из аккаунта
        </Button>

        {isComplete && (
          <div className="pt-4">
            <DissolveButton />
          </div>
        )}
      </div>
    </>
  )
}
