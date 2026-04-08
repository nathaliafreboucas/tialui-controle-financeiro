import { render, screen } from '@testing-library/react'
import CategoryAlert from './CategoryAlert'

describe('CategoryAlert', () => {
  it('should NOT render when status is ok', () => {
    const { container } = render(<CategoryAlert status="ok" categoryName="Lazer" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should render a warning message when status is warning', () => {
    render(<CategoryAlert status="warning" categoryName="Farmácia" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/Farmácia/)).toBeInTheDocument()
    expect(screen.getByText(/80%/)).toBeInTheDocument()
  })

  it('should render an exceeded message when status is exceeded', () => {
    render(<CategoryAlert status="exceeded" categoryName="Farmácia" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/limite ultrapassado/i)).toBeInTheDocument()
  })

  it('should apply yellow style for warning', () => {
    render(<CategoryAlert status="warning" categoryName="Lazer" />)
    expect(screen.getByRole('alert')).toHaveClass('bg-yellow-100')
  })

  it('should apply red style for exceeded', () => {
    render(<CategoryAlert status="exceeded" categoryName="Lazer" />)
    expect(screen.getByRole('alert')).toHaveClass('bg-red-100')
  })
})
