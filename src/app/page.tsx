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
import AddExtraIncomeForm from '@/components/AddExtraIncomeForm'
import { DraggableFloatingGroup } from '@/components/DraggableFloatingGroup'
import FirebaseErrorBanner from '@/components/FirebaseErrorBanner'
import TransactionList from '@/components/TransactionList'
import TransactionFilters, { EMPTY_FILTERS, type FilterState } from '@/components/TransactionFilters'
import CategoryModal from '@/components/CategoryModal'
import InvoiceBuilder from '@/components/InvoiceBuilder'
import { FiChevronLeft, FiChevronRight, FiList, FiLoader, FiLogOut, FiPlus, FiSettings, FiTrendingUp } from 'react-icons/fi'
import { PiPiggyBank } from 'react-icons/pi'
import { IoReceiptOutline, IoCloseOutline } from 'react-icons/io5'
import logo from '../../public/icon-512x512.png' 

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth()
  const {
    transactions,
    activeFixedExpenses,
    categories,
    settings,
    totalFixed,
    totalVariable,
    totalExtras,
    totalSavings,
    categorySpend,
    loading: financeLoading,
    error: financeError,
    addTransaction,
    deleteTransaction,
    addCreditCardPurchase,
    addCategory,
    updateCategory,
    saveSettings,
    cycleLabel,
    prevCycle,
    nextCycle,
  } = useFinance()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addTxOpen, setAddTxOpen] = useState(false)
  const [addExtraIncomeOpen, setAddExtraIncomeOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<import('@/types').Category | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [invoiceBuilderOpen, setInvoiceBuilderOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)

  const thirdPartyTransactions = transactions.filter((t) => t.isThirdParty)

  const filteredTransactions = transactions.filter((t) => {
    if (filters.categoryId && t.categoryId !== filters.categoryId) return false
    if (filters.paymentMethod && t.paymentMethod !== filters.paymentMethod) return false
    if (filters.type && t.type !== filters.type) return false
    if (filters.thirdPartyOnly && !t.isThirdParty) return false
    return true
  })

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
                  Tialúi
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

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6">

        {financeError && <FirebaseErrorBanner message={financeError} />}

        {!settings && !financeError && (
          <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-4 text-sm text-yellow-800 dark:text-yellow-300 flex items-center justify-between gap-3">
            <span>Configure seu salário para calcular o saldo disponível.</span>
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
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            aria-label="Próximo ciclo"
          >
            <FiChevronRight className="text-lg" />
          </button>
        </div>

        <BalanceSummary
          income={income}
          extras={totalExtras}
          savings={totalSavings}
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
            <div className="flex items-center gap-3">
              <a
                href="/categories"
                className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                <FiList className="text-sm" />
                Gerenciar
              </a>
              <button
                onClick={() => { setEditingCategory(null); setCategoryModalOpen(true) }}
                className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                aria-label="Nova categoria"
              >
                <FiPlus className="text-sm" />
                Nova
              </button>
            </div>
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
              Gastos Fixos Recorrentes
            </h2>
            <div className="flex items-center gap-3">
              {activeFixedExpenses.length > 0 && (
                <a
                  href="/fixed-expenses"
                  className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                >
                  <FiList className="text-sm" />
                  Gerenciar
                </a>
              )}
              <a
                href="/fixed-expenses"
                className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                <FiPlus className="text-sm" />
                Adicionar
              </a>
            </div>
          </div>
          {activeFixedExpenses.length > 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
              {activeFixedExpenses.map((fe) => (
                <div key={fe.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                      {fe.description}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {categories.find((c) => c.id === fe.categoryId)?.name ?? '—'}
                      {' · '}
                      <span className="text-blue-500">fixo recorrente</span>
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 shrink-0">
                    {(fe.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 text-center text-sm text-zinc-400">
              Nenhum gasto fixo recorrente.{' '}
              <a href="/fixed-expenses" className="underline hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                Adicionar
              </a>
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
          <TransactionFilters
            filters={filters}
            onChange={setFilters}
            categories={categories}
          />
          <TransactionList
            transactions={filteredTransactions}
            categories={categories}
            onDelete={deleteTransaction}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectTransaction}
          />
        </section>

        <DraggableFloatingGroup>
          <a
            href="/cofrinho"
            className="w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-500 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="Cofrinho"
          >
            <PiPiggyBank className="text-xl" />
          </a>

          <button
            type="button"
            onClick={() => setAddExtraIncomeOpen(true)}
            className="w-12 h-12 rounded-full bg-green-600 dark:bg-green-500 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="Adicionar renda extra"
          >
            <FiTrendingUp className="text-xl" />
          </button>

          <button
            type="button"
            onClick={() => setAddTxOpen(true)}
            className="w-14 h-14 rounded-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="Adicionar gasto"
          >
            <FiPlus className="text-2xl" />
          </button>
        </DraggableFloatingGroup>
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
            onSaveCreditCard={addCreditCardPurchase}
            userId={user.uid}
            categories={categories}
          />
          <AddExtraIncomeForm
            isOpen={addExtraIncomeOpen}
            onClose={() => setAddExtraIncomeOpen(false)}
            onSave={async ({ description, amount, date }) => {
              await addTransaction({
                userId: user.uid,
                description,
                amount,
                date,
                type: 'extra',
                categoryId: '',
              })
            }}
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
