import { CategoryStatus } from '@/lib/finance'

interface Props {
  status: CategoryStatus
  categoryName: string
}

const styles = {
  warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  exceeded: 'bg-red-100 border-red-400 text-red-800',
}

const messages = {
  warning: (name: string) => `Atenção: a categoria "${name}" atingiu 80% do limite.`,
  exceeded: (name: string) => `Limite ultrapassado na categoria "${name}".`,
}

export default function CategoryAlert({ status, categoryName }: Props) {
  if (status === 'ok') return null

  return (
    <div
      role="alert"
      className={`border-l-4 p-3 rounded ${styles[status]}`}
    >
      {messages[status](categoryName)}
    </div>
  )
}
