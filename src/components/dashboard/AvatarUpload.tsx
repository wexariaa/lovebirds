import { useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export function AvatarUpload() {
  const { user, profile, refreshProfile } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    if (!user) return
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) return alert(error.message)

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
    await refreshProfile()
  }

  return (
    <Card title="Аватарка">
      <div className="flex items-center gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-rose-200" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-3xl text-rose-400">
            ?
          </div>
        )}
        <div>
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
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Загрузить фото
          </Button>
          <div className="mt-2">
            <label className="text-xs text-rose-600">Я — </label>
            <select
              className="text-sm border border-rose-200 rounded-lg px-2 py-1"
              value={profile?.gender ?? 'she'}
              onChange={async (e) => {
                if (!user) return
                await supabase
                  .from('profiles')
                  .update({ gender: e.target.value as 'she' | 'he' })
                  .eq('id', user.id)
                refreshProfile()
              }}
            >
              <option value="she">она</option>
              <option value="he">он</option>
            </select>
          </div>
        </div>
      </div>
    </Card>
  )
}
