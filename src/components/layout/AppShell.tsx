import type { ReactNode } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'

const nav = [
  { to: '/home', label: 'Главная', icon: '🏠' },
  { to: '/games', label: 'Игры', icon: '⚓' },
  { to: '/album', label: 'Альбом', icon: '📷' },
  { to: '/profile', label: 'Профиль', icon: '👤' },
] as const

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col lb-page">
      <header className="sticky top-0 z-40 border-b border-[var(--lb-border)] bg-[var(--lb-surface)]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/home" className="font-display text-2xl text-[var(--lb-accent)] tracking-tight">
            Lovebirds
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-[var(--lb-accent-soft)] transition"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-[var(--lb-gold)]/40"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[var(--lb-accent-soft)] flex items-center justify-center text-[var(--lb-accent)] font-semibold">
                  {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <span className="hidden sm:inline text-sm text-[var(--lb-muted)] max-w-[100px] truncate">
                {profile?.display_name}
              </span>
            </Link>
            <Button variant="ghost" className="!py-1.5 !px-2 text-xs" onClick={() => signOut()}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-24">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-[var(--lb-border)] bg-[var(--lb-surface)]/95 backdrop-blur-md safe-pb">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-[10px] sm:text-xs font-medium transition min-w-[4rem] ${
                  isActive
                    ? 'text-[var(--lb-accent)] bg-[var(--lb-accent-soft)]'
                    : 'text-[var(--lb-muted)] hover:text-[var(--lb-text)]'
                }`
              }
            >
              <span className="text-lg leading-none">{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
