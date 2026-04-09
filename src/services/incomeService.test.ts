import { addExtraIncome } from './incomeService'
import { addTransaction } from './transactions'
import { calculateAvailableBalance } from '@/lib/finance'

jest.mock('./transactions', () => ({
  addTransaction: jest.fn(),
}))

const mockAddTransaction = addTransaction as jest.Mock

beforeEach(() => jest.clearAllMocks())

describe('addExtraIncome', () => {
  it('cria uma transação com type "extra" e categoryId vazio', async () => {
    mockAddTransaction.mockResolvedValueOnce('tx-new')

    await addExtraIncome({
      userId: 'user-1',
      description: 'Bônus',
      amount: 50000, // R$ 500,00
      date: '2026-11-20',
    })

    expect(mockAddTransaction).toHaveBeenCalledWith({
      userId: 'user-1',
      description: 'Bônus',
      amount: 50000,
      date: '2026-11-20',
      type: 'extra',
      categoryId: '',
    })
  })

  it('retorna o id da transação criada', async () => {
    mockAddTransaction.mockResolvedValueOnce('tx-bonus-id')

    const id = await addExtraIncome({
      userId: 'user-1',
      description: 'Freela',
      amount: 20000,
      date: '2026-11-25',
    })

    expect(id).toBe('tx-bonus-id')
  })

  it('soma corretamente ao saldo do mês em que foi recebida', () => {
    // A renda extra entra no campo "extras" do calculateAvailableBalance
    const balance = calculateAvailableBalance({
      income: 300000,  // R$ 3.000,00
      extras: 50000,   // R$ 500,00 de renda extra
      savings: 0,
      fixedExpenses: 0,
      variableExpenses: 0,
    })
    expect(balance).toBe(350000) // R$ 3.500,00
  })

  it('não altera o saldo de outros meses (transação restrita à data informada)', async () => {
    mockAddTransaction.mockResolvedValueOnce('tx-id')

    await addExtraIncome({
      userId: 'user-1',
      description: 'Bônus',
      amount: 50000,
      date: '2026-11-20',
    })

    // A data da transação deve ser exatamente a informada
    const calledWith = mockAddTransaction.mock.calls[0][0]
    expect(calledWith.date).toBe('2026-11-20')
  })
})
