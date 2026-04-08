import { useEffect, useState } from 'react'
import {
  getCycleTransactions,
  addTransaction as svcAdd,
  deleteTransaction as svcDelete,
} from '@/services/transactions'
import type { Transaction, NewTransaction } from '@/types'

export function useTransactions(userId: string | null, startDate: string, endDate: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    getCycleTransactions(userId, startDate, endDate)
      .then(setTransactions)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId, startDate, endDate])

  async function add(data: NewTransaction): Promise<void> {
    const id = await svcAdd(data)
    setTransactions((prev) => [{ id, ...data }, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
  }

  async function remove(id: string): Promise<void> {
    await svcDelete(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  return { transactions, loading, error, add, remove }
}
