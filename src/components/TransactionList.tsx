import { FiTrash2 } from 'react-icons/fi'
import { IoCheckboxOutline, IoSquareOutline } from 'react-icons/io5'
import { formatCurrency } from '@/lib/finance'
import type { Transaction, Category } from '@/types'

interface Props {
  transactions: Transaction[]
  categories: Category[]
  onDelete: (id: string) => Promise<void>
  selectionMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
}

function getCategoryName(categories: Category[], id: string): string {
  return categories.find((c) => c.id === id)?.name ?? '—'
}

function groupByDate(transactions: Transaction[]): [string, Transaction[]][] {
  const map: Record<string, Transaction[]> = {}
  for (const t of transactions) {
    ;(map[t.date] ??= []).push(t)
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default function TransactionList({
  transactions,
  categories,
  onDelete,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: Props) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 text-center text-sm text-zinc-400">
        Nenhum gasto registrado ainda.
      </div>
    )
  }

  const groups = groupByDate(transactions)

  return (
    <div className="flex flex-col gap-4">
      {groups.map(([date, txs]) => (
        <div key={date}>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2 capitalize">
            {formatDate(date)}
          </p>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
            {txs.map((t) => {
              const isSelectable = selectionMode && t.isThirdParty && t.type !== 'extra'
              const isSelected = isSelectable && selectedIds?.has(t.id)

              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isSelectable ? 'cursor-pointer' : ''
                  } ${isSelected ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}`}
                  onClick={isSelectable ? () => onToggleSelect?.(t.id) : undefined}
                >
                  {selectionMode && (
                    <span className="shrink-0 text-lg text-zinc-400 dark:text-zinc-500">
                      {isSelectable ? (
                        isSelected ? (
                          <IoCheckboxOutline className="text-zinc-900 dark:text-zinc-50" />
                        ) : (
                          <IoSquareOutline />
                        )
                      ) : (
                        <IoSquareOutline className="opacity-20" />
                      )}
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                      {t.description}
                      {t.isThirdParty && (
                        <span className="ml-1.5 text-xs font-normal text-purple-500 dark:text-purple-400">
                          terceiros
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                      {t.type === 'extra' ? (
                        <span className="text-green-500">renda extra</span>
                      ) : (
                        <>
                          {getCategoryName(categories, t.categoryId)}
                          {' · '}
                          <span className={t.type === 'fixed' ? 'text-blue-500' : 'text-orange-500'}>
                            {t.type === 'fixed' ? 'fixo' : 'variável'}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <span className={`text-sm font-semibold shrink-0 ${t.type === 'extra' ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
                    {t.type === 'extra' ? '+' : ''}{formatCurrency(t.amount)}
                  </span>

                  {!selectionMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(t.id) }}
                      className="p-1.5 text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors shrink-0"
                      aria-label="Excluir transação"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
