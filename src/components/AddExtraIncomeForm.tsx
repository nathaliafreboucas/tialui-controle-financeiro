'use client'

import { useState } from 'react'
import { FiX, FiLoader } from 'react-icons/fi'
import CurrencyField from './CurrencyField'

interface ExtraIncomeFormData {
  description: string
  amount: number
  date: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ExtraIncomeFormData) => Promise<void>
}

const today = () => new Date().toISOString().split('T')[0]

export default function AddExtraIncomeForm({ isOpen, onClose, onSave }: Props) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)

  function handleClose() {
    setDescription('')
    setAmount(0)
    setDate(today)
    onClose()
  }

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ description, amount, date })
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
            Adicionar Renda Extra
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="extra-description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Descrição
            </label>
            <input
              id="extra-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Ex: Bônus, Freela, Venda..."
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500 transition"
            />
          </div>

          <CurrencyField
            id="extra-amount"
            label="Valor"
            valueCents={amount}
            onChange={setAmount}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="extra-date" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Data
            </label>
            <input
              id="extra-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500 transition"
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
              aria-label={saving ? 'Salvando' : 'Adicionar'}
              className="flex-1 py-2.5 rounded-lg bg-green-600 dark:bg-green-500 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-green-700 dark:hover:bg-green-400 transition-colors"
            >
              {saving ? (
                <>
                  <FiLoader className="animate-spin" />
                  Salvando
                </>
              ) : (
                'Adicionar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
