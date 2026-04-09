'use client'

import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useSettings } from '@/hooks/useSettings'
import type { Transaction, Category, UserSettings, NewTransaction, NewCategory, CreditCardPurchaseInput } from '@/types'
import { addCreditCardInstallments } from '@/services/creditCardService'

// ---------------------------------------------------------------------------
// Cycle date helpers
// ---------------------------------------------------------------------------

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Returns the ISO start/end dates for a billing cycle.
 *
 * If billingCycleDay = 10 and cycleMonth = { year: 2026, month: 4 }:
 *   start = 2026-04-10, end = 2026-05-09
 *
 * billingCycleDay = 1 gives calendar-month behaviour.
 */
function getCycleDates(year: number, month: number, billingCycleDay: number) {
  const day = Math.max(1, Math.min(28, billingCycleDay))
  const start = new Date(year, month - 1, day)
  const end = new Date(year, month, day - 1) // next month, day before
  return { startDate: toISO(start), endDate: toISO(end) }
}

/**
 * Returns the { year, month } of the cycle that is currently active,
 * based on today's date and the billing cycle day.
 */
function activeCycleMonth(billingCycleDay: number): { year: number; month: number } {
  const today = new Date()
  const day = Math.max(1, Math.min(28, billingCycleDay))
  if (today.getDate() >= day) {
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  }
  // Cycle started in the previous calendar month
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
  const endYear = endDate.slice(0, 4)
  const year = endYear
  return `${fmt(startDate)} – ${fmt(endDate)} ${year}`
}

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------

interface FinanceContextType {
  transactions: Transaction[]
  categories: Category[]
  settings: UserSettings | null
  totalFixed: number
  totalVariable: number
  totalExtras: number
  categorySpend: Record<string, number>
  loading: boolean
  error: string | null
  // Cycle navigation
  cycleLabel: string
  isCurrentCycle: boolean
  prevCycle: () => void
  nextCycle: () => void
  // Actions
  addTransaction: (data: NewTransaction) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  addCreditCardPurchase: (data: CreditCardPurchaseInput) => Promise<void>
  addCategory: (data: NewCategory) => Promise<void>
  updateCategory: (id: string, patch: Partial<Pick<Category, 'name' | 'limit'>>) => Promise<void>
  saveSettings: (data: UserSettings) => Promise<void>
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

  // Cycle navigation state — initialised to the active cycle for the current day.
  const [cycleMonth, setCycleMonth] = useState<{ year: number; month: number }>(
    () => activeCycleMonth(1)
  )

  // Once settings load, jump to the real active cycle if it differs.
  useEffect(() => {
    if (!settings) return
    const active = activeCycleMonth(settings.billingCycleDay)
    setCycleMonth(active)
  }, [settings?.billingCycleDay]) // eslint-disable-line react-hooks/exhaustive-deps

  const { startDate, endDate } = useMemo(
    () => getCycleDates(cycleMonth.year, cycleMonth.month, billingCycleDay),
    [cycleMonth, billingCycleDay]
  )

  const { transactions, loading: txLoading, error: txError, add: addTx, remove: removeTx } =
    useTransactions(userId, startDate, endDate)

  const { categories, loading: catLoading, error: catError, add: addCat, update: updateCat } =
    useCategories(userId)

  // ---- Aggregates ----------------------------------------------------------

  const totalFixed = useMemo(
    () => transactions.filter((t) => t.type === 'fixed').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const totalVariable = useMemo(
    () => transactions.filter((t) => t.type === 'variable').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const totalExtras = useMemo(
    () => transactions.filter((t) => t.type === 'extra').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const categorySpend = useMemo(
    () =>
      transactions.reduce<Record<string, number>>((map, t) => {
        if (t.categoryId) map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount
        return map
      }, {}),
    [transactions]
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
        categories,
        settings,
        totalFixed,
        totalVariable,
        totalExtras,
        categorySpend,
        loading: txLoading || catLoading || settingsLoading,
        error: txError ?? catError ?? settingsError ?? null,
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
