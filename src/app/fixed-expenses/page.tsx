'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFixedExpenses } from '@/hooks/useFixedExpenses'
import { useCategories } from '@/hooks/useCategories'
import { toCycleKey } from '@/services/fixedExpenseService'
import { formatCurrency } from '@/lib/finance'
import { FiArrowLeft, FiLoader, FiPlus, FiTrash2, FiEdit2, FiLogOut, FiSettings } from 'react-icons/fi'
import CurrencyField from '@/components/CurrencyField'
import type { FixedExpense } from '@/types'
import AuthForm from '@/components/AuthForm'
import ThemeToggle from '@/components/ThemeToggle'
import Image from 'next/image'
import logo from '../../../public/icon-512x512.png' 
import SettingsModal from '@/components/SettingsModal'
import { useFinance } from '@/context/FinanceContext'



function currentCycleKey(): string {
  const now = new Date()
  return toCycleKey(now.getFullYear(), now.getMonth() + 1)
}

function previousCycleKey(): string {
  const now = new Date()
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return toCycleKey(prev.getFullYear(), prev.getMonth() + 1)
}

export default function FixedExpensesPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const userId = user?.uid ?? null
  const { fixedExpenses, loading, add, deactivate } = useFixedExpenses(userId)
  const { categories } = useCategories(userId)
  const {settings, saveSettings} = useFinance()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Form state
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [categoryId, setCategoryId] = useState('')
  const [saving, setSaving] = useState(false)

  const activeExpenses = fixedExpenses.filter(
    (fe) => !fe.activeUntil || fe.activeUntil >= currentCycleKey()
  )

  function openAddForm() {
    setEditingId(null)
    setDescription('')
    setAmount(0)
    setCategoryId(categories[0]?.id ?? '')
    setShowForm(true)
  }

  function openEditForm(fe: FixedExpense) {
    setEditingId(fe.id)
    setDescription(fe.description)
    setAmount(fe.amount)
    setCategoryId(fe.categoryId)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
  }

  async function handleSave() {
    if (!userId || amount === 0 || !description.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        // Preserve history: deactivate old record up to last month, create new from current month
        await deactivate(editingId, previousCycleKey())
        await add({ userId, description, amount, categoryId, activeFrom: currentCycleKey() })
      } else {
        await add({
          userId,
          description,
          amount,
          categoryId,
          activeFrom: currentCycleKey(),
        })
      }
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    // Keep it active through the previous cycle so current month history is preserved.
    // From the current cycle forward it won't appear.
    await deactivate(id, previousCycleKey())
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FiLoader className="animate-spin text-4xl text-zinc-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <AuthForm />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className='flex items-center gap-3'>
            <Image
              src={logo} alt={''}
              width={40}
            />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Tialúi
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              aria-label="Configurações"
            >
              <FiSettings className="text-lg" />
            </button>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block truncate max-w-[140px]">
              {user.displayName ?? user.email}
            </span>
            <button
              onClick={signOut}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              aria-label="Sair"
            >
              <FiLogOut className="text-lg" />
            </button>
          </div>
        </div>
      </header>
      <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <a
            href="/"
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            aria-label="Voltar"
          >
            <FiArrowLeft className="text-lg" />
          </a>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Gastos Fixos Recorrentes
          </h1>
        </div>
      </div>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="animate-spin text-2xl text-zinc-400" />
          </div>
        ) : (
          <>
            {activeExpenses.length === 0 && !showForm && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 text-center text-sm text-zinc-400">
                Nenhum gasto fixo recorrente cadastrado.
              </div>
            )}

            {activeExpenses.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                {activeExpenses.map((fe) => (
                  <div key={fe.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                        {fe.description}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {categories.find((c) => c.id === fe.categoryId)?.name ?? '—'}
                        {' · '}ativo desde{' '}
                        {fe.activeFrom.replace('-', '/')}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 shrink-0">
                      {formatCurrency(fe.amount)}
                    </span>
                    <button
                      onClick={() => openEditForm(fe)}
                      className="p-1.5 text-zinc-300 hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0"
                      aria-label={`Editar ${fe.description}`}
                    >
                      <FiEdit2 className="text-sm" />
                    </button>
                    <button
                      onClick={() => handleDelete(fe.id)}
                      className="p-1.5 text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors shrink-0"
                      aria-label={`Excluir ${fe.description}`}
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showForm && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {editingId ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}
                </h2>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fe-description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Descrição
                  </label>
                  <input
                    id="fe-description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition text-sm"
                  />
                </div>

                <CurrencyField
                  id="fe-amount"
                  label="Valor"
                  valueCents={amount}
                  onChange={setAmount}
                />

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fe-category" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Categoria
                  </label>
                  <select
                    id="fe-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition text-sm"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || amount === 0 || !description.trim()}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                  >
                    {saving ? <FiLoader className="animate-spin" /> : 'Salvar'}
                  </button>
                </div>
              </div>
            )}

            {!showForm && (
              <button
                type="button"
                onClick={openAddForm}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400 hover:border-zinc-500 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                <FiPlus />
                Adicionar gasto fixo recorrente
              </button>
            )}
          </>
        )}
      </main>
      <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onSave={saveSettings}
            userId={user.uid}
            initialSettings={settings}
          />
    </div>
  )
}
