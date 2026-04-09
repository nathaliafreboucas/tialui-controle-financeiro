import { addTransaction } from './transactions'
import type { ExtraIncomeInput } from '@/types'

export async function addExtraIncome(data: ExtraIncomeInput): Promise<string> {
  return addTransaction({
    userId: data.userId,
    description: data.description,
    amount: data.amount,
    date: data.date,
    type: 'extra',
    categoryId: '',
  })
}
