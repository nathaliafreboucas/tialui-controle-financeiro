import { formatCurrency, toCents, fromCents, calculateAvailableBalance, getCategoryStatus } from './finance'

describe('formatCurrency', () => {
  it('should format 125050 centavos as R$ 1.250,50', () => {
    expect(formatCurrency(125050)).toBe('R$ 1.250,50')
  })

  it('should format 0 centavos as R$ 0,00', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })

  it('should format negative centavos', () => {
    expect(formatCurrency(-30000)).toBe('-R$ 300,00')
  })
})

describe('toCents', () => {
  it('should convert 1250.5 reais to 125050 centavos', () => {
    expect(toCents(1250.5)).toBe(125050)
  })

  it('should convert 0 to 0', () => {
    expect(toCents(0)).toBe(0)
  })

  it('should round floating point errors', () => {
    expect(toCents(0.1 + 0.2)).toBe(30) // 0.30000000000000004 → 30
  })
})

describe('fromCents', () => {
  it('should convert 125050 centavos to 1250.5 reais', () => {
    expect(fromCents(125050)).toBe(1250.5)
  })

  it('should convert 0 to 0', () => {
    expect(fromCents(0)).toBe(0)
  })
})

describe('calculateAvailableBalance', () => {
  it('should subtract savings and fixed expenses from income', () => {
    const result = calculateAvailableBalance({
      income: 500000,      // R$ 5.000,00
      extras: 0,
      savings: 50000,      // R$ 500,00
      fixedExpenses: 150000, // R$ 1.500,00
      variableExpenses: 30000, // R$ 300,00
    })
    expect(result).toBe(270000) // R$ 2.700,00
  })

  it('should add extras to income before calculating', () => {
    const result = calculateAvailableBalance({
      income: 500000,
      extras: 20000,
      savings: 50000,
      fixedExpenses: 150000,
      variableExpenses: 0,
    })
    expect(result).toBe(320000) // R$ 3.200,00
  })

  it('should return negative when expenses exceed income', () => {
    const result = calculateAvailableBalance({
      income: 100000,
      extras: 0,
      savings: 50000,
      fixedExpenses: 80000,
      variableExpenses: 0,
    })
    expect(result).toBe(-30000) // -R$ 300,00
  })
})

describe('getCategoryStatus', () => {
  it('should return "ok" when spent is below 80% of limit', () => {
    expect(getCategoryStatus(10000, 20000)).toBe('ok')
  })

  it('should return "warning" when spent reaches 80% of limit', () => {
    expect(getCategoryStatus(16000, 20000)).toBe('warning')
  })

  it('should return "warning" when spent is 180 and limit is 200', () => {
    expect(getCategoryStatus(18000, 20000)).toBe('warning')
  })

  it('should return "exceeded" when spent exceeds the limit', () => {
    expect(getCategoryStatus(20100, 20000)).toBe('exceeded')
  })

  it('should return "exceeded" when spent equals the limit', () => {
    expect(getCategoryStatus(20000, 20000)).toBe('exceeded')
  })
})
