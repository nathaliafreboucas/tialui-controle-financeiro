import { renderHook, waitFor, act } from '@testing-library/react'
import { useSettings } from './useSettings'
import * as settingsService from '@/services/settings'
import type { UserSettings } from '@/types'

jest.mock('@/services/settings', () => ({
  getSettings: jest.fn(),
  saveSettings: jest.fn(),
}))

const MOCK_SETTINGS: UserSettings = {
  userId: 'u1',
  monthlyIncome: 5000,
  billingCycleDay: 1,
  savingsGoal: 500,
}

describe('useSettings', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should start with loading=true and settings=null', () => {
    ;(settingsService.getSettings as jest.Mock).mockResolvedValue(MOCK_SETTINGS)
    const { result } = renderHook(() => useSettings('u1'))
    expect(result.current.loading).toBe(true)
    expect(result.current.settings).toBeNull()
  })

  it('should fetch settings on mount and set loading=false', async () => {
    ;(settingsService.getSettings as jest.Mock).mockResolvedValueOnce(MOCK_SETTINGS)
    const { result } = renderHook(() => useSettings('u1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.settings).toEqual(MOCK_SETTINGS)
    expect(settingsService.getSettings).toHaveBeenCalledWith('u1')
  })

  it('should return null settings when no document exists', async () => {
    ;(settingsService.getSettings as jest.Mock).mockResolvedValueOnce(null)
    const { result } = renderHook(() => useSettings('u1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.settings).toBeNull()
  })

  it('should NOT fetch when userId is null', () => {
    const { result } = renderHook(() => useSettings(null))
    expect(settingsService.getSettings).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('should set error when fetch fails', async () => {
    ;(settingsService.getSettings as jest.Mock).mockRejectedValueOnce(new Error('client is offline'))
    const { result } = renderHook(() => useSettings('u1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toMatch(/offline/i)
    expect(result.current.settings).toBeNull()
  })

  it('save() should call saveSettings and update local state', async () => {
    ;(settingsService.getSettings as jest.Mock).mockResolvedValueOnce(null)
    ;(settingsService.saveSettings as jest.Mock).mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useSettings('u1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.save(MOCK_SETTINGS) })

    expect(settingsService.saveSettings).toHaveBeenCalledWith(MOCK_SETTINGS)
    expect(result.current.settings).toEqual(MOCK_SETTINGS)
  })
})
