import { render, screen } from '@testing-library/react'
import CategoryProgressBar from './CategoryProgressBar'

describe('CategoryProgressBar', () => {
  it('should render the category name', () => {
    render(<CategoryProgressBar name="Farmácia" spent={10000} limit={20000} />)
    expect(screen.getByText('Farmácia')).toBeInTheDocument()
  })

  it('should render formatted spent and limit values', () => {
    render(<CategoryProgressBar name="Lazer" spent={15000} limit={30000} />)
    expect(screen.getByText('R$ 150,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 300,00')).toBeInTheDocument()
  })

  it('should set progress bar width to 50% when spent is half of limit', () => {
    render(<CategoryProgressBar name="Lazer" spent={15000} limit={30000} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveStyle({ width: '50%' })
  })

  it('should cap progress bar width at 100% when exceeded', () => {
    render(<CategoryProgressBar name="Lazer" spent={40000} limit={30000} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveStyle({ width: '100%' })
  })

  it('should apply green color when status is ok', () => {
    render(<CategoryProgressBar name="Lazer" spent={10000} limit={30000} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveClass('bg-green-500')
  })

  it('should apply yellow color when status is warning', () => {
    render(<CategoryProgressBar name="Farmácia" spent={18000} limit={20000} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveClass('bg-yellow-500')
  })

  it('should apply red color when status is exceeded', () => {
    render(<CategoryProgressBar name="Farmácia" spent={21000} limit={20000} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveClass('bg-red-500')
  })
})
