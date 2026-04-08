import { getCategories, addCategory } from './categories'
import { getDocs, addDoc } from 'firebase/firestore'
import type { NewCategory } from '@/types'

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'col-ref'),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn((_col, ...args) => ({ col: _col, args })),
  where: jest.fn((field, op, val) => ({ field, op, val })),
  getFirestore: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

const mockGetDocs = getDocs as jest.Mock
const mockAddDoc = addDoc as jest.Mock

const SYSTEM_CATS = [
  { id: 's1', data: () => ({ userId: 'system', name: 'Farmácia', icon: 'pill' }) },
  { id: 's2', data: () => ({ userId: 'system', name: 'Lazer', icon: 'star' }) },
]

const USER_CATS = [
  { id: 'u1', data: () => ({ userId: 'user1', name: 'Pet Shop', limit: 150 }) },
]

describe('getCategories', () => {
  it('should merge system and user categories', async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: SYSTEM_CATS })
      .mockResolvedValueOnce({ docs: USER_CATS })

    const result = await getCategories('user1')
    expect(result).toHaveLength(3)
  })

  it('should include system categories with userId "system"', async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: SYSTEM_CATS })
      .mockResolvedValueOnce({ docs: [] })

    const result = await getCategories('user1')
    const systemOnly = result.filter((c) => c.userId === 'system')
    expect(systemOnly).toHaveLength(2)
  })

  it('should map id field from Firestore document', async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: SYSTEM_CATS })
      .mockResolvedValueOnce({ docs: USER_CATS })

    const result = await getCategories('user1')
    expect(result.find((c) => c.id === 's1')).toBeDefined()
    expect(result.find((c) => c.id === 'u1')).toBeDefined()
  })
})

describe('addCategory', () => {
  it('should call addDoc and return the new document id', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'cat-new' })
    const newCat: NewCategory = { userId: 'user1', name: 'Academia', limit: 100 }
    const id = await addCategory(newCat)
    expect(mockAddDoc).toHaveBeenCalledTimes(1)
    expect(id).toBe('cat-new')
  })
})
