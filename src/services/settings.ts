import { getDoc, setDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { UserSettings } from '@/types'

const COL = 'settings'

export async function getSettings(userId: string): Promise<UserSettings | null> {
  const snap = await getDoc(doc(db, COL, userId))
  if (!snap.exists()) return null
  return snap.data() as UserSettings
}

export async function saveSettings(data: UserSettings): Promise<void> {
  await setDoc(doc(db, COL, data.userId), data, { merge: true })
}
