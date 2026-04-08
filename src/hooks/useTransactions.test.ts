import { renderHook, waitFor, act } from '@testing-library/react'
import { useTransactions } from './useTransactions'
import * as txService from '@/services/transactions'
import type { Transaction, NewTransaction } from '@/types'

jest.mock('@/services/transactions', () => ({
  getCycleTransactions: jest.fn(),
  addTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
}))

const START = '2026-04-01'
const END   = '2026-04-30'

const MOCK_TX: Transaction[] = [
  { id: 'tx1', userId: 'u1', description: 'Luz', amount: 12000, date: '2026-04-05', type: 'fixed', categoryId: 'c1' },
  { id: 'tx2', userId: 'u1', description: 'Mercado', amount: 8000, date: '2026-04-06', type: 'variable', categoryId: 'c2' },
]

const NEW_TX: NewTransaction = {
  userId: 'u1', description: 'Nova', amount: 5000,
  date: '2026-04-07', type: 'variable', categoryId: 'c1',
}

describe('useTransactions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should start with loading=true and empty transactions', () => {
    ;(txService.getCycleTransactions as jest.Mock).mockResolvedValue([])
    const { result } = renderHook(() => useTransactions('u1', START, END))
    expect(result.current.loading).toBe(true)
    expect(result.current.transactions).toEqual([])
  })

  it('should fetch transactions on mount and set loading=false', async () => {
    ;(txService.getCycleTransactions as jest.Mock).mockResolvedValueOnce(MOCK_TX)
    const { result } = renderHook(() => useTransactions('u1', START, END))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.transactions).toEqual(MOCK_TX)
    expect(txService.getCycleTransactions).toHaveBeenCalledWith('u1', START, END)
  })

  it('should NOT fetch when userId is null', () => {
    const { result } = renderHook(() => useTransactions(null, START, END))
    expect(txService.getCycleTransactions).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('add() should call service and insert transaction sorted by date', async () => {
    ;(txService.getCycleTransactions as jest.Mock).mockResolvedValueOnce(MOCK_TX)
    ;(txService.addTransaction as jest.Mock).mockResolvedValueOnce('tx3')
    const { result } = renderHook(() => useTransactions('u1', START, END))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.add(NEW_TX) })

    expect(txService.addTransaction).toHaveBeenCalledWith(NEW_TX)
    expect(result.current.transactions).toHaveLength(3)
    expect(result.current.transactions.find((t) => t.id === 'tx3')).toMatchObject({ id: 'tx3', ...NEW_TX })
  })

  it('should set error when fetch fails', async () => {
    ;(txService.getCycleTransactions as jest.Mock).mockRejectedValueOnce(new Error('client is offline'))
    const { result } = renderHook(() => useTransactions('u1', START, END))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toMatch(/offline/i)
    expect(result.current.transactions).toEqual([])
  })

  it('remove() should call service and remove transaction from state', async () => {
    ;(txService.getCycleTransactions as jest.Mock).mockResolvedValueOnce(MOCK_TX)
    ;(txService.deleteTransaction as jest.Mock).mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useTransactions('u1', START, END))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.remove('tx1') })

    expect(txService.deleteTransaction).toHaveBeenCalledWith('tx1')
    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions.find((t) => t.id === 'tx1')).toBeUndefined()
  })
})
