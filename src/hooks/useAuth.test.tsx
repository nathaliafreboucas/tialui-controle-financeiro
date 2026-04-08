import { render, screen } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { useAuth } from './useAuth'
import { AuthProvider } from '@/context/AuthContext'
import { onAuthStateChanged } from 'firebase/auth'

jest.mock('firebase/auth', () => ({ onAuthStateChanged: jest.fn() }))
jest.mock('@/lib/firebase', () => ({ auth: {} }))
jest.mock('@/services/auth', () => ({
  signInWithGoogle: jest.fn(),
  signOutUser: jest.fn(),
}))

const mockOnAuthStateChanged = onAuthStateChanged as jest.Mock

beforeEach(() => {
  mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
    cb(null)
    return jest.fn()
  })
})

describe('useAuth', () => {
  it('should return context values when inside AuthProvider', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })
    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('signIn')
    expect(result.current).toHaveProperty('signOut')
  })

  it('should throw when used outside AuthProvider', () => {
    // Suppress expected console.error from React
    jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth deve ser usado dentro de AuthProvider'
    )
    jest.restoreAllMocks()
  })
})
