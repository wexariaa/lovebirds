import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-rose-600">
            <span>❤️</span> Lovebirds
          </Link>
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-9 h-9 rounded-full object-cover ring-2 ring-rose-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className="hidden sm:inline text-sm text-rose-800/80">
              {profile?.display_name}
            </span>
            <Button variant="ghost" className="!py-1.5 !px-2 text-xs" onClick={() => signOut()}>
              Выйти
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
