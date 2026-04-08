'use client'

import { useTheme } from 'next-themes'
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi'

const OPTIONS = [
  { value: 'light', icon: <FiSun />, label: 'Claro' },
  { value: 'dark', icon: <FiMoon />, label: 'Escuro' },
  { value: 'system', icon: <FiMonitor />, label: 'Sistema' },
] as const

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
      {OPTIONS.map(({ value, icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          title={label}
          className={`p-1.5 rounded-md text-sm transition-colors ${
            theme === value
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
