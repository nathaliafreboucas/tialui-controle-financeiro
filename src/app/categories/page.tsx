'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { formatCurrency } from '@/lib/finance'
import { FiArrowLeft, FiLoader, FiPlus, FiEdit2, FiLogOut, FiSettings } from 'react-icons/fi'
import type { Category } from '@/types'
import AuthForm from '@/components/AuthForm'
import ThemeToggle from '@/components/ThemeToggle'
import CategoryModal from '@/components/CategoryModal'
import Image from 'next/image'
import logo from '../../../public/icon-512x512.png'
import SettingsModal from '@/components/SettingsModal'
import { useFinance } from '@/context/FinanceContext'

export default function CategoriesPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const userId = user?.uid ?? null
  const { categories, loading, add, update } = useCategories(userId)
  const { settings, saveSettings } = useFinance()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const userCategories = categories.filter((c) => c.userId !== 'system')

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setModalOpen(true)
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
          <div className="flex items-center gap-3">
            <Image src={logo} alt="" width={40} />
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
            Categorias
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
            {userCategories.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 text-center text-sm text-zinc-400">
                Nenhuma categoria criada ainda.
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                {userCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                        {cat.name}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {cat.limit && cat.limit > 0
                          ? `Limite: ${formatCurrency(cat.limit)}`
                          : 'Sem limite'}
                      </p>
                    </div>
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 text-zinc-300 hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0"
                      aria-label={`Editar ${cat.name}`}
                    >
                      <FiEdit2 className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={openAdd}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400 hover:border-zinc-500 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <FiPlus />
              Nova categoria
            </button>
          </>
        )}
      </main>

      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={add}
        onUpdate={update}
        userId={user.uid}
        editing={editing}
      />

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
