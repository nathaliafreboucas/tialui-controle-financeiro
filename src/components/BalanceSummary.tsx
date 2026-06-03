import { calculateAvailableBalance, formatCurrency } from '@/lib/finance'

interface Props {
  income: number
  extras: number
  savings: number
  fixedExpenses: number
  variableExpenses: number
}

export default function BalanceSummary({
  income,
  extras,
  savings,
  fixedExpenses,
  variableExpenses,
}: Props) {
  const available = calculateAvailableBalance({
    income,
    extras,
    savings,
    fixedExpenses,
    variableExpenses,
  })

  const isPositive = available >= 0

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow p-6 flex flex-col gap-4">
      <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        Saldo Disponível
      </h2>

      <p
        data-testid="balance-value"
        className={`text-4xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
      >
        {formatCurrency(available)}
      </p>

      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <Row label="Salário" value={formatCurrency(income)} />
        {extras > 0 && <Row label="Renda Extra" value={formatCurrency(extras)} positive />}
        {savings > 0 && <Row label="Cofrinho" value={`${formatCurrency(savings)}`} savings />}
        <Row label="Gastos Fixos" value={`- ${formatCurrency(fixedExpenses)}`} negative />
        <Row label="Gastos Variáveis" value={`- ${formatCurrency(variableExpenses)}`} negative />
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  positive,
  negative,
  savings,
}: {
  label: string
  value: string
  positive?: boolean
  negative?: boolean
  savings?: boolean
}) {
  const color = positive
    ? 'text-green-600'
    : negative
      ? 'text-red-500'
      : savings
        ? 'text-blue-500'
        : ''

  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  )
}
