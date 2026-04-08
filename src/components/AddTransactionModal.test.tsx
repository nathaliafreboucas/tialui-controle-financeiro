import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddTransactionModal from './AddTransactionModal'
import type { Category } from '@/types'

const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', userId: 'system', name: 'Mercado' },
  { id: 'c2', userId: 'system', name: 'Farmácia' },
]

const today = new Date().toISOString().split('T')[0]

describe('AddTransactionModal', () => {
  it('should not render when isOpen is false', () => {
    const { container } = render(
      <AddTransactionModal
        isOpen={false}
        onClose={jest.fn()}
        onSave={jest.fn()}
        userId="u1"
        categories={MOCK_CATEGORIES}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('should render all form fields when isOpen is true', () => {
    render(
      <AddTransactionModal
        isOpen
        onClose={jest.fn()}
        onSave={jest.fn()}
        userId="u1"
        categories={MOCK_CATEGORIES}
      />
    )
    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/valor/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/data/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument()
  })

  it('should default date to today', () => {
    render(
      <AddTransactionModal
        isOpen
        onClose={jest.fn()}
        onSave={jest.fn()}
        userId="u1"
        categories={MOCK_CATEGORIES}
      />
    )
    expect(screen.getByLabelText(/data/i)).toHaveValue(today)
  })

  it('should list categories in the select', () => {
    render(
      <AddTransactionModal
        isOpen
        onClose={jest.fn()}
        onSave={jest.fn()}
        userId="u1"
        categories={MOCK_CATEGORIES}
      />
    )
    expect(screen.getByRole('option', { name: 'Mercado' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Farmácia' })).toBeInTheDocument()
  })

  it('should call onSave with correct NewTransaction data in centavos', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)
    render(
      <AddTransactionModal
        isOpen
        onClose={jest.fn()}
        onSave={onSave}
        userId="u1"
        categories={MOCK_CATEGORIES}
      />
    )

    await userEvent.type(screen.getByLabelText(/descrição/i), 'Compra no mercado')
    // Digita 5000 no campo de valor → R$ 50,00 (5000 centavos)
    await userEvent.type(screen.getByLabelText(/valor/i), '5000')
    await userEvent.selectOptions(screen.getByLabelText(/tipo/i), 'variable')
    await userEvent.selectOptions(screen.getByLabelText(/categoria/i), 'c2')
    await userEvent.click(screen.getByRole('button', { name: /adicionar/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        userId: 'u1',
        description: 'Compra no mercado',
        amount: 5000,
        date: today,
        type: 'variable',
        categoryId: 'c2',
      })
    })
  })

  it('should call onClose when cancel button is clicked', async () => {
    const onClose = jest.fn()
    render(
      <AddTransactionModal
        isOpen
        onClose={onClose}
        onSave={jest.fn()}
        userId="u1"
        categories={MOCK_CATEGORIES}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should show loading state while saving', async () => {
    const onSave = jest.fn(() => new Promise(() => {})) // nunca resolve
    render(
      <AddTransactionModal
        isOpen
        onClose={jest.fn()}
        onSave={onSave}
        userId="u1"
        categories={MOCK_CATEGORIES}
      />
    )
    await userEvent.type(screen.getByLabelText(/descrição/i), 'Teste')
    await userEvent.click(screen.getByRole('button', { name: /adicionar/i }))
    expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled()
  })

  it('should format amount field as BRL currency while typing', async () => {
    render(
      <AddTransactionModal
        isOpen
        onClose={jest.fn()}
        onSave={jest.fn()}
        userId="u1"
        categories={MOCK_CATEGORIES}
      />
    )
    await userEvent.type(screen.getByLabelText(/valor/i), '10000')
    expect(screen.getByLabelText(/valor/i)).toHaveValue('R$ 100,00')
  })
})
