'use client'

import { useState } from 'react'
import { FiX, FiLoader } from 'react-icons/fi'
import CurrencyField from './CurrencyField'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (amount: number, date: string) => Promise<void>
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function AddSavingsModal({ isOpen, onClose, onSave }: Props) {
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [amountError, setAmountError] = useState(false)

  function reset() {
    setAmount(0)
    setDate(today)
    setAmountError(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (amount === 0) { setAmountError(true); return }
    setSaving(true)
    try {
      await onSave(amount, date)
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Guardar no Cofrinho
          </h2>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            aria-label="Fechar"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CurrencyField
            id="savings-amount"
            label="Valor"
            valueCents={amount}
            onChange={(v) => { setAmount(v); if (v > 0) setAmountError(false) }}
          />
          {amountError && (
            <p className="text-xs text-red-500 -mt-2">Informe um valor maior que zero.</p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="savings-date" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Data
            </label>
            <input
              id="savings-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              {saving ? <FiLoader className="animate-spin" /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
