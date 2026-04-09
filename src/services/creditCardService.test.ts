import { addCreditCardInstallments } from './creditCardService'
import { addTransaction } from './transactions'
import { addDoc } from 'firebase/firestore'
import { calculateAvailableBalance } from '@/lib/finance'

jest.mock('@/lib/firebase', () => ({ db: {} }))
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'col-ref'),
  addDoc: jest.fn(),
}))
jest.mock('./transactions', () => ({
  addTransaction: jest.fn(),
}))

const mockAddTransaction = addTransaction as jest.Mock
const mockAddDoc = addDoc as jest.Mock

const BASE_INPUT = {
  userId: 'user-1',
  description: 'TV Samsung',
  totalAmount: 120000, // R$ 1.200,00
  installments: 3,
  purchaseDate: '2026-11-15',
  categoryId: 'cat-1',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAddTransaction.mockResolvedValue('tx-id')
  mockAddDoc.mockResolvedValue({ id: 'bill-id' })
})

describe('addCreditCardInstallments', () => {
  it('não cria nenhuma transação no mês da compra (saldo atual inalterado)', async () => {
    await addCreditCardInstallments(BASE_INPUT)

    const dates = mockAddTransaction.mock.calls.map((c) => c[0].date as string)
    const purchaseMonth = BASE_INPUT.purchaseDate.slice(0, 7) // '2026-11'
    expect(dates.every((d) => !d.startsWith(purchaseMonth))).toBe(true)
  })

  it('projeta a 1ª parcela para o mês seguinte ao da compra', async () => {
    await addCreditCardInstallments(BASE_INPUT)

    const firstDate: string = mockAddTransaction.mock.calls[0][0].date
    expect(firstDate).toMatch(/^2026-12/)
  })

  it('projeta a 2ª e 3ª parcelas nos meses subsequentes', async () => {
    await addCreditCardInstallments(BASE_INPUT)

    const dates = mockAddTransaction.mock.calls.map((c) => c[0].date as string)
    expect(dates[1]).toMatch(/^2027-01/)
    expect(dates[2]).toMatch(/^2027-02/)
  })

  it('cria exatamente N transações para N parcelas', async () => {
    await addCreditCardInstallments(BASE_INPUT)
    expect(mockAddTransaction).toHaveBeenCalledTimes(3)
  })

  it('calcula o valor correto de cada parcela (totalAmount / installments)', async () => {
    await addCreditCardInstallments(BASE_INPUT)

    const amounts = mockAddTransaction.mock.calls.map((c) => c[0].amount as number)
    amounts.forEach((a) => expect(a).toBe(40000)) // R$ 400,00
  })

  it('salva as parcelas com type "fixed" e paymentMethod "credit_card"', async () => {
    await addCreditCardInstallments(BASE_INPUT)

    mockAddTransaction.mock.calls.forEach((call) => {
      expect(call[0].type).toBe('fixed')
      expect(call[0].paymentMethod).toBe('credit_card')
    })
  })

  it('preenche installmentData corretamente em cada parcela', async () => {
    await addCreditCardInstallments(BASE_INPUT)

    const firstCall = mockAddTransaction.mock.calls[0][0]
    expect(firstCall.installmentData).toEqual({
      totalInstallments: 3,
      currentInstallment: 1,
      purchaseDescription: 'TV Samsung',
      totalAmount: 120000,
    })
  })

  it('cria um documento creditCardBill com os ids das transações', async () => {
    await addCreditCardInstallments(BASE_INPUT)

    expect(mockAddDoc).toHaveBeenCalledTimes(1)
    const [, billData] = mockAddDoc.mock.calls[0]
    expect(billData.purchaseDescription).toBe('TV Samsung')
    expect(billData.installments).toBe(3)
    expect(billData.installmentTransactionIds).toHaveLength(3)
  })

  it('subtrai a parcela projetada do saldo do mês seguinte', () => {
    // Verifica que a parcela (type: "fixed") entra em fixedExpenses e reduz o saldo
    const balance = calculateAvailableBalance({
      income: 300000,   // R$ 3.000,00
      extras: 0,
      savings: 0,
      fixedExpenses: 40000, // R$ 400,00 — parcela projetada
      variableExpenses: 0,
    })
    expect(balance).toBe(260000) // R$ 2.600,00
  })
})
