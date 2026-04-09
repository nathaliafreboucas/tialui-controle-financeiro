import { collection, addDoc, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { FixedExpense, NewFixedExpense } from '@/types'

const COL = 'fixedExpenses'

export async function addFixedExpense(data: NewFixedExpense): Promise<string> {
  const ref = await addDoc(collection(db, COL), data)
  return ref.id
}

export async function getFixedExpenses(userId: string): Promise<FixedExpense[]> {
  const q = query(collection(db, COL), where('userId', '==', userId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FixedExpense, 'id'>) }))
}

/**
 * Deactivates a fixed expense from the given cycle month forward.
 * lastActiveCycle: 'YYYY-MM' — the last cycle it should appear in.
 */
export async function deactivateFixedExpense(
  id: string,
  lastActiveCycle: string
): Promise<void> {
  await updateDoc(doc(db, COL, id), { activeUntil: lastActiveCycle })
}

export async function updateFixedExpense(
  id: string,
  patch: Partial<Pick<FixedExpense, 'description' | 'amount' | 'categoryId'>>
): Promise<void> {
  await updateDoc(doc(db, COL, id), patch)
}

/**
 * Returns 'YYYY-MM' for a given year and month number.
 */
export function toCycleKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * Returns true if the fixed expense is active in the given cycle.
 */
export function isActiveInCycle(expense: FixedExpense, cycleKey: string): boolean {
  return (
    expense.activeFrom <= cycleKey &&
    (!expense.activeUntil || expense.activeUntil >= cycleKey)
  )
}
