import { addTransaction, getCycleTransactions, deleteTransaction } from './transactions'
import { addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore'
import type { NewTransaction } from '@/types'

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'col-ref'),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(() => 'doc-ref'),
  query: jest.fn((_col, ...args) => ({ col: _col, args })),
  where: jest.fn((field, op, val) => ({ field, op, val })),
  orderBy: jest.fn((field, dir) => ({ field, dir })),
  getFirestore: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

const mockAddDoc = addDoc as jest.Mock
const mockGetDocs = getDocs as jest.Mock
const mockDeleteDoc = deleteDoc as jest.Mock

const BASE_TX: NewTransaction = {
  userId: 'user1',
  description: 'Remédio',
  amount: 4590,
  date: '2026-04-05',
  type: 'variable',
  categoryId: 'cat1',
}

beforeEach(() => jest.clearAllMocks())

describe('addTransaction', () => {
  it('should call addDoc and return the new document id', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'tx-new-id' })
    const id = await addTransaction(BASE_TX)
    expect(mockAddDoc).toHaveBeenCalledTimes(1)
    expect(id).toBe('tx-new-id')
  })

  it('should pass the correct data to addDoc', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'tx-new-id' })
    await addTransaction(BASE_TX)
    const [, data] = mockAddDoc.mock.calls[0]
    expect(data).toMatchObject(BASE_TX)
  })
})

describe('getCycleTransactions', () => {
  it('should return only transactions within the startDate–endDate range', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'tx1', data: () => ({ ...BASE_TX, date: '2026-04-05' }) },
        { id: 'tx2', data: () => ({ ...BASE_TX, date: '2026-04-20' }) },
        { id: 'tx3', data: () => ({ ...BASE_TX, date: '2026-03-31' }) }, // antes do ciclo
        { id: 'tx4', data: () => ({ ...BASE_TX, date: '2026-05-01' }) }, // depois do ciclo
      ],
    })
    const result = await getCycleTransactions('user1', '2026-04-01', '2026-04-30')
    expect(result).toHaveLength(2)
    expect(result.map((t) => t.id)).toEqual(['tx2', 'tx1']) // ordenado desc
  })

  it('should return empty array when there are no transactions', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] })
    const result = await getCycleTransactions('user1', '2026-04-01', '2026-04-30')
    expect(result).toEqual([])
  })

  it('should query Firestore only by userId — no composite index required', async () => {
    const { where } = jest.requireMock('firebase/firestore')
    mockGetDocs.mockResolvedValueOnce({ docs: [] })
    await getCycleTransactions('user1', '2026-04-01', '2026-04-30')
    expect(where).toHaveBeenCalledTimes(1)
    expect(where).toHaveBeenCalledWith('userId', '==', 'user1')
  })

  it('should include transactions exactly on startDate and endDate (inclusive)', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'tx-start', data: () => ({ ...BASE_TX, date: '2026-04-10' }) },
        { id: 'tx-end',   data: () => ({ ...BASE_TX, date: '2026-05-09' }) },
        { id: 'tx-out',   data: () => ({ ...BASE_TX, date: '2026-05-10' }) },
      ],
    })
    const result = await getCycleTransactions('user1', '2026-04-10', '2026-05-09')
    expect(result).toHaveLength(2)
    expect(result.map((t) => t.id)).toContain('tx-start')
    expect(result.map((t) => t.id)).toContain('tx-end')
  })
})

describe('deleteTransaction', () => {
  it('should call deleteDoc with the correct doc reference', async () => {
    mockDeleteDoc.mockResolvedValueOnce(undefined)
    await deleteTransaction('tx-id-99')
    expect(doc).toHaveBeenCalledWith({}, 'transactions', 'tx-id-99')
    expect(mockDeleteDoc).toHaveBeenCalledWith('doc-ref')
  })
})
