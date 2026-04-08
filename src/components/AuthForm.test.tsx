import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthForm from './AuthForm'
import * as authService from '@/services/auth'

jest.mock('@/services/auth', () => ({
  signInWithGoogle: jest.fn(),
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
}))

const mockUser = { uid: 'u1', email: 'test@test.com' }

describe('AuthForm — modo Entrar (padrão)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should render email and password fields', () => {
    render(<AuthForm />)
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('should NOT show confirm password field in login mode', () => {
    render(<AuthForm />)
    expect(screen.queryByLabelText('Confirmar senha')).not.toBeInTheDocument()
  })

  it('should render Google sign-in button', () => {
    render(<AuthForm />)
    expect(screen.getByText(/continuar com google/i)).toBeInTheDocument()
  })

  it('should call signInWithEmail on submit', async () => {
    ;(authService.signInWithEmail as jest.Mock).mockResolvedValueOnce(mockUser)
    render(<AuthForm />)
    await userEvent.type(screen.getByLabelText('E-mail'), 'test@test.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha123')
    await userEvent.click(screen.getByRole('button', { name: /^entrar$/i }))
    await waitFor(() => {
      expect(authService.signInWithEmail).toHaveBeenCalledWith('test@test.com', 'senha123')
    })
  })

  it('should show error message when login fails', async () => {
    ;(authService.signInWithEmail as jest.Mock).mockRejectedValueOnce(
      new Error('auth/wrong-password')
    )
    render(<AuthForm />)
    await userEvent.type(screen.getByLabelText('E-mail'), 'test@test.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: /^entrar$/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})

describe('AuthForm — modo Criar conta', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should switch to signup mode when clicking "Criar conta"', async () => {
    render(<AuthForm />)
    await userEvent.click(screen.getByRole('tab', { name: /criar conta/i }))
    expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument()
  })

  it('should call signUpWithEmail on submit in signup mode', async () => {
    ;(authService.signUpWithEmail as jest.Mock).mockResolvedValueOnce(mockUser)
    render(<AuthForm />)
    await userEvent.click(screen.getByRole('tab', { name: /criar conta/i }))
    await userEvent.type(screen.getByLabelText('E-mail'), 'novo@test.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha123')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'senha123')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))
    await waitFor(() => {
      expect(authService.signUpWithEmail).toHaveBeenCalledWith('novo@test.com', 'senha123')
    })
  })

  it('should show error when passwords do not match', async () => {
    render(<AuthForm />)
    await userEvent.click(screen.getByRole('tab', { name: /criar conta/i }))
    await userEvent.type(screen.getByLabelText('E-mail'), 'novo@test.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha123')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'diferente')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument()
    })
  })

  it('should call signInWithGoogle when Google button is clicked', async () => {
    ;(authService.signInWithGoogle as jest.Mock).mockResolvedValueOnce(mockUser)
    render(<AuthForm />)
    await userEvent.click(screen.getByText(/continuar com google/i))
    expect(authService.signInWithGoogle).toHaveBeenCalledTimes(1)
  })
})
