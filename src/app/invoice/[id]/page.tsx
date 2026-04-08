'use client'

import { use, useEffect, useState } from 'react'
import { FiLoader } from 'react-icons/fi'
import { IoTrashOutline, IoDownloadOutline, IoCheckboxOutline, IoSquareOutline } from 'react-icons/io5'
import { formatCurrency } from '@/lib/finance'
import { getInvoice, importInvoiceItems, deleteInvoiceItem, ignoreInvoice } from '@/services/billingService'
import { useAuth } from '@/hooks/useAuth'
import AuthForm from '@/components/AuthForm'
import type { Invoice } from '@/types'

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, loading: authLoading } = useAuth()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [ignoring, setIgnoring] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [done, setDone] = useState<'imported' | 'ignored' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getInvoice(id)
      .then((inv) => {
        setInvoice(inv)
        if (inv) setSelectedIds(new Set(inv.items.map((i) => i.transactionId)))
      })
      .catch(() => setError('Não foi possível carregar a cobrança.'))
      .finally(() => setLoading(false))
  }, [id])

  function toggleSelect(txId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(txId) ? next.delete(txId) : next.add(txId)
      return next
    })
  }

  async function handleDeleteItem(txId: string) {
    if (!invoice) return
    await deleteInvoiceItem(invoice.id, txId)
    setInvoice((prev) =>
      prev ? { ...prev, items: prev.items.filter((i) => i.transactionId !== txId) } : prev
    )
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(txId)
      return next
    })
  }

  async function handleImport() {
    if (!user || !invoice) return
    setImporting(true)
    try {
      await importInvoiceItems(user.uid, invoice.id, [...selectedIds])
      setDone('imported')
    } catch {
      setError('Erro ao importar gastos. Tente novamente.')
    } finally {
      setImporting(false)
    }
  }

  async function handleIgnore() {
    if (!invoice) return
    setIgnoring(true)
    try {
      await ignoreInvoice(invoice.id)
      setDone('ignored')
    } catch {
      setError('Erro ao ignorar cobrança.')
    } finally {
      setIgnoring(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FiLoader className="animate-spin text-4xl text-zinc-400" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Cobrança não encontrada</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">O link pode estar inválido ou ter expirado.</p>
        </div>
      </div>
    )
  }

  if (done === 'imported') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Gastos importados!</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Os itens foram adicionados ao seu controle financeiro.
          </p>
        </div>
      </div>
    )
  }

  if (done === 'ignored') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Cobrança ignorada</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Nenhum gasto foi adicionado ao seu controle.
          </p>
        </div>
      </div>
    )
  }

  const total = invoice.items
    .filter((i) => selectedIds.has(i.transactionId))
    .reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Tialui · Cobrança compartilhada
          </p>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Gastos a importar
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Selecione os itens que deseja adicionar ao seu controle financeiro.
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {!user && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 text-center">
              Faça login para importar os gastos para o seu controle.
            </p>
            <AuthForm />
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {invoice.items.map((item) => {
            const isSelected = selectedIds.has(item.transactionId)
            return (
              <div
                key={item.transactionId}
                className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
                  isSelected ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''
                }`}
                onClick={() => toggleSelect(item.transactionId)}
              >
                <span className="shrink-0 text-xl text-zinc-400 dark:text-zinc-500">
                  {isSelected ? (
                    <IoCheckboxOutline className="text-zinc-900 dark:text-zinc-50" />
                  ) : (
                    <IoSquareOutline />
                  )}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                    {item.description}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {item.date}
                    {' · '}
                    <span className={item.type === 'fixed' ? 'text-blue-500' : 'text-orange-500'}>
                      {item.type === 'fixed' ? 'fixo' : 'variável'}
                    </span>
                  </p>
                </div>

                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 shrink-0">
                  {formatCurrency(item.amount)}
                </span>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.transactionId) }}
                  className="p-1.5 text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors shrink-0"
                  aria-label="Remover item"
                >
                  <IoTrashOutline className="text-sm" />
                </button>
              </div>
            )
          })}

          {invoice.items.length === 0 && (
            <div className="p-8 text-center text-sm text-zinc-400">
              Todos os itens foram removidos.
            </div>
          )}
        </div>

        {invoice.items.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Total selecionado
            </span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(total)}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-2">
          {user && invoice.items.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importing || selectedIds.size === 0}
              className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
            >
              {importing ? (
                <>
                  <FiLoader className="animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <IoDownloadOutline className="text-base" />
                  Adicionar aos meus gastos
                </>
              )}
            </button>
          )}

          <button
            onClick={handleIgnore}
            disabled={ignoring}
            className="w-full py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {ignoring ? <FiLoader className="animate-spin" /> : <IoTrashOutline className="text-base" />}
            Ignorar cobrança
          </button>
        </div>
      </main>
    </div>
  )
}
