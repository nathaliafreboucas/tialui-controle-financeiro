import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Transaction, NewTransaction } from '@/types'

const COL = 'transactions'

export async function addTransaction(data: NewTransaction): Promise<string> {
  const ref = await addDoc(collection(db, COL), data)
  return ref.id
}

export async function getCycleTransactions(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  // Query only by userId — date filtering is done client-side to avoid composite index.
  const q = query(collection(db, COL), where('userId', '==', userId))
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Transaction, 'id'>) }))
    .filter((t) => t.date >= startDate && t.date <= endDate)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}

export async function getSavingsTransactions(userId: string): Promise<Transaction[]> {
  const q = query(
    collection(db, COL),
    where('userId', '==', userId),
    where('type', '==', 'savings')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Transaction, 'id'>) }))
    .sort((a, b) => b.date.localeCompare(a.date))
}
