import { useCallback, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { MAX_PHOTO_BYTES } from '../../lib/constants'
import { useCoupleSync } from '../../lib/realtime-sync'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type Photo = {
  id: string
  public_url: string
  created_at: string
}

export function AlbumWidget() {
  const { user } = useAuth()
  const { coupleId } = useCouple()
  const [photos, setPhotos] = useState<Photo[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!coupleId) return
    const { data } = await supabase
      .from('album_photos')
      .select('id, public_url, created_at')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })
    setPhotos(data ?? [])
  }, [coupleId])

  useCoupleSync(coupleId, 'album_photos', load, [load])

  const upload = async (file: File) => {
    if (!user || !coupleId) return
    if (file.size > MAX_PHOTO_BYTES) {
      alert('Максимум 5 МБ')
      return
    }
    const name = `${Date.now()}-${file.name}`
    const path = `${coupleId}/${name}`
    const { error } = await supabase.storage.from('album').upload(path, file)
    if (error) return alert(error.message)

    const { data: urlData } = supabase.storage.from('album').getPublicUrl(path)
    await supabase.from('album_photos').insert({
      couple_id: coupleId,
      uploaded_by: user.id,
      storage_path: path,
      public_url: urlData.publicUrl,
    })
    load()
  }

  return (
    <Card title="Общий альбом">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) upload(f)
        }}
      />
      <Button variant="secondary" className="mb-4" onClick={() => inputRef.current?.click()}>
        Загрузить фото (до 5 МБ)
      </Button>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((p) => (
          <figure key={p.id} className="rounded-xl overflow-hidden border border-rose-100">
            <img src={p.public_url} alt="" className="w-full aspect-square object-cover" />
            <figcaption className="text-[10px] text-center py-1 text-rose-500">
              {new Date(p.created_at).toLocaleDateString('ru-RU')}
            </figcaption>
          </figure>
        ))}
      </div>
    </Card>
  )
}
