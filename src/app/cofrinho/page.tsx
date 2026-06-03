'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSavingsTransactions, addTransaction } from '@/services/transactions'
import { addCategory as svcAddCategory } from '@/services/categories'
import { formatCurrency } from '@/lib/finance'
import { FiArrowLeft, FiLoader, FiPlus, FiLogOut, FiSettings } from 'react-icons/fi'
import { PiPiggyBank } from 'react-icons/pi'
import type { Transaction } from '@/types'
import AuthForm from '@/components/AuthForm'
import ThemeToggle from '@/components/ThemeToggle'
import AddSavingsModal from '@/components/AddSavingsModal'
import Image from 'next/image'
import logo from '../../../public/icon-512x512.png'
import SettingsModal from '@/components/SettingsModal'
import { useFinance } from '@/context/FinanceContext'

export default function CofrinhoPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { settings, saveSettings, categories } = useFinance()
  const userId = user?.uid ?? null

  const [deposits, setDeposits] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    getSavingsTransactions(userId)
      .then(setDeposits)
      .finally(() => setLoading(false))
  }, [userId])

  const total = deposits.reduce((sum, d) => sum + d.amount, 0)

  async function handleSave(amount: number, date: string) {
    if (!userId) return
    const existing = categories.find((c) => c.name === 'Cofrinho')
    const categoryId = existing?.id ?? await svcAddCategory({ userId, name: 'Cofrinho' })
    const id = await addTransaction({
      userId,
      description: 'Cofrinho',
      amount,
      date,
      type: 'savings',
      categoryId,
    })
    const newDeposit: Transaction = { id, userId, description: 'Cofrinho', amount, date, type: 'savings', categoryId }
    setDeposits((prev) =>
      [newDeposit, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    )
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FiLoader className="animate-spin text-4xl text-zinc-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <AuthForm />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src={logo} alt="" width={40} />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Tialúi
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              aria-label="Configurações"
            >
              <FiSettings className="text-lg" />
            </button>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block truncate max-w-[140px]">
              {user.displayName ?? user.email}
            </span>
            <button
              onClick={signOut}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              aria-label="Sair"
            >
              <FiLogOut className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <a
            href="/"
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            aria-label="Voltar"
          >
            <FiArrowLeft className="text-lg" />
          </a>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Cofrinho
          </h1>
        </div>
      </div>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow p-6 flex flex-col items-center gap-3">
          <PiPiggyBank className="text-5xl text-blue-500" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Total guardado
          </p>
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(total)}
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FiPlus />
            Guardar dinheiro
          </button>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Histórico
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="animate-spin text-2xl text-zinc-400" />
            </div>
          ) : deposits.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 text-center text-sm text-zinc-400">
              Nenhum valor guardado ainda.
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
              {deposits.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <PiPiggyBank className="text-blue-400 text-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      Cofrinho
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                    {formatCurrency(d.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <AddSavingsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={saveSettings}
        userId={user.uid}
        initialSettings={settings}
      />
    </div>
  )
}
