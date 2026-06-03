'use client'

import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useSettings } from '@/hooks/useSettings'
import { useFixedExpenses } from '@/hooks/useFixedExpenses'
import { isActiveInCycle, toCycleKey } from '@/services/fixedExpenseService'
import { addCreditCardInstallments } from '@/services/creditCardService'
import type {
  Transaction,
  Category,
  UserSettings,
  NewTransaction,
  NewCategory,
  CreditCardPurchaseInput,
  FixedExpense,
  NewFixedExpense,
} from '@/types'

// ---------------------------------------------------------------------------
// Cycle date helpers
// ---------------------------------------------------------------------------

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getCycleDates(year: number, month: number, billingCycleDay: number) {
  const day = Math.max(1, Math.min(28, billingCycleDay))
  const start = new Date(year, month - 1, day)
  const end = new Date(year, month, day - 1)
  return { startDate: toISO(start), endDate: toISO(end) }
}

function activeCycleMonth(billingCycleDay: number): { year: number; month: number } {
  const today = new Date()
  const day = Math.max(1, Math.min(28, billingCycleDay))
  if (today.getDate() >= day) {
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  }
  const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  return { year: prev.getFullYear(), month: prev.getMonth() + 1 }
}

function addMonths(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

function formatCycleLabel(startDate: string, endDate: string): string {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  }
  const year = endDate.slice(0, 4)
  return `${fmt(startDate)} – ${fmt(endDate)} ${year}`
}

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------

interface FinanceContextType {
  transactions: Transaction[]
  fixedExpenses: FixedExpense[]
  activeFixedExpenses: FixedExpense[] // active in current cycle
  categories: Category[]
  settings: UserSettings | null
  totalFixed: number
  totalVariable: number
  totalExtras: number
  totalSavings: number
  categorySpend: Record<string, number>
  loading: boolean
  error: string | null
  cycleLabel: string
  isCurrentCycle: boolean
  prevCycle: () => void
  nextCycle: () => void
  addTransaction: (data: NewTransaction) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  addCreditCardPurchase: (data: CreditCardPurchaseInput) => Promise<void>
  addCategory: (data: NewCategory) => Promise<void>
  updateCategory: (id: string, patch: Partial<Pick<Category, 'name' | 'limit'>>) => Promise<void>
  saveSettings: (data: UserSettings) => Promise<void>
  addFixedExpense: (data: NewFixedExpense) => Promise<void>
  deactivateFixedExpense: (id: string, lastActiveCycle: string) => Promise<void>
  updateFixedExpense: (
    id: string,
    patch: Partial<Pick<FixedExpense, 'description' | 'amount' | 'categoryId'>>
  ) => Promise<void>
}

const FinanceContext = createContext<FinanceContextType | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const userId = user?.uid ?? null

  const { settings, loading: settingsLoading, error: settingsError, save: saveSets } = useSettings(userId)

  const billingCycleDay = settings?.billingCycleDay ?? 1

  const [cycleMonth, setCycleMonth] = useState<{ year: number; month: number }>(
    () => activeCycleMonth(1)
  )

  useEffect(() => {
    if (!settings) return
    const active = activeCycleMonth(settings.billingCycleDay)
    setCycleMonth(active)
  }, [settings?.billingCycleDay]) // eslint-disable-line react-hooks/exhaustive-deps

  const { startDate, endDate } = useMemo(
    () => getCycleDates(cycleMonth.year, cycleMonth.month, billingCycleDay),
    [cycleMonth, billingCycleDay]
  )

  const { transactions: allCycleTransactions, loading: txLoading, error: txError, add: addTx, remove: removeTx } =
    useTransactions(userId, startDate, endDate)

  // Transações para saldo e lista: só as faturadas no ciclo atual
  const transactions = useMemo(
    () => allCycleTransactions.filter((t) => t.date >= startDate && t.date <= endDate),
    [allCycleTransactions, startDate, endDate]
  )

  const { categories, loading: catLoading, error: catError, add: addCat, update: updateCat } =
    useCategories(userId)

  const {
    fixedExpenses,
    loading: feLoading,
    error: feError,
    add: addFE,
    deactivate: deactivateFE,
    update: updateFE,
  } = useFixedExpenses(userId)

  // Fixed expenses active in the current cycle
  const activeFixedExpenses = useMemo(() => {
    const cycleKey = toCycleKey(cycleMonth.year, cycleMonth.month)
    return fixedExpenses.filter((fe) => isActiveInCycle(fe, cycleKey))
  }, [fixedExpenses, cycleMonth])

  // ---- Aggregates ----------------------------------------------------------

  const totalFixed = useMemo(() => {
    const fromTransactions = transactions
      .filter((t) => t.type === 'fixed')
      .reduce((sum, t) => sum + t.amount, 0)
    const fromFixedExpenses = activeFixedExpenses.reduce((sum, fe) => sum + fe.amount, 0)
    return fromTransactions + fromFixedExpenses
  }, [transactions, activeFixedExpenses])

  const totalVariable = useMemo(
    () => transactions.filter((t) => t.type === 'variable').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const totalExtras = useMemo(
    () => transactions.filter((t) => t.type === 'extra').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const totalSavings = useMemo(
    () => transactions.filter((t) => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const categorySpend = useMemo(
    () =>
      allCycleTransactions.reduce<Record<string, number>>((map, t) => {
        // Usa purchaseDate para cartão (ciclo da compra), date para o resto
        const spendDate = t.purchaseDate ?? t.date
        if (spendDate >= startDate && spendDate <= endDate && t.categoryId) {
          map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount
        }
        return map
      }, {}),
    [allCycleTransactions, startDate, endDate]
  )

  // ---- Cycle navigation ----------------------------------------------------

  const cycleLabel = useMemo(() => formatCycleLabel(startDate, endDate), [startDate, endDate])

  const isCurrentCycle = useMemo(() => {
    const active = activeCycleMonth(billingCycleDay)
    return cycleMonth.year === active.year && cycleMonth.month === active.month
  }, [cycleMonth, billingCycleDay])

  function prevCycle() {
    setCycleMonth((c) => addMonths(c.year, c.month, -1))
  }

  function nextCycle() {
    setCycleMonth((c) => addMonths(c.year, c.month, 1))
  }

  // --------------------------------------------------------------------------

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        fixedExpenses,
        activeFixedExpenses,
        categories,
        settings,
        totalFixed,
        totalVariable,
        totalExtras,
        totalSavings,
        categorySpend,
        loading: txLoading || catLoading || settingsLoading || feLoading,
        error: txError ?? catError ?? settingsError ?? feError ?? null,
        cycleLabel,
        isCurrentCycle,
        prevCycle,
        nextCycle,
        addTransaction: addTx,
        deleteTransaction: removeTx,
        addCreditCardPurchase: (data) => addCreditCardInstallments(data).then(() => {}),
        addCategory: addCat,
        updateCategory: updateCat,
        saveSettings: saveSets,
        addFixedExpense: addFE,
        deactivateFixedExpense: deactivateFE,
        updateFixedExpense: updateFE,
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance(): FinanceContextType {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance deve ser usado dentro de FinanceProvider')
  return ctx
}
