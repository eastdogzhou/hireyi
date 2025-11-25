import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, ScoreBadge, StatusBadge, BadgeGroup } from '../Badge'

describe('Badge', () => {
  describe('rendering', () => {
    it('should render badge with children', () => {
      render(<Badge>Test Badge</Badge>)
      expect(screen.getByText('Test Badge')).toBeInTheDocument()
    })

    it('should render with default variant', () => {
      render(<Badge>Default</Badge>)
      const badge = screen.getByText('Default')
      expect(badge).toHaveClass('bg-gray-100')
    })

    it('should render with primary variant', () => {
      render(<Badge variant="primary">Primary</Badge>)
      const badge = screen.getByText('Primary')
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800')
    })

    it('should render with success variant', () => {
      render(<Badge variant="success">Success</Badge>)
      const badge = screen.getByText('Success')
      expect(badge).toHaveClass('bg-green-100')
    })

    it('should render with warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>)
      const badge = screen.getByText('Warning')
      expect(badge).toHaveClass('bg-yellow-100')
    })

    it('should render with danger variant', () => {
      render(<Badge variant="danger">Danger</Badge>)
      const badge = screen.getByText('Danger')
      expect(badge).toHaveClass('bg-red-100')
    })

    it('should render with info variant', () => {
      render(<Badge variant="info">Info</Badge>)
      const badge = screen.getByText('Info')
      expect(badge).toHaveClass('bg-blue-100')
    })

    it('should render with gray variant', () => {
      render(<Badge variant="gray">Gray</Badge>)
      const badge = screen.getByText('Gray')
      expect(badge).toHaveClass('bg-gray-100')
    })
  })

  describe('sizes', () => {
    it('should render with medium size by default', () => {
      render(<Badge>Medium</Badge>)
      const badge = screen.getByText('Medium')
      expect(badge).toHaveClass('text-sm')
    })

    it('should render with small size', () => {
      render(<Badge size="sm">Small</Badge>)
      const badge = screen.getByText('Small')
      expect(badge).toHaveClass('text-xs')
    })

    it('should render with large size', () => {
      render(<Badge size="lg">Large</Badge>)
      const badge = screen.getByText('Large')
      expect(badge).toHaveClass('text-base')
    })
  })

  describe('shapes', () => {
    it('should render with rounded shape by default', () => {
      render(<Badge>Rounded</Badge>)
      const badge = screen.getByText('Rounded')
      expect(badge).toHaveClass('rounded-full')
    })

    it('should render with square shape', () => {
      render(<Badge shape="square">Square</Badge>)
      const badge = screen.getByText('Square')
      expect(badge).toHaveClass('rounded')
      expect(badge).not.toHaveClass('rounded-full')
    })
  })

  describe('dot indicator', () => {
    it('should not show dot by default', () => {
      const { container } = render(<Badge>No Dot</Badge>)
      const dot = container.querySelector('[aria-hidden="true"]')
      expect(dot).not.toBeInTheDocument()
    })

    it('should show dot when dot prop is true', () => {
      const { container } = render(<Badge dot>With Dot</Badge>)
      const dot = container.querySelector('[aria-hidden="true"]')
      expect(dot).toBeInTheDocument()
      expect(dot).toHaveClass('rounded-full')
    })
  })

  describe('icon', () => {
    it('should render with icon', () => {
      const icon = <span data-testid="icon">🔍</span>
      render(<Badge icon={icon}>With Icon</Badge>)
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })
  })

  describe('custom props', () => {
    it('should accept custom className', () => {
      render(<Badge className="custom-class">Custom</Badge>)
      const badge = screen.getByText('Custom')
      expect(badge).toHaveClass('custom-class')
    })
  })
})

describe('ScoreBadge', () => {
  it('should render "未评分" when score is null', () => {
    render(<ScoreBadge score={null} />)
    expect(screen.getByText('未评分')).toBeInTheDocument()
  })

  it('should render score 4 as "优秀"', () => {
    render(<ScoreBadge score={4} />)
    expect(screen.getByText('优秀')).toBeInTheDocument()
  })

  it('should render score 3 as "良好"', () => {
    render(<ScoreBadge score={3} />)
    expect(screen.getByText('良好')).toBeInTheDocument()
  })

  it('should render score 2 as "合格"', () => {
    render(<ScoreBadge score={2} />)
    expect(screen.getByText('合格')).toBeInTheDocument()
  })

  it('should render score 1 as "待提升"', () => {
    render(<ScoreBadge score={1} />)
    expect(screen.getByText('待提升')).toBeInTheDocument()
  })

  it('should show stars when showStars is true', () => {
    render(<ScoreBadge score={4} showStars />)
    expect(screen.getByText('★★★★')).toBeInTheDocument()
  })

  it('should use correct variant for score 4', () => {
    render(<ScoreBadge score={4} />)
    const badge = screen.getByText('优秀')
    expect(badge).toHaveClass('bg-green-100')
  })

  it('should use correct variant for score 3', () => {
    render(<ScoreBadge score={3} />)
    const badge = screen.getByText('良好')
    expect(badge).toHaveClass('bg-blue-100')
  })

  it('should use correct variant for score 2', () => {
    render(<ScoreBadge score={2} />)
    const badge = screen.getByText('合格')
    expect(badge).toHaveClass('bg-yellow-100')
  })

  it('should use correct variant for score 1', () => {
    render(<ScoreBadge score={1} />)
    const badge = screen.getByText('待提升')
    expect(badge).toHaveClass('bg-red-100')
  })
})

describe('StatusBadge', () => {
  it('should render screening status', () => {
    render(<StatusBadge status="screening" />)
    expect(screen.getByText(/筛选中/)).toBeInTheDocument()
  })

  it('should render interview status', () => {
    render(<StatusBadge status="interview" />)
    expect(screen.getByText(/面试中/)).toBeInTheDocument()
  })

  it('should render offer status', () => {
    render(<StatusBadge status="offer" />)
    expect(screen.getByText(/已发Offer/)).toBeInTheDocument()
  })

  it('should render hired status', () => {
    render(<StatusBadge status="hired" />)
    expect(screen.getByText(/已入职/)).toBeInTheDocument()
  })

  it('should render rejected status', () => {
    render(<StatusBadge status="rejected" />)
    expect(screen.getByText(/已拒绝/)).toBeInTheDocument()
  })

  it('should render withdrawn status', () => {
    render(<StatusBadge status="withdrawn" />)
    expect(screen.getByText(/已放弃/)).toBeInTheDocument()
  })

  it('should render open status', () => {
    render(<StatusBadge status="open" />)
    expect(screen.getByText(/招聘中/)).toBeInTheDocument()
  })

  it('should render closed status', () => {
    render(<StatusBadge status="closed" />)
    expect(screen.getByText(/已关闭/)).toBeInTheDocument()
  })

  it('should always show dot indicator', () => {
    const { container } = render(<StatusBadge status="screening" />)
    const dot = container.querySelector('[aria-hidden="true"]')
    expect(dot).toBeInTheDocument()
  })
})

describe('BadgeGroup', () => {
  it('should render all badges', () => {
    render(
      <BadgeGroup>
        <Badge>Badge 1</Badge>
        <Badge>Badge 2</Badge>
        <Badge>Badge 3</Badge>
      </BadgeGroup>
    )
    expect(screen.getByText('Badge 1')).toBeInTheDocument()
    expect(screen.getByText('Badge 2')).toBeInTheDocument()
    expect(screen.getByText('Badge 3')).toBeInTheDocument()
  })

  it('should limit displayed badges when maxDisplay is set', () => {
    render(
      <BadgeGroup maxDisplay={2}>
        <Badge>Badge 1</Badge>
        <Badge>Badge 2</Badge>
        <Badge>Badge 3</Badge>
        <Badge>Badge 4</Badge>
      </BadgeGroup>
    )
    expect(screen.getByText('Badge 1')).toBeInTheDocument()
    expect(screen.getByText('Badge 2')).toBeInTheDocument()
    expect(screen.queryByText('Badge 3')).not.toBeInTheDocument()
    expect(screen.queryByText('Badge 4')).not.toBeInTheDocument()
  })

  it('should show remaining count when badges exceed maxDisplay', () => {
    render(
      <BadgeGroup maxDisplay={2}>
        <Badge>Badge 1</Badge>
        <Badge>Badge 2</Badge>
        <Badge>Badge 3</Badge>
        <Badge>Badge 4</Badge>
      </BadgeGroup>
    )
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('should not show remaining count when all badges are displayed', () => {
    render(
      <BadgeGroup maxDisplay={5}>
        <Badge>Badge 1</Badge>
        <Badge>Badge 2</Badge>
      </BadgeGroup>
    )
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
  })
})
