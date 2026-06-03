import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { addTransaction } from './transactions'
import type { CreditCardPurchaseInput, NewCreditCardBill } from '@/types'

/**
 * Shifts a date forward by N months, capping the day at 28 to avoid
 * month-end issues (e.g. Jan 31 + 1 month → Feb 28, not Mar 3).
 */
function addMonthsToDate(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const safeDay = Math.min(day, 28)
  const d = new Date(year, month - 1 + months, safeDay)
  return d.toISOString().split('T')[0]
}

/**
 * Creates credit card installment transactions and records the purchase in
 * the creditCardBills collection.
 *
 * When billClosed=true the fatura already closed, so the first installment
 * lands on month+1. When billClosed=false the fatura is still open, so the
 * first installment lands on the current month (month+0).
 */
export async function addCreditCardInstallments(
  data: CreditCardPurchaseInput
): Promise<string> {
  const installmentAmount = Math.round(data.totalAmount / data.installments)
  const transactionIds: string[] = []
  const startOffset = data.billClosed ? 1 : 0

  for (let i = 0; i < data.installments; i++) {
    const installmentNumber = i + 1
    const dueDate = addMonthsToDate(data.purchaseDate, startOffset + i)
    const txId = await addTransaction({
      userId: data.userId,
      description: `${data.description} (${installmentNumber}/${data.installments})`,
      amount: installmentAmount,
      date: dueDate,
      type: data.type,
      categoryId: data.categoryId,
      paymentMethod: 'credit_card',
      installmentData: {
        totalInstallments: data.installments,
        currentInstallment: installmentNumber,
        purchaseDescription: data.description,
        totalAmount: data.totalAmount,
      },
    })
    transactionIds.push(txId)
  }

  const billRef = await addDoc(collection(db, 'creditCardBills'), {
    userId: data.userId,
    purchaseDescription: data.description,
    totalAmount: data.totalAmount,
    installments: data.installments,
    purchaseDate: data.purchaseDate,
    installmentTransactionIds: transactionIds,
  } as NewCreditCardBill)

  return billRef.id
}
