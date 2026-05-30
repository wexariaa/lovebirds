import { AlbumWidget } from '../components/dashboard/AlbumWidget'

export function AlbumPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--lb-gold)] mb-2">воспоминания</p>
        <h1 className="font-display text-3xl text-[var(--lb-text)]">Общий альбом</h1>
      </div>
      <AlbumWidget />
    </>
  )
}
