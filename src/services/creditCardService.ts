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
 * Creates credit card installment transactions for future months and records
 * the purchase in the creditCardBills collection.
 *
 * The current month is intentionally skipped — the first installment lands
 * on month+1, keeping the current cycle's balance unchanged.
 */
export async function addCreditCardInstallments(
  data: CreditCardPurchaseInput
): Promise<string> {
  const installmentAmount = Math.round(data.totalAmount / data.installments)
  const transactionIds: string[] = []

  for (let i = 1; i <= data.installments; i++) {
    const dueDate = addMonthsToDate(data.purchaseDate, i)
    const txId = await addTransaction({
      userId: data.userId,
      description: `${data.description} (${i}/${data.installments})`,
      amount: installmentAmount,
      date: dueDate,
      type: 'fixed',
      categoryId: data.categoryId,
      paymentMethod: 'credit_card',
      installmentData: {
        totalInstallments: data.installments,
        currentInstallment: i,
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
