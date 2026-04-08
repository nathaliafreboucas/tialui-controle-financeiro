import { getSettings, saveSettings } from './settings'
import { getDoc, setDoc, doc } from 'firebase/firestore'

jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  doc: jest.fn(() => 'doc-ref'),
  getFirestore: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

const mockGetDoc = getDoc as jest.Mock
const mockSetDoc = setDoc as jest.Mock

const MOCK_SETTINGS = {
  userId: 'u1',
  monthlyIncome: 5000,
  billingCycleDay: 1,
  savingsGoal: 500,
}

describe('getSettings', () => {
  it('should call getDoc with the correct path', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => MOCK_SETTINGS })
    await getSettings('u1')
    expect(doc).toHaveBeenCalledWith({}, 'settings', 'u1')
    expect(mockGetDoc).toHaveBeenCalledWith('doc-ref')
  })

  it('should return settings data when document exists', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => MOCK_SETTINGS })
    const result = await getSettings('u1')
    expect(result).toEqual(MOCK_SETTINGS)
  })

  it('should return null when document does not exist', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false })
    const result = await getSettings('u1')
    expect(result).toBeNull()
  })
})

describe('saveSettings', () => {
  it('should call setDoc with correct path and data', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined)
    await saveSettings(MOCK_SETTINGS)
    expect(doc).toHaveBeenCalledWith({}, 'settings', 'u1')
    expect(mockSetDoc).toHaveBeenCalledWith('doc-ref', MOCK_SETTINGS, { merge: true })
  })
})
