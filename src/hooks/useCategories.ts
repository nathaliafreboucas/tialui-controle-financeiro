import { useEffect, useState } from 'react'
import { getCategories, addCategory as svcAdd, updateCategory as svcUpdate } from '@/services/categories'
import type { Category, NewCategory } from '@/types'

export function useCategories(userId: string | null) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    getCategories(userId)
      .then(setCategories)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

  async function add(data: NewCategory): Promise<void> {
    const id = await svcAdd(data)
    setCategories((prev) => [...prev, { id, ...data }])
  }

  async function update(id: string, patch: Partial<Pick<Category, 'name' | 'limit'>>): Promise<void> {
    await svcUpdate(id, patch)
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  return { categories, loading, error, add, update }
}
