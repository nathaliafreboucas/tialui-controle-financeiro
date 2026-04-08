import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Category, NewCategory } from '@/types'

const COL = 'categories'

function mapDoc(d: { id: string; data: () => object }): Category {
  return { id: d.id, ...(d.data() as Omit<Category, 'id'>) }
}

export async function getCategories(userId: string): Promise<Category[]> {
  const [systemSnap, userSnap] = await Promise.all([
    getDocs(query(collection(db, COL), where('userId', '==', 'system'))),
    getDocs(query(collection(db, COL), where('userId', '==', userId))),
  ])

  return [...systemSnap.docs.map(mapDoc), ...userSnap.docs.map(mapDoc)]
}

export async function addCategory(data: NewCategory): Promise<string> {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))
  const ref = await addDoc(collection(db, COL), clean)
  return ref.id
}

export async function updateCategory(id: string, patch: Partial<Pick<Category, 'name' | 'limit'>>): Promise<void> {
  const data: Record<string, unknown> = {}
  if (patch.name !== undefined) data.name = patch.name
  data.limit = patch.limit !== undefined ? patch.limit : deleteField()
  await updateDoc(doc(db, COL, id), data)
}
