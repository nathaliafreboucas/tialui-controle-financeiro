import { renderHook, waitFor, act } from '@testing-library/react'
import { useCategories } from './useCategories'
import * as catService from '@/services/categories'
import type { Category, NewCategory } from '@/types'

jest.mock('@/services/categories', () => ({
  getCategories: jest.fn(),
  addCategory: jest.fn(),
}))

const MOCK_CATEGORIES: Category[] = [
  { id: 's1', userId: 'system', name: 'Farmácia' },
  { id: 's2', userId: 'system', name: 'Lazer' },
  { id: 'u1', userId: 'user1', name: 'Pet Shop', limit: 150 },
]

describe('useCategories', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should start with loading=true and empty categories', () => {
    ;(catService.getCategories as jest.Mock).mockResolvedValue([])
    const { result } = renderHook(() => useCategories('user1'))
    expect(result.current.loading).toBe(true)
    expect(result.current.categories).toEqual([])
  })

  it('should fetch categories on mount and set loading=false', async () => {
    ;(catService.getCategories as jest.Mock).mockResolvedValueOnce(MOCK_CATEGORIES)
    const { result } = renderHook(() => useCategories('user1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.categories).toEqual(MOCK_CATEGORIES)
    expect(catService.getCategories).toHaveBeenCalledWith('user1')
  })

  it('should NOT fetch when userId is null', () => {
    const { result } = renderHook(() => useCategories(null))
    expect(catService.getCategories).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('should set error when fetch fails', async () => {
    ;(catService.getCategories as jest.Mock).mockRejectedValueOnce(new Error('client is offline'))
    const { result } = renderHook(() => useCategories('user1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toMatch(/offline/i)
    expect(result.current.categories).toEqual([])
  })

  it('add() should call service and append category to state', async () => {
    ;(catService.getCategories as jest.Mock).mockResolvedValueOnce(MOCK_CATEGORIES)
    ;(catService.addCategory as jest.Mock).mockResolvedValueOnce('u2')
    const { result } = renderHook(() => useCategories('user1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const newCat: NewCategory = { userId: 'user1', name: 'Academia', limit: 100 }
    await act(async () => { await result.current.add(newCat) })

    expect(catService.addCategory).toHaveBeenCalledWith(newCat)
    expect(result.current.categories).toHaveLength(4)
    expect(result.current.categories.at(-1)).toMatchObject({ id: 'u2', ...newCat })
  })
})
