import { render, screen } from '@testing-library/react'
import BalanceSummary from './BalanceSummary'

const defaultProps = {
  income: 500000,          // R$ 5.000,00
  extras: 0,
  savings: 50000,          // R$ 500,00
  fixedExpenses: 150000,   // R$ 1.500,00
  variableExpenses: 30000, // R$ 300,00
}

describe('BalanceSummary', () => {
  it('should render the "Saldo Disponível" label', () => {
    render(<BalanceSummary {...defaultProps} />)
    expect(screen.getByText('Saldo Disponível')).toBeInTheDocument()
  })

  it('should display the correct available balance (R$ 2.700,00)', () => {
    render(<BalanceSummary {...defaultProps} />)
    expect(screen.getByText('R$ 2.700,00')).toBeInTheDocument()
  })

  it('should display income, savings and fixed expenses labels', () => {
    render(<BalanceSummary {...defaultProps} />)
    expect(screen.getByText('Salário')).toBeInTheDocument()
    expect(screen.getByText('Cofrinho')).toBeInTheDocument()
    expect(screen.getByText('Gastos Fixos')).toBeInTheDocument()
  })

  it('should apply green color when balance is positive', () => {
    render(<BalanceSummary {...defaultProps} />)
    expect(screen.getByTestId('balance-value')).toHaveClass('text-green-600')
  })

  it('should apply red color when balance is negative', () => {
    render(
      <BalanceSummary
        income={100000}
        extras={0}
        savings={50000}
        fixedExpenses={80000}
        variableExpenses={0}
      />
    )
    expect(screen.getByTestId('balance-value')).toHaveClass('text-red-600')
  })

  it('should show extras when extras is greater than zero', () => {
    render(<BalanceSummary {...defaultProps} extras={20000} />)
    expect(screen.getByText('Renda Extra')).toBeInTheDocument()
    expect(screen.getByText('R$ 200,00')).toBeInTheDocument()
  })

  it('should NOT show extras when extras is zero', () => {
    render(<BalanceSummary {...defaultProps} extras={0} />)
    expect(screen.queryByText('Renda Extra')).not.toBeInTheDocument()
  })
})
