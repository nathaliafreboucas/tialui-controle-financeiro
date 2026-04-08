'use client'

import { useState, useEffect } from 'react'
import { FiX, FiLoader } from 'react-icons/fi'
import type { Category, NewCategory } from '@/types'
import CurrencyField from './CurrencyField'

interface Props {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: NewCategory) => Promise<void>
  onUpdate: (id: string, patch: Partial<Pick<Category, 'name' | 'limit'>>) => Promise<void>
  userId: string
  /** Passa uma categoria existente para entrar no modo de edição. */
  editing?: Category | null
}

export default function CategoryModal({ isOpen, onClose, onAdd, onUpdate, userId, editing }: Props) {
  const [name, setName] = useState('')
  const [limit, setLimit] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(editing?.name ?? '')
      setLimit(editing?.limit ?? 0)
    }
  }, [isOpen, editing])

  if (!isOpen) return null

  const isEdit = !!editing

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit && editing) {
        await onUpdate(editing.id, { name, limit: limit > 0 ? limit : undefined })
      } else {
        await onAdd({ userId, name, limit: limit > 0 ? limit : undefined })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {isEdit ? 'Editar Categoria' : 'Nova Categoria'}
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cat-name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nome
            </label>
            <input
              id="cat-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition"
            />
          </div>

          <CurrencyField
            id="cat-limit"
            label="Limite Mensal (opcional)"
            valueCents={limit}
            onChange={setLimit}
            hint="Deixe em zero para não definir limite"
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
              aria-label={saving ? 'Salvando' : isEdit ? 'Salvar' : 'Criar'}
              className="flex-1 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
            >
              {saving ? (
                <>
                  <FiLoader className="animate-spin" />
                  Salvando
                </>
              ) : isEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
