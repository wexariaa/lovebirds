import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'

export function PublicHeader({ showAuth = true }: { showAuth?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--lb-border)]/80 bg-[var(--lb-surface)]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl text-[var(--lb-accent)] tracking-tight">
          Lovebirds
        </Link>
        {showAuth && (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" className="!text-sm">
                Войти
              </Button>
            </Link>
            <Link to="/login?mode=register">
              <Button className="!text-sm !rounded-full !px-5">Join Us</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
