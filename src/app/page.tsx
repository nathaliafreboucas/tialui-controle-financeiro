'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useFinance } from '@/context/FinanceContext'
import { getCategoryStatus } from '@/lib/finance'
import BalanceSummary from '@/components/BalanceSummary'
import CategoryProgressBar from '@/components/CategoryProgressBar'
import CategoryAlert from '@/components/CategoryAlert'
import AuthForm from '@/components/AuthForm'
import ThemeToggle from '@/components/ThemeToggle'
import SettingsModal from '@/components/SettingsModal'
import AddTransactionModal from '@/components/AddTransactionModal'
import FirebaseErrorBanner from '@/components/FirebaseErrorBanner'
import TransactionList from '@/components/TransactionList'
import CategoryModal from '@/components/CategoryModal'
import InvoiceBuilder from '@/components/InvoiceBuilder'
import { FiChevronLeft, FiChevronRight, FiLoader, FiLogOut, FiPlus, FiSettings } from 'react-icons/fi'
import { IoReceiptOutline, IoCloseOutline } from 'react-icons/io5'
import logo from '../../public/icon-512x512.png' 

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth()
  const {
    transactions,
    categories,
    settings,
    totalFixed,
    totalVariable,
    totalExtras,
    categorySpend,
    loading: financeLoading,
    error: financeError,
    addTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    saveSettings,
    cycleLabel,
    isCurrentCycle,
    prevCycle,
    nextCycle,
  } = useFinance()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addTxOpen, setAddTxOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<import('@/types').Category | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [invoiceBuilderOpen, setInvoiceBuilderOpen] = useState(false)

  const thirdPartyTransactions = transactions.filter((t) => t.isThirdParty)

  function toggleSelectTransaction(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  const loading = authLoading || financeLoading

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <FiLoader className="animate-spin text-4xl text-zinc-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex justify-end px-6 pt-5">
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm flex flex-col gap-8">
            <div className="flex flex-col justify-center text-center">
              <div className='w-full flex justify-center items-center gap-3'>
                <Image 
                  src={logo} alt={''}   
                  width={60}             
                  />
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Tialui
                </h1>
              </div>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Seu saldo real, sempre à vista.
              </p>
            </div>
            <AuthForm />
          </div>
        </main>
      </div>
    )
  }

  const income = settings?.monthlyIncome ?? 0
  const savingsGoal = settings?.savingsGoal ?? 0

  const categoriesWithLimit = categories.filter((c) => c.limit && c.limit > 0)

  const alerts = categoriesWithLimit.filter(
    (c) => getCategoryStatus(categorySpend[c.id] ?? 0, c.limit!) !== 'ok'
  )

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className='flex items-center gap-3'>
            <Image
              src={logo} alt={''}
              width={40}
            />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Tialui
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

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6">

        {financeError && <FirebaseErrorBanner message={financeError} />}

        {!settings && !financeError && (
          <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-4 text-sm text-yellow-800 dark:text-yellow-300 flex items-center justify-between gap-3">
            <span>Configure seu salário e cofrinho para calcular o saldo disponível.</span>
            <button
              onClick={() => setSettingsOpen(true)}
              className="shrink-0 font-medium underline underline-offset-2"
            >
              Configurar
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={prevCycle}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            aria-label="Ciclo anterior"
          >
            <FiChevronLeft className="text-lg" />
          </button>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300 text-center">
            {cycleLabel}
          </span>
          <button
            onClick={nextCycle}
            disabled={isCurrentCycle}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Próximo ciclo"
          >
            <FiChevronRight className="text-lg" />
          </button>
        </div>

        <BalanceSummary
          income={income}
          extras={totalExtras}
          savings={savingsGoal}
          fixedExpenses={totalFixed}
          variableExpenses={totalVariable}
        />

        {alerts.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Alertas
            </h2>
            {alerts.map((c) => (
              <CategoryAlert
                key={c.id}
                status={getCategoryStatus(categorySpend[c.id] ?? 0, c.limit!)}
                categoryName={c.name}
              />
            ))}
          </section>
        )}

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Categorias
            </h2>
            <button
              onClick={() => { setEditingCategory(null); setCategoryModalOpen(true) }}
              className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              aria-label="Nova categoria"
            >
              <FiPlus className="text-sm" />
              Nova
            </button>
          </div>
          {categoriesWithLimit.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 text-center text-sm text-zinc-400">
              Nenhuma categoria com limite definido ainda.
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-4 flex flex-col gap-5">
              {categoriesWithLimit.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setEditingCategory(c); setCategoryModalOpen(true) }}
                  className="text-left w-full"
                  aria-label={`Editar categoria ${c.name}`}
                >
                  <CategoryProgressBar
                    name={c.name}
                    spent={categorySpend[c.id] ?? 0}
                    limit={c.limit!}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Transações
            </h2>
            {thirdPartyTransactions.length > 0 && (
              selectionMode ? (
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <button
                      onClick={() => setInvoiceBuilderOpen(true)}
                      className="flex items-center gap-1 text-xs font-medium text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      <IoReceiptOutline className="text-sm" />
                      Cobrar ({selectedIds.size})
                    </button>
                  )}
                  <button
                    onClick={exitSelectionMode}
                    className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                    aria-label="Cancelar seleção"
                  >
                    <IoCloseOutline className="text-sm" />
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectionMode(true)}
                  className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                  aria-label="Selecionar gastos de terceiros"
                >
                  <IoReceiptOutline className="text-sm" />
                  Cobrar terceiros
                </button>
              )
            )}
          </div>
          <TransactionList
            transactions={transactions}
            categories={categories}
            onDelete={deleteTransaction}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectTransaction}
          />
        </section>

        <button
          type="button"
          onClick={() => setAddTxOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-3xl shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Adicionar gasto"
        >
          <FiPlus className="text-2xl" />
        </button>
      </main>

      {user && (
        <>
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onSave={saveSettings}
            userId={user.uid}
            initialSettings={settings}
          />
          <AddTransactionModal
            isOpen={addTxOpen}
            onClose={() => setAddTxOpen(false)}
            onSave={addTransaction}
            userId={user.uid}
            categories={categories}
          />
          <CategoryModal
            isOpen={categoryModalOpen}
            onClose={() => setCategoryModalOpen(false)}
            onAdd={addCategory}
            onUpdate={updateCategory}
            userId={user.uid}
            editing={editingCategory}
          />
          {invoiceBuilderOpen && selectedIds.size > 0 && (
            <InvoiceBuilder
              selectedTransactions={transactions.filter((t) => selectedIds.has(t.id))}
              onClose={() => { setInvoiceBuilderOpen(false); exitSelectionMode() }}
            />
          )}
        </>
      )}
    </div>
  )
}
