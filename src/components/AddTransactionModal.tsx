'use client'

import { useState } from 'react'
import { FiX, FiLoader } from 'react-icons/fi'
import type { Category, NewTransaction, CreditCardPurchaseInput } from '@/types'
import CurrencyField from './CurrencyField'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: NewTransaction) => Promise<void>
  onSaveCreditCard?: (data: CreditCardPurchaseInput) => Promise<void>
  userId: string
  categories: Category[]
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSave,
  onSaveCreditCard = async () => {},
  userId,
  categories,
}: Props) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(today)
  const type = 'variable'
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [isThirdParty, setIsThirdParty] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'debit' | 'credit_card'>('debit')
  const [installments, setInstallments] = useState('')
  const [saving, setSaving] = useState(false)
  const [amountError, setAmountError] = useState(false)

  function resetForm() {
    setDescription('')
    setAmount(0)
    setDate(today)
    setCategoryId(categories[0]?.id ?? '')
    setIsThirdParty(false)
    setPaymentMethod('debit')
    setInstallments('')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  function getTitle() {
    if (paymentMethod === 'credit_card') return 'Adicionar Compra no Cartão'
    return 'Adicionar Gasto'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (amount === 0) {
      setAmountError(true)
      return
    }
    setAmountError(false)
    setSaving(true)
    try {
      if (paymentMethod === 'credit_card') {
        await onSaveCreditCard({
          userId,
          description,
          totalAmount: amount,
          installments: parseInt(installments) || 1,
          purchaseDate: date,
          categoryId,
          type,
        })
      } else {
        const txData: NewTransaction = {
          userId,
          description,
          amount,
          date,
          type,
          categoryId,
        }
        if (isThirdParty) txData.isThirdParty = true
        await onSave(txData)
      }
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
            {getTitle()}
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
            <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Descrição
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition"
            />
          </div>

          <CurrencyField
            id="amount"
            label={paymentMethod === 'credit_card' ? 'Valor Total' : 'Valor'}
            valueCents={amount}
            onChange={(v) => { setAmount(v); if (v > 0) setAmountError(false) }}
          />
          {amountError && (
            <p className="text-xs text-red-500 -mt-2">Informe um valor maior que zero.</p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="date" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Data
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="paymentMethod" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Forma de Pagamento
            </label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'debit' | 'credit_card')}
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition"
            >
              <option value="debit">Dinheiro / Débito</option>
              <option value="credit_card">Cartão de Crédito</option>
            </select>
          </div>

          {paymentMethod === 'credit_card' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="installments" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Parcelas
              </label>
              <input
                id="installments"
                type="text"
                inputMode="numeric"
                value={installments}
                onChange={(e) => setInstallments(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 12"
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition"
              />
              {amount > 0 && installments !== '' && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {parseInt(installments) || 1}x de {(amount / (parseInt(installments) || 1) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  {' '}· 1ª parcela em{' '}
                  {(() => {
                    const [y, m] = date.split('-').map(Number)
                    return new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                  })()}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Categoria
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {paymentMethod !== 'credit_card' && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isThirdParty}
                onChange={(e) => setIsThirdParty(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 accent-zinc-900 dark:accent-zinc-50"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Gasto de terceiros
              </span>
            </label>
          )}

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
              className="flex-1 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
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
