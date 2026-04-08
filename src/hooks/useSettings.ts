import { useEffect, useState } from 'react'
import { getSettings, saveSettings as svcSave } from '@/services/settings'
import type { UserSettings } from '@/types'

export function useSettings(userId: string | null) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    getSettings(userId)
      .then(setSettings)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

  async function save(data: UserSettings): Promise<void> {
    await svcSave(data)
    setSettings(data)
  }

  return { settings, loading, error, save }
}
