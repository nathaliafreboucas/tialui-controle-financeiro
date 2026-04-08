import { formatCurrency, getCategoryStatus } from '@/lib/finance'

interface Props {
  name: string
  spent: number
  limit: number
}

const colorMap = {
  ok: 'bg-green-500',
  warning: 'bg-yellow-500',
  exceeded: 'bg-red-500',
}

export default function CategoryProgressBar({ name, spent, limit }: Props) {
  const status = getCategoryStatus(spent, limit)
  const percentage = Math.min((spent / limit) * 100, 100)

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1 text-sm">
        <span>{name}</span>
        <span>
          <span>{formatCurrency(spent)}</span>
          {' / '}
          <span>{formatCurrency(limit)}</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          className={`h-3 rounded-full ${colorMap[status]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
