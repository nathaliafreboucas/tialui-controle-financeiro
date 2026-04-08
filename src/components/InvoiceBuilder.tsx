'use client'

import { useState } from 'react'
import { FiLoader, FiX } from 'react-icons/fi'
import { formatCurrency } from '@/lib/finance'
import { createInvoice } from '@/services/billingService'
import ShareButton from './ShareButton'
import type { Transaction, InvoiceItem } from '@/types'

interface Props {
  selectedTransactions: Transaction[]
  onClose: () => void
}

export default function InvoiceBuilder({ selectedTransactions, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)

  const total = selectedTransactions.reduce((sum, t) => sum + t.amount, 0)

  async function handleCreate() {
    setLoading(true)
    try {
      const items: InvoiceItem[] = selectedTransactions.map((t) => ({
        transactionId: t.id,
        description: t.description,
        amount: t.amount,
        date: t.date,
        type: t.type,
        categoryId: t.categoryId,
      }))
      const id = await createInvoice(selectedTransactions[0].userId, items)
      setInvoiceId(id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {invoiceId ? 'Cobrança criada!' : 'Criar cobrança'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            aria-label="Fechar"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {selectedTransactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-zinc-700 dark:text-zinc-300 truncate">{t.description}</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50 shrink-0">
                {formatCurrency(t.amount)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Total</span>
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {formatCurrency(total)}
          </span>
        </div>

        {!invoiceId ? (
          <button
            onClick={handleCreate}
            disabled={loading || selectedTransactions.length === 0}
            className="w-full py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" />
                Criando...
              </>
            ) : (
              'Criar cobrança'
            )}
          </button>
        ) : (
          <ShareButton invoiceId={invoiceId} />
        )}
      </div>
    </div>
  )
}
