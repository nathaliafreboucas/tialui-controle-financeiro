import {
  createInvoice,
  getInvoice,
  importInvoiceItems,
  deleteInvoiceItem,
  ignoreInvoice,
} from './billingService'
import { addDoc, getDoc, updateDoc, doc, arrayRemove } from 'firebase/firestore'
import { addTransaction } from './transactions'
import type { Invoice, InvoiceItem } from '@/types'

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'col-ref'),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(() => 'doc-ref'),
  arrayRemove: jest.fn((item) => ({ __arrayRemove: item })),
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

jest.mock('./transactions', () => ({
  addTransaction: jest.fn(),
}))

const mockAddDoc = addDoc as jest.Mock
const mockGetDoc = getDoc as jest.Mock
const mockUpdateDoc = updateDoc as jest.Mock
const mockAddTransaction = addTransaction as jest.Mock

const ITEMS: InvoiceItem[] = [
  {
    transactionId: 'tx-1',
    description: 'Farmácia',
    amount: 3500,
    date: '2026-04-01',
    type: 'variable',
    categoryId: 'cat-saude',
  },
  {
    transactionId: 'tx-2',
    description: 'Supermercado',
    amount: 12000,
    date: '2026-04-03',
    type: 'variable',
    categoryId: 'cat-alimentacao',
  },
  {
    transactionId: 'tx-3',
    description: 'Academia',
    amount: 9000,
    date: '2026-04-05',
    type: 'fixed',
    categoryId: 'cat-saude',
  },
]

const MOCK_INVOICE: Invoice = {
  id: 'inv-abc',
  creatorId: 'user-a',
  items: ITEMS,
  status: 'pending',
  createdAt: '2026-04-08',
}

beforeEach(() => jest.clearAllMocks())

// ---------------------------------------------------------------------------
// createInvoice
// ---------------------------------------------------------------------------
describe('createInvoice', () => {
  it('should call addDoc and return the new invoice id', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'inv-new' })
    const id = await createInvoice('user-a', ITEMS)
    expect(mockAddDoc).toHaveBeenCalledTimes(1)
    expect(id).toBe('inv-new')
  })

  it('should persist status as "pending" and include creatorId and items', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'inv-new' })
    await createInvoice('user-a', ITEMS)
    const [, data] = mockAddDoc.mock.calls[0]
    expect(data).toMatchObject({
      creatorId: 'user-a',
      status: 'pending',
      items: ITEMS,
    })
  })
})

// ---------------------------------------------------------------------------
// getInvoice
// ---------------------------------------------------------------------------
describe('getInvoice', () => {
  it('should return the invoice when it exists', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'inv-abc',
      data: () => ({
        creatorId: 'user-a',
        items: ITEMS,
        status: 'pending',
        createdAt: '2026-04-08',
      }),
    })
    const invoice = await getInvoice('inv-abc')
    expect(invoice).not.toBeNull()
    expect(invoice?.id).toBe('inv-abc')
    expect(invoice?.items).toHaveLength(3)
  })

  it('should return null when invoice does not exist', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false })
    const invoice = await getInvoice('inv-ghost')
    expect(invoice).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// importInvoiceItems — critical TDD cases
// ---------------------------------------------------------------------------
describe('importInvoiceItems', () => {
  it('se o usuário selecionar 2 de 3 itens, apenas 2 novas transações são criadas', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'inv-abc',
      data: () => ({ ...MOCK_INVOICE, id: undefined }),
    })
    mockUpdateDoc.mockResolvedValueOnce(undefined)
    mockAddTransaction.mockResolvedValue('new-tx-id')

    await importInvoiceItems('user-b', 'inv-abc', ['tx-1', 'tx-2'])

    expect(mockAddTransaction).toHaveBeenCalledTimes(2)
  })

  it('deve criar transações apenas para os itens selecionados (não todos)', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'inv-abc',
      data: () => ({ ...MOCK_INVOICE, id: undefined }),
    })
    mockUpdateDoc.mockResolvedValueOnce(undefined)
    mockAddTransaction.mockResolvedValue('new-tx-id')

    await importInvoiceItems('user-b', 'inv-abc', ['tx-3'])

    expect(mockAddTransaction).toHaveBeenCalledTimes(1)
    const [calledWith] = mockAddTransaction.mock.calls[0]
    expect(calledWith.description).toBe('Academia')
  })

  it('deve criar as transações com o userId do receptor, não do criador', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'inv-abc',
      data: () => ({ ...MOCK_INVOICE, id: undefined }),
    })
    mockUpdateDoc.mockResolvedValueOnce(undefined)
    mockAddTransaction.mockResolvedValue('new-tx-id')

    await importInvoiceItems('user-b', 'inv-abc', ['tx-1'])

    const [tx] = mockAddTransaction.mock.calls[0]
    expect(tx.userId).toBe('user-b')
  })

  it('saldo do receptor é recalculado: ao importar 2 itens, 2 transações são adicionadas ao banco', async () => {
    // Validates that exactly N calls to addTransaction happen,
    // which are the source of the balance recomputation in FinanceContext.
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'inv-abc',
      data: () => ({ ...MOCK_INVOICE, id: undefined }),
    })
    mockUpdateDoc.mockResolvedValueOnce(undefined)
    mockAddTransaction
      .mockResolvedValueOnce('new-tx-1')
      .mockResolvedValueOnce('new-tx-2')

    await importInvoiceItems('user-b', 'inv-abc', ['tx-1', 'tx-2'])

    // Each addTransaction call is one new debit that affects the balance
    expect(mockAddTransaction).toHaveBeenCalledTimes(2)
    const amounts = mockAddTransaction.mock.calls.map(([tx]) => tx.amount)
    expect(amounts).toContain(3500)  // Farmácia
    expect(amounts).toContain(12000) // Supermercado
  })

  it('deve atualizar o status da invoice para "imported" após importar', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'inv-abc',
      data: () => ({ ...MOCK_INVOICE, id: undefined }),
    })
    mockUpdateDoc.mockResolvedValueOnce(undefined)
    mockAddTransaction.mockResolvedValue('new-tx-id')

    await importInvoiceItems('user-b', 'inv-abc', ['tx-1'])

    expect(mockUpdateDoc).toHaveBeenCalledWith('doc-ref', { status: 'imported' })
  })

  it('deve lançar erro se a invoice não existir', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false })
    await expect(
      importInvoiceItems('user-b', 'inv-ghost', ['tx-1'])
    ).rejects.toThrow('Invoice not found')
  })
})

// ---------------------------------------------------------------------------
// deleteInvoiceItem
// ---------------------------------------------------------------------------
describe('deleteInvoiceItem', () => {
  it('deve remover o item correto da invoice via arrayRemove', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'inv-abc',
      data: () => ({ ...MOCK_INVOICE, id: undefined }),
    })
    mockUpdateDoc.mockResolvedValueOnce(undefined)

    await deleteInvoiceItem('inv-abc', 'tx-2')

    expect(mockUpdateDoc).toHaveBeenCalledWith('doc-ref', {
      items: arrayRemove(ITEMS[1]),
    })
  })

  it('não deve chamar updateDoc se o item não existir na invoice', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'inv-abc',
      data: () => ({ ...MOCK_INVOICE, id: undefined }),
    })

    await deleteInvoiceItem('inv-abc', 'tx-nao-existe')

    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// ignoreInvoice
// ---------------------------------------------------------------------------
describe('ignoreInvoice', () => {
  it('deve atualizar o status para "ignored_by_receiver"', async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined)

    await ignoreInvoice('inv-abc')

    expect(mockUpdateDoc).toHaveBeenCalledWith('doc-ref', {
      status: 'ignored_by_receiver',
    })
  })
})
