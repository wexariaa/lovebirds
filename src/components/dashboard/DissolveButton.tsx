import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCouple } from '../../context/CoupleContext'
import { Button } from '../ui/Button'

export function DissolveButton() {
  const { dissolve } = useCouple()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  const handle = async () => {
    if (!confirm) {
      setConfirm(true)
      return
    }
    setBusy(true)
    const { error } = await dissolve()
    setBusy(false)
    if (!error) navigate('/pair')
    else alert(error)
  }

  return (
    <div className="text-center pt-8 pb-4">
      <Button variant="danger" disabled={busy} onClick={handle}>
        {confirm ? 'Подтвердить расставание' : 'Расстались'}
      </Button>
      {confirm && (
        <p className="text-xs text-red-500 mt-2">
          Все общие данные будут удалены безвозвратно
        </p>
      )}
    </div>
  )
}
