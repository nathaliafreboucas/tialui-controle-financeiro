import { signInWithGoogle, signOutUser, signInWithEmail, signUpWithEmail } from './auth'
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'

jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ auth: {} }))

const mockSignInWithPopup = signInWithPopup as jest.Mock
const mockSignOut = signOut as jest.Mock
const mockSignInWithEmail = signInWithEmailAndPassword as jest.Mock
const mockCreateUser = createUserWithEmailAndPassword as jest.Mock

describe('signInWithGoogle', () => {
  it('should call signInWithPopup with a GoogleAuthProvider', async () => {
    mockSignInWithPopup.mockResolvedValueOnce({
      user: { uid: 'abc123', email: 'user@test.com', displayName: 'User' },
    })
    await signInWithGoogle()
    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1)
    expect(GoogleAuthProvider).toHaveBeenCalledTimes(1)
  })

  it('should return the user from the credential', async () => {
    const mockUser = { uid: 'abc123', email: 'user@test.com', displayName: 'User' }
    mockSignInWithPopup.mockResolvedValueOnce({ user: mockUser })
    const user = await signInWithGoogle()
    expect(user).toEqual(mockUser)
  })

  it('should throw when signInWithPopup fails', async () => {
    mockSignInWithPopup.mockRejectedValueOnce(new Error('popup-closed'))
    await expect(signInWithGoogle()).rejects.toThrow('popup-closed')
  })
})

describe('signOutUser', () => {
  it('should call firebase signOut', async () => {
    mockSignOut.mockResolvedValueOnce(undefined)
    await signOutUser()
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})

describe('signInWithEmail', () => {
  it('should call signInWithEmailAndPassword with correct credentials', async () => {
    const mockUser = { uid: 'u1', email: 'a@b.com' }
    mockSignInWithEmail.mockResolvedValueOnce({ user: mockUser })
    const user = await signInWithEmail('a@b.com', 'senha123')
    expect(mockSignInWithEmail).toHaveBeenCalledWith({}, 'a@b.com', 'senha123')
    expect(user).toEqual(mockUser)
  })

  it('should throw when credentials are wrong', async () => {
    mockSignInWithEmail.mockRejectedValueOnce(new Error('auth/wrong-password'))
    await expect(signInWithEmail('a@b.com', 'errada')).rejects.toThrow('auth/wrong-password')
  })
})

describe('signUpWithEmail', () => {
  it('should call createUserWithEmailAndPassword with correct data', async () => {
    const mockUser = { uid: 'u2', email: 'novo@b.com' }
    mockCreateUser.mockResolvedValueOnce({ user: mockUser })
    const user = await signUpWithEmail('novo@b.com', 'senha123')
    expect(mockCreateUser).toHaveBeenCalledWith({}, 'novo@b.com', 'senha123')
    expect(user).toEqual(mockUser)
  })

  it('should throw when email is already in use', async () => {
    mockCreateUser.mockRejectedValueOnce(new Error('auth/email-already-in-use'))
    await expect(signUpWithEmail('existe@b.com', 'senha')).rejects.toThrow(
      'auth/email-already-in-use'
    )
  })
})
