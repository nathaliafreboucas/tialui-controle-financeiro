import { useState } from 'react'
import { formatCurrency } from '@/lib/finance'

interface Props {
  id: string
  label: string
  valueCents: number
  onChange: (cents: number) => void
  hint?: string
}

export default function CurrencyField({ id, label, valueCents, onChange, hint }: Props) {
  const [display, setDisplay] = useState(() => formatCurrency(valueCents))

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    const cents = parseInt(digits || '0', 10)
    setDisplay(formatCurrency(cents))
    onChange(cents)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition"
      />
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  )
}
