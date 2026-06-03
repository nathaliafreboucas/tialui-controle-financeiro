'use client'

import { useState } from 'react'
import { FiX, FiLoader } from 'react-icons/fi'
import type { UserSettings } from '@/types'
import CurrencyField from './CurrencyField'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: UserSettings) => Promise<void>
  userId: string
  initialSettings?: UserSettings | null
}

export default function SettingsModal({ isOpen, onClose, onSave, userId, initialSettings }: Props) {
  const [income, setIncome] = useState(initialSettings?.monthlyIncome ?? 0)
  const [cycleDay, setCycleDay] = useState(initialSettings?.billingCycleDay ?? 1)
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ userId, monthlyIncome: income, savingsGoal: 0, billingCycleDay: cycleDay })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Configurações
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            aria-label="Fechar"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CurrencyField
            id="income"
            label="Salário Mensal"
            valueCents={income}
            onChange={setIncome}
            hint="Sua renda mensal principal"
          />
          <Field
            id="cycleDay"
            label="Dia de Fechamento"
            value={cycleDay}
            onChange={setCycleDay}
            min={1}
            max={28}
            hint="Dia do mês em que o ciclo reinicia"
          />

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              aria-label={saving ? 'Salvando' : 'Salvar'}
              className="flex-1 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
            >
              {saving ? (
                <>
                  <FiLoader className="animate-spin" />
                  Salvando
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  id, label, value, onChange, min, max, hint,
}: {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition"
      />
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  )
}
