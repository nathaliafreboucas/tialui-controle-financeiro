import { isActiveInCycle, toCycleKey } from './fixedExpenseService'
import type { FixedExpense } from '@/types'

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

function makeFixedExpense(activeFrom: string, activeUntil?: string): FixedExpense {
  return {
    id: 'fe-1',
    userId: 'u1',
    description: 'Aluguel',
    amount: 150000,
    categoryId: 'c1',
    activeFrom,
    activeUntil,
  }
}

describe('toCycleKey', () => {
  it('formats single-digit months with leading zero', () => {
    expect(toCycleKey(2026, 1)).toBe('2026-01')
    expect(toCycleKey(2026, 9)).toBe('2026-09')
    expect(toCycleKey(2026, 12)).toBe('2026-12')
  })
})

describe('isActiveInCycle', () => {
  it('is active when no activeUntil is set', () => {
    const fe = makeFixedExpense('2026-01')
    expect(isActiveInCycle(fe, '2026-01')).toBe(true)
    expect(isActiveInCycle(fe, '2026-06')).toBe(true)
    expect(isActiveInCycle(fe, '2030-12')).toBe(true)
  })

  it('is NOT active before activeFrom', () => {
    const fe = makeFixedExpense('2026-03')
    expect(isActiveInCycle(fe, '2026-01')).toBe(false)
    expect(isActiveInCycle(fe, '2026-02')).toBe(false)
  })

  it('IS active on the activeFrom month', () => {
    const fe = makeFixedExpense('2026-03')
    expect(isActiveInCycle(fe, '2026-03')).toBe(true)
  })

  it('IS active on the activeUntil month (inclusive)', () => {
    const fe = makeFixedExpense('2026-01', '2026-03')
    expect(isActiveInCycle(fe, '2026-03')).toBe(true)
  })

  it('is NOT active after activeUntil', () => {
    const fe = makeFixedExpense('2026-01', '2026-03')
    expect(isActiveInCycle(fe, '2026-04')).toBe(false)
    expect(isActiveInCycle(fe, '2027-01')).toBe(false)
  })

  /**
   * Regra de ouro: dado um gasto fixo ativo há 3 meses,
   * ao excluí-lo hoje (definindo activeUntil = mês anterior ao atual),
   * ele ainda deve aparecer no histórico de 2 meses atrás,
   * mas NÃO no próximo mês.
   */
  it('preserves history after deactivation (regra de ouro)', () => {
    // Gasto fixo criado 3 meses atrás, ainda sem activeUntil
    const activeFrom = '2026-01'
    const fe = makeFixedExpense(activeFrom)

    // Verificar que aparecia 2 meses atrás (estava ativo)
    expect(isActiveInCycle(fe, '2026-02')).toBe(true)

    // Simular "excluir hoje" (abril/2026): activeUntil = março/2026 (mês anterior)
    // O mês atual (abril) não vai mais aparecer, mas março e anteriores sim.
    const feDeactivated: FixedExpense = { ...fe, activeUntil: '2026-03' }

    // Histórico de 2 meses atrás ainda aparece
    expect(isActiveInCycle(feDeactivated, '2026-02')).toBe(true)

    // Próximo mês (maio) não aparece
    expect(isActiveInCycle(feDeactivated, '2026-05')).toBe(false)

    // Mês atual (abril) também não aparece (excluído a partir do mês atual)
    expect(isActiveInCycle(feDeactivated, '2026-04')).toBe(false)
  })
})
