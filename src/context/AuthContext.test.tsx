import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from './AuthContext'
import { useAuth } from '@/hooks/useAuth'
import { onAuthStateChanged } from 'firebase/auth'
import * as authService from '@/services/auth'

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}))

// Mock firebase init
jest.mock('@/lib/firebase', () => ({ auth: {} }))

// Mock auth service
jest.mock('@/services/auth', () => ({
  signInWithGoogle: jest.fn(),
  signOutUser: jest.fn(),
}))

const mockOnAuthStateChanged = onAuthStateChanged as jest.Mock

// Helper: component that exposes context values via data-testid
function TestConsumer() {
  const { user, loading, signIn, signOut } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <button onClick={signIn}>Entrar</button>
      <button onClick={signOut}>Sair</button>
    </div>
  )
}

function setup(authUser: object | null = null) {
  mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
    callback(authUser)
    return jest.fn() // unsubscribe
  })
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  )
}

describe('AuthProvider', () => {
  it('should set loading to false after auth state resolves', async () => {
    await act(async () => setup(null))
    expect(screen.getByTestId('loading').textContent).toBe('false')
  })

  it('should expose user as null when not authenticated', async () => {
    await act(async () => setup(null))
    expect(screen.getByTestId('user').textContent).toBe('null')
  })

  it('should expose user email when authenticated', async () => {
    await act(async () => setup({ uid: 'u1', email: 'user@test.com' }))
    expect(screen.getByTestId('user').textContent).toBe('user@test.com')
  })

  it('should call signInWithGoogle when signIn is triggered', async () => {
    await act(async () => setup(null))
    await userEvent.click(screen.getByText('Entrar'))
    expect(authService.signInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('should call signOutUser when signOut is triggered', async () => {
    await act(async () => setup({ uid: 'u1', email: 'user@test.com' }))
    await userEvent.click(screen.getByText('Sair'))
    expect(authService.signOutUser).toHaveBeenCalledTimes(1)
  })

  it('should unsubscribe from onAuthStateChanged on unmount', async () => {
    const unsubscribe = jest.fn()
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      cb(null)
      return unsubscribe
    })
    const { unmount } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    await act(async () => unmount())
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
