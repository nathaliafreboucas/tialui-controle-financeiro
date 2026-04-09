import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionList from './TransactionList'
import TransactionFilters, { EMPTY_FILTERS, type FilterState } from './TransactionFilters'
import type { Transaction, Category } from '@/types'

const CATEGORIES: Category[] = [
  { id: 'c1', userId: 'system', name: 'Mercado' },
  { id: 'c2', userId: 'system', name: 'Farmácia' },
]

const TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    userId: 'u1',
    description: 'Compra mercado',
    amount: 5000,
    date: '2026-04-01',
    type: 'variable',
    categoryId: 'c1',
    paymentMethod: 'debit',
  },
  {
    id: 't2',
    userId: 'u1',
    description: 'Remédio',
    amount: 3000,
    date: '2026-04-02',
    type: 'fixed',
    categoryId: 'c2',
    paymentMethod: 'debit',
  },
  {
    id: 't3',
    userId: 'u1',
    description: 'TV Samsung',
    amount: 10000,
    date: '2026-04-03',
    type: 'fixed',
    categoryId: 'c1',
    paymentMethod: 'credit_card',
    isThirdParty: true,
  },
]

function applyFilters(transactions: Transaction[], filters: FilterState): Transaction[] {
  return transactions.filter((t) => {
    if (filters.categoryId && t.categoryId !== filters.categoryId) return false
    if (filters.paymentMethod && t.paymentMethod !== filters.paymentMethod) return false
    if (filters.type && t.type !== filters.type) return false
    if (filters.thirdPartyOnly && !t.isThirdParty) return false
    return true
  })
}

describe('TransactionFilters', () => {
  it('renders all filter controls', () => {
    render(
      <TransactionFilters
        filters={EMPTY_FILTERS}
        onChange={jest.fn()}
        categories={CATEGORIES}
      />
    )
    expect(screen.getByLabelText(/filtrar por categoria/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/filtrar por forma de pagamento/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/filtrar por tipo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/apenas gastos de terceiros/i)).toBeInTheDocument()
  })

  it('lists all categories as options', () => {
    render(
      <TransactionFilters
        filters={EMPTY_FILTERS}
        onChange={jest.fn()}
        categories={CATEGORIES}
      />
    )
    expect(screen.getByRole('option', { name: 'Mercado' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Farmácia' })).toBeInTheDocument()
  })

  it('calls onChange when category filter changes', async () => {
    const onChange = jest.fn()
    render(
      <TransactionFilters
        filters={EMPTY_FILTERS}
        onChange={onChange}
        categories={CATEGORIES}
      />
    )
    await userEvent.selectOptions(screen.getByLabelText(/filtrar por categoria/i), 'c1')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'c1' }))
  })

  it('calls onChange when payment method filter changes', async () => {
    const onChange = jest.fn()
    render(
      <TransactionFilters
        filters={EMPTY_FILTERS}
        onChange={onChange}
        categories={CATEGORIES}
      />
    )
    await userEvent.selectOptions(
      screen.getByLabelText(/filtrar por forma de pagamento/i),
      'credit_card'
    )
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: 'credit_card' })
    )
  })

  it('calls onChange when type filter changes', async () => {
    const onChange = jest.fn()
    render(
      <TransactionFilters
        filters={EMPTY_FILTERS}
        onChange={onChange}
        categories={CATEGORIES}
      />
    )
    await userEvent.selectOptions(screen.getByLabelText(/filtrar por tipo/i), 'fixed')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'fixed' }))
  })

  it('calls onChange when third-party checkbox is toggled', async () => {
    const onChange = jest.fn()
    render(
      <TransactionFilters
        filters={EMPTY_FILTERS}
        onChange={onChange}
        categories={CATEGORIES}
      />
    )
    await userEvent.click(screen.getByLabelText(/apenas gastos de terceiros/i))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ thirdPartyOnly: true }))
  })
})

describe('TransactionList with filters applied', () => {
  it('shows all transactions when no filter is active', () => {
    const filtered = applyFilters(TRANSACTIONS, EMPTY_FILTERS)
    render(
      <TransactionList
        transactions={filtered}
        categories={CATEGORIES}
        onDelete={jest.fn()}
      />
    )
    expect(screen.getByText('Compra mercado')).toBeInTheDocument()
    expect(screen.getByText('Remédio')).toBeInTheDocument()
    expect(screen.getByText('TV Samsung')).toBeInTheDocument()
  })

  it('shows only Farmácia transactions when filtered by category c2', () => {
    const filtered = applyFilters(TRANSACTIONS, { ...EMPTY_FILTERS, categoryId: 'c2' })
    render(
      <TransactionList
        transactions={filtered}
        categories={CATEGORIES}
        onDelete={jest.fn()}
      />
    )
    expect(screen.queryByText('Compra mercado')).not.toBeInTheDocument()
    expect(screen.getByText('Remédio')).toBeInTheDocument()
    expect(screen.queryByText('TV Samsung')).not.toBeInTheDocument()
  })

  it('shows only credit card transactions when filtered by payment method', () => {
    const filtered = applyFilters(TRANSACTIONS, { ...EMPTY_FILTERS, paymentMethod: 'credit_card' })
    render(
      <TransactionList
        transactions={filtered}
        categories={CATEGORIES}
        onDelete={jest.fn()}
      />
    )
    expect(screen.queryByText('Compra mercado')).not.toBeInTheDocument()
    expect(screen.queryByText('Remédio')).not.toBeInTheDocument()
    expect(screen.getByText('TV Samsung')).toBeInTheDocument()
  })

  it('shows only fixed transactions when filtered by type', () => {
    const filtered = applyFilters(TRANSACTIONS, { ...EMPTY_FILTERS, type: 'fixed' })
    render(
      <TransactionList
        transactions={filtered}
        categories={CATEGORIES}
        onDelete={jest.fn()}
      />
    )
    expect(screen.queryByText('Compra mercado')).not.toBeInTheDocument()
    expect(screen.getByText('Remédio')).toBeInTheDocument()
    expect(screen.getByText('TV Samsung')).toBeInTheDocument()
  })

  it('shows only third-party transactions when thirdPartyOnly is true', () => {
    const filtered = applyFilters(TRANSACTIONS, { ...EMPTY_FILTERS, thirdPartyOnly: true })
    render(
      <TransactionList
        transactions={filtered}
        categories={CATEGORIES}
        onDelete={jest.fn()}
      />
    )
    expect(screen.queryByText('Compra mercado')).not.toBeInTheDocument()
    expect(screen.queryByText('Remédio')).not.toBeInTheDocument()
    expect(screen.getByText('TV Samsung')).toBeInTheDocument()
  })
})
