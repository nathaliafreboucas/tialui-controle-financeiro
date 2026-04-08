export interface UserSettings {
  userId: string
  monthlyIncome: number
  billingCycleDay: number
  savingsGoal: number
}

export interface Category {
  id: string
  userId: string // 'system' para categorias padrão
  name: string
  limit?: number
  icon?: string
}

export interface Transaction {
  id: string
  userId: string
  description: string
  amount: number
  date: string // ISO: 'YYYY-MM-DD'
  type: 'fixed' | 'variable' | 'extra'
  categoryId: string // vazio ('') quando type === 'extra'
  isThirdParty?: boolean
}

export type NewTransaction = Omit<Transaction, 'id'>
export type NewCategory = Omit<Category, 'id'>

export interface InvoiceItem {
  transactionId: string
  description: string
  amount: number
  date: string
  type: 'fixed' | 'variable' | 'extra'
  categoryId: string
}

export type InvoiceStatus = 'pending' | 'viewed' | 'imported' | 'ignored_by_receiver'

export interface Invoice {
  id: string
  creatorId: string
  items: InvoiceItem[]
  status: InvoiceStatus
  createdAt: string
}

export type NewInvoice = Omit<Invoice, 'id'>
