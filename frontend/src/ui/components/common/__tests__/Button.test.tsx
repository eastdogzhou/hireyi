import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button, IconButton, ButtonGroup } from '../Button'

describe('Button', () => {
  describe('rendering', () => {
    it('should render button with children', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button')).toHaveTextContent('Click me')
    })

    it('should render with primary variant by default', () => {
      render(<Button>Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-orange-500')
    })

    it('should render with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-orange-500')
    })

    it('should render with danger variant', () => {
      render(<Button variant="danger">Danger</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-500')
    })

    it('should render with success variant', () => {
      render(<Button variant="success">Success</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-green-500')
    })

    it('should render with ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-gray-600')
    })
  })

  describe('sizes', () => {
    it('should render with medium size by default', () => {
      render(<Button>Medium</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-base')
    })

    it('should render with small size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-sm')
    })

    it('should render with large size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-lg')
    })
  })

  describe('states', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50')
    })

    it('should be disabled when loading', () => {
      render(<Button loading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should show loading spinner when loading', () => {
      render(<Button loading>Loading</Button>)
      expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    })

    it('should render full width when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })
  })

  describe('icons', () => {
    it('should render with left icon', () => {
      const icon = <span data-testid="left-icon">🔍</span>
      render(<Button icon={icon}>Search</Button>)
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })

    it('should render with right icon', () => {
      const icon = <span data-testid="right-icon">→</span>
      render(<Button iconRight={icon}>Next</Button>)
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('should not show icon when loading', () => {
      const icon = <span data-testid="icon">🔍</span>
      render(
        <Button icon={icon} loading>
          Loading
        </Button>
      )
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument()
    })
  })

  describe('events', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      )
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should not call onClick when loading', () => {
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} loading>
          Loading
        </Button>
      )
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('custom props', () => {
    it('should accept custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should forward HTML button attributes', () => {
      render(<Button type="submit">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })
  })
})

describe('IconButton', () => {
  it('should render icon button', () => {
    const icon = <span data-testid="icon">📱</span>
    render(<IconButton icon={icon} aria-label="Phone" />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone')).toBeInTheDocument()
  })

  it('should have square aspect ratio', () => {
    const icon = <span>🔍</span>
    render(<IconButton icon={icon} aria-label="Search" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('aspect-square')
  })

  it('should support different sizes', () => {
    const icon = <span>🔍</span>
    const { rerender } = render(<IconButton icon={icon} aria-label="Search" size="sm" />)
    expect(screen.getByRole('button')).toHaveClass('w-8', 'h-8')

    rerender(<IconButton icon={icon} aria-label="Search" size="md" />)
    expect(screen.getByRole('button')).toHaveClass('w-10', 'h-10')

    rerender(<IconButton icon={icon} aria-label="Search" size="lg" />)
    expect(screen.getByRole('button')).toHaveClass('w-12', 'h-12')
  })
})

describe('ButtonGroup', () => {
  it('should render button group horizontally by default', () => {
    render(
      <ButtonGroup>
        <Button>Button 1</Button>
        <Button>Button 2</Button>
      </ButtonGroup>
    )
    const group = screen.getByRole('group')
    expect(group).toHaveClass('flex-row')
    expect(group).toHaveClass('space-x-2')
  })

  it('should render button group vertically', () => {
    render(
      <ButtonGroup vertical>
        <Button>Button 1</Button>
        <Button>Button 2</Button>
      </ButtonGroup>
    )
    const group = screen.getByRole('group')
    expect(group).toHaveClass('flex-col')
    expect(group).toHaveClass('space-y-2')
  })

  it('should render all children buttons', () => {
    render(
      <ButtonGroup>
        <Button>Button 1</Button>
        <Button>Button 2</Button>
        <Button>Button 3</Button>
      </ButtonGroup>
    )
    expect(screen.getByText('Button 1')).toBeInTheDocument()
    expect(screen.getByText('Button 2')).toBeInTheDocument()
    expect(screen.getByText('Button 3')).toBeInTheDocument()
  })
})
