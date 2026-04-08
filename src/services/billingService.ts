import {
  collection,
  addDoc,
  getDoc,
  updateDoc,
  doc,
  arrayRemove,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { addTransaction } from './transactions'
import type { Invoice, InvoiceItem, NewInvoice, NewTransaction } from '@/types'

const COL = 'invoices'

export async function createInvoice(
  creatorId: string,
  items: InvoiceItem[]
): Promise<string> {
  const data: NewInvoice = {
    creatorId,
    items,
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0],
  }
  const ref = await addDoc(collection(db, COL), data)
  return ref.id
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const snap = await getDoc(doc(db, COL, invoiceId))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Invoice, 'id'>) }
}

export async function importInvoiceItems(
  userId: string,
  invoiceId: string,
  selectedItemIds: string[]
): Promise<void> {
  const invoice = await getInvoice(invoiceId)
  if (!invoice) throw new Error('Invoice not found')

  const itemsToImport = invoice.items.filter((item) =>
    selectedItemIds.includes(item.transactionId)
  )

  await Promise.all(
    itemsToImport.map((item) => {
      const tx: NewTransaction = {
        userId,
        description: item.description,
        amount: item.amount,
        date: item.date,
        type: item.type,
        categoryId: item.categoryId,
      }
      return addTransaction(tx)
    })
  )

  await updateDoc(doc(db, COL, invoiceId), { status: 'imported' })
}

export async function deleteInvoiceItem(
  invoiceId: string,
  transactionId: string
): Promise<void> {
  const invoice = await getInvoice(invoiceId)
  if (!invoice) throw new Error('Invoice not found')
  const item = invoice.items.find((i) => i.transactionId === transactionId)
  if (!item) return
  await updateDoc(doc(db, COL, invoiceId), { items: arrayRemove(item) })
}

export async function ignoreInvoice(invoiceId: string): Promise<void> {
  await updateDoc(doc(db, COL, invoiceId), { status: 'ignored_by_receiver' })
}
