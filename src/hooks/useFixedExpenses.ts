import { useEffect, useState } from 'react'
import {
  getFixedExpenses,
  addFixedExpense as svcAdd,
  deactivateFixedExpense as svcDeactivate,
  updateFixedExpense as svcUpdate,
} from '@/services/fixedExpenseService'
import type { FixedExpense, NewFixedExpense } from '@/types'

export function useFixedExpenses(userId: string | null) {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    getFixedExpenses(userId)
      .then(setFixedExpenses)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

  async function add(data: NewFixedExpense): Promise<void> {
    const id = await svcAdd(data)
    setFixedExpenses((prev) => [...prev, { id, ...data }])
  }

  async function deactivate(id: string, lastActiveCycle: string): Promise<void> {
    await svcDeactivate(id, lastActiveCycle)
    setFixedExpenses((prev) =>
      prev.map((fe) => (fe.id === id ? { ...fe, activeUntil: lastActiveCycle } : fe))
    )
  }

  async function update(
    id: string,
    patch: Partial<Pick<FixedExpense, 'description' | 'amount' | 'categoryId'>>
  ): Promise<void> {
    await svcUpdate(id, patch)
    setFixedExpenses((prev) =>
      prev.map((fe) => (fe.id === id ? { ...fe, ...patch } : fe))
    )
  }

  return { fixedExpenses, loading, error, add, deactivate, update }
}
