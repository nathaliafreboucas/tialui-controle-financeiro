'use client'

import type { Category } from '@/types'

export interface FilterState {
  categoryId: string
  paymentMethod: '' | 'debit' | 'credit_card'
  type: '' | 'fixed' | 'variable' | 'extra'
  thirdPartyOnly: boolean
}

export const EMPTY_FILTERS: FilterState = {
  categoryId: '',
  paymentMethod: '',
  type: '',
  thirdPartyOnly: false,
}

interface Props {
  filters: FilterState
  onChange: (filters: FilterState) => void
  categories: Category[]
}

const selectClass =
  'px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition'

export default function TransactionFilters({ filters, onChange, categories }: Props) {
  function set(patch: Partial<FilterState>) {
    onChange({ ...filters, ...patch })
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros de transações">
      <select
        aria-label="Filtrar por categoria"
        value={filters.categoryId}
        onChange={(e) => set({ categoryId: e.target.value })}
        className={selectClass}
      >
        <option value="">Todas as categorias</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por forma de pagamento"
        value={filters.paymentMethod}
        onChange={(e) => set({ paymentMethod: e.target.value as FilterState['paymentMethod'] })}
        className={selectClass}
      >
        <option value="">Todas as formas</option>
        <option value="debit">Dinheiro / Débito</option>
        <option value="credit_card">Cartão de Crédito</option>
      </select>

      <select
        aria-label="Filtrar por tipo"
        value={filters.type}
        onChange={(e) => set({ type: e.target.value as FilterState['type'] })}
        className={selectClass}
      >
        <option value="">Todos os tipos</option>
        <option value="fixed">Fixo</option>
        <option value="variable">Variável</option>
        <option value="extra">Entrada</option>
      </select>

      <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          aria-label="Apenas gastos de terceiros"
          checked={filters.thirdPartyOnly}
          onChange={(e) => set({ thirdPartyOnly: e.target.checked })}
          className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-600 accent-zinc-900 dark:accent-zinc-50"
        />
        Apenas terceiros
      </label>
    </div>
  )
}
