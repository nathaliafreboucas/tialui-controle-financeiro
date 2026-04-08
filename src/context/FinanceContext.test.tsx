import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FinanceProvider, useFinance } from './FinanceContext'
import type { Transaction, Category } from '@/types'

// Mock hooks compostos pelo contexto
jest.mock('@/hooks/useTransactions')
jest.mock('@/hooks/useCategories')
jest.mock('@/hooks/useSettings')
jest.mock('@/hooks/useAuth')
jest.mock('@/lib/firebase', () => ({ auth: {}, db: {} }))
jest.mock('firebase/auth', () => ({ onAuthStateChanged: jest.fn() }))

import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useSettings } from '@/hooks/useSettings'
import { useAuth } from '@/hooks/useAuth'

const mockAdd = jest.fn()
const mockRemove = jest.fn()
const mockAddCat = jest.fn()
const mockSaveSettings = jest.fn()

const MOCK_TX: Transaction[] = [
  { id: 'tx1', userId: 'u1', description: 'Internet', amount: 10000, date: '2026-04-01', type: 'fixed', categoryId: 'c1' },
  { id: 'tx2', userId: 'u1', description: 'Mercado', amount: 25000, date: '2026-04-02', type: 'variable', categoryId: 'c2' },
]

const MOCK_CATS: Category[] = [
  { id: 'c1', userId: 'system', name: 'Contas' },
  { id: 'c2', userId: 'system', name: 'Mercado' },
]

function setupMocks(txOverrides = {}, catOverrides = {}, settingsOverrides = {}) {
  ;(useAuth as jest.Mock).mockReturnValue({ user: { uid: 'u1' } })
  ;(useTransactions as jest.Mock).mockReturnValue({
    transactions: MOCK_TX, loading: false, error: null, add: mockAdd, remove: mockRemove,
    ...txOverrides,
  })
  ;(useCategories as jest.Mock).mockReturnValue({
    categories: MOCK_CATS, loading: false, error: null, add: mockAddCat,
    ...catOverrides,
  })
  ;(useSettings as jest.Mock).mockReturnValue({
    settings: null, loading: false, error: null, save: mockSaveSettings,
    ...settingsOverrides,
  })
}

function TestConsumer() {
  const { transactions, categories, totalFixed, totalVariable, categorySpend, loading, addTransaction, deleteTransaction } = useFinance()
  return (
    <div>
      <span data-testid="tx-count">{transactions.length}</span>
      <span data-testid="cat-count">{categories.length}</span>
      <span data-testid="total-fixed">{totalFixed}</span>
      <span data-testid="total-variable">{totalVariable}</span>
      <span data-testid="spend-c1">{categorySpend['c1'] ?? 0}</span>
      <span data-testid="spend-c2">{categorySpend['c2'] ?? 0}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button onClick={() => addTransaction({ userId: 'u1', description: 'x', amount: 1000, date: '2026-04-07', type: 'variable', categoryId: 'c1' })}>
        Adicionar
      </button>
      <button onClick={() => deleteTransaction('tx1')}>Remover</button>
    </div>
  )
}

describe('FinanceProvider', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should provide transactions and categories to consumers', () => {
    setupMocks()
    render(<FinanceProvider><TestConsumer /></FinanceProvider>)
    expect(screen.getByTestId('tx-count').textContent).toBe('2')
    expect(screen.getByTestId('cat-count').textContent).toBe('2')
  })

  it('should compute totalFixed correctly', () => {
    setupMocks()
    render(<FinanceProvider><TestConsumer /></FinanceProvider>)
    expect(screen.getByTestId('total-fixed').textContent).toBe('10000')
  })

  it('should compute totalVariable correctly', () => {
    setupMocks()
    render(<FinanceProvider><TestConsumer /></FinanceProvider>)
    expect(screen.getByTestId('total-variable').textContent).toBe('25000')
  })

  it('should reflect loading=true when transactions are loading', () => {
    setupMocks({ loading: true })
    render(<FinanceProvider><TestConsumer /></FinanceProvider>)
    expect(screen.getByTestId('loading').textContent).toBe('true')
  })

  it('addTransaction should delegate to useTransactions.add', async () => {
    setupMocks()
    render(<FinanceProvider><TestConsumer /></FinanceProvider>)
    await userEvent.click(screen.getByText('Adicionar'))
    expect(mockAdd).toHaveBeenCalledTimes(1)
  })

  it('should compute categorySpend correctly per category', () => {
    setupMocks()
    render(<FinanceProvider><TestConsumer /></FinanceProvider>)
    expect(screen.getByTestId('spend-c1').textContent).toBe('10000')
    expect(screen.getByTestId('spend-c2').textContent).toBe('25000')
  })

  it('deleteTransaction should delegate to useTransactions.remove', async () => {
    setupMocks()
    render(<FinanceProvider><TestConsumer /></FinanceProvider>)
    await userEvent.click(screen.getByText('Remover'))
    expect(mockRemove).toHaveBeenCalledWith('tx1')
  })

  it('should throw when useFinance is used outside FinanceProvider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow('useFinance deve ser usado dentro de FinanceProvider')
    jest.restoreAllMocks()
  })
})
