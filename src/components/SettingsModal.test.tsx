import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsModal from './SettingsModal'
import type { UserSettings } from '@/types'

const MOCK_SETTINGS: UserSettings = {
  userId: 'u1',
  monthlyIncome: 500000,  // R$ 5.000,00 em centavos
  billingCycleDay: 1,
  savingsGoal: 50000,     // R$ 500,00 em centavos
}

describe('SettingsModal', () => {
  it('should not render when isOpen is false', () => {
    const { container } = render(
      <SettingsModal isOpen={false} onClose={jest.fn()} onSave={jest.fn()} userId="u1" />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('should render the form fields when isOpen is true', () => {
    render(<SettingsModal isOpen onClose={jest.fn()} onSave={jest.fn()} userId="u1" />)
    expect(screen.getByLabelText(/salário mensal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cofrinho/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/dia de fechamento/i)).toBeInTheDocument()
  })

  it('should pre-fill currency fields with formatted values from existing settings', () => {
    render(
      <SettingsModal isOpen onClose={jest.fn()} onSave={jest.fn()} userId="u1" initialSettings={MOCK_SETTINGS} />
    )
    expect(screen.getByLabelText(/salário mensal/i)).toHaveValue('R$ 5.000,00')
    expect(screen.getByLabelText(/cofrinho/i)).toHaveValue('R$ 500,00')
    expect(screen.getByLabelText(/dia de fechamento/i)).toHaveValue(1)
  })

  it('should call onSave with centavos on submit', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)
    render(
      <SettingsModal isOpen onClose={jest.fn()} onSave={onSave} userId="u1" initialSettings={MOCK_SETTINGS} />
    )
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        userId: 'u1',
        monthlyIncome: 500000,
        billingCycleDay: 1,
        savingsGoal: 50000,
      })
    })
  })

  it('should call onClose when cancel button is clicked', async () => {
    const onClose = jest.fn()
    render(<SettingsModal isOpen onClose={onClose} onSave={jest.fn()} userId="u1" />)
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should show loading state while saving', async () => {
    const onSave = jest.fn(() => new Promise(() => {})) // nunca resolve
    render(
      <SettingsModal isOpen onClose={jest.fn()} onSave={onSave} userId="u1" initialSettings={MOCK_SETTINGS} />
    )
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled()
  })

  it('should format typed digits as BRL currency', async () => {
    render(<SettingsModal isOpen onClose={jest.fn()} onSave={jest.fn()} userId="u1" />)
    const incomeInput = screen.getByLabelText(/salário mensal/i)
    await userEvent.clear(incomeInput)
    await userEvent.type(incomeInput, '300000') // digita "300000" → R$ 3.000,00
    expect(incomeInput).toHaveValue('R$ 3.000,00')
  })
})
