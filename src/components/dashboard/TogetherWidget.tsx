import { useCouple } from '../../context/CoupleContext'
import { formatTogetherDuration } from '../../lib/utils'
import { Card } from '../ui/Card'

export function TogetherWidget() {
  const { couple } = useCouple()
  if (!couple?.together_since) return null

  return (
    <Card title="Как долго вместе">
      <p className="text-2xl sm:text-3xl font-bold text-rose-600">
        {formatTogetherDuration(couple.together_since)}
      </p>
      <p className="text-xs text-rose-500 mt-1">
        с {new Date(couple.together_since).toLocaleDateString('ru-RU')}
      </p>
    </Card>
  )
}
