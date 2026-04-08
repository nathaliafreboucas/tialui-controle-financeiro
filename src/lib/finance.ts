/** Converte centavos para reais e formata como BRL. Ex: 125050 → "R$ 1.250,50" */
export function formatCurrency(cents: number): string {
  return (cents / 100)
    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    .replace(/\u00a0/g, ' ')   // non-breaking space → regular space
    .replace(/\u2212/g, '-')   // unicode minus → hyphen-minus
}

/** Converte reais (float) para centavos (inteiro). Ex: 1250.5 → 125050 */
export function toCents(reais: number): number {
  return Math.round(reais * 100)
}

/** Converte centavos (inteiro) para reais (float). Ex: 125050 → 1250.5 */
export function fromCents(cents: number): number {
  return cents / 100
}

interface BalanceParams {
  income: number
  extras: number
  savings: number
  fixedExpenses: number
  variableExpenses: number
}

export function calculateAvailableBalance({
  income,
  extras,
  savings,
  fixedExpenses,
  variableExpenses,
}: BalanceParams): number {
  return income + extras - savings - fixedExpenses - variableExpenses
}

export type CategoryStatus = 'ok' | 'warning' | 'exceeded'

const WARNING_THRESHOLD = 0.8

export function getCategoryStatus(spent: number, limit: number): CategoryStatus {
  if (spent >= limit) return 'exceeded'
  if (spent / limit >= WARNING_THRESHOLD) return 'warning'
  return 'ok'
}
