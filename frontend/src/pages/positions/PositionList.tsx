/**
 * Position List Page
 * 职位列表页 - 展示、搜索、筛选职位
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePositions } from '@/hooks/api'
import type { PositionListParams } from '@/types'
import type { Position } from '@/types/models'
import {
  Card,
  Button,
  SearchBar,
  SelectDropdown,
  Badge,
  Table,
  type TableColumn,
} from '@/ui/components/common'
import { formatDate } from '@/lib/utils/format'
import { Plus, Eye, Zap, Briefcase } from 'lucide-react'

export default function PositionList() {
  const navigate = useNavigate()

  // Search and filter state
  const [searchParams, setSearchParams] = useState<PositionListParams>({
    page: 1,
    page_size: 20,
    title: '',
    department: '',
  })

  // Fetch positions
  const { data, isLoading, error } = usePositions(searchParams)

  // Handle search
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, title: value, page: 1 }))
  }

  // Handle department filter
  const handleDepartmentFilter = (value: string | number | (string | number)[]) => {
    const department = value as string
    setSearchParams(prev => ({
      ...prev,
      department: department || '',
      page: 1,
    }))
  }

  // Navigate to position detail
  const handleRowClick = (position: Position) => {
    navigate(`/positions/${position.id}`)
  }

  // Handle view detail button
  const handleViewDetail = (e: React.MouseEvent, positionId: number) => {
    e.stopPropagation()
    navigate(`/positions/${positionId}`)
  }

  // Handle smart screening button
  const handleSmartScreening = (e: React.MouseEvent, positionId: number) => {
    e.stopPropagation()
    console.log('Smart screening for position:', positionId)
  }

  // Department options (mock - should come from API)
  const departmentOptions = [
    { value: '', label: '全部部门' },
    { value: '技术部', label: '技术部' },
    { value: '产品部', label: '产品部' },
    { value: '设计部', label: '设计部' },
    { value: '市场部', label: '市场部' },
    { value: '运营部', label: '运营部' },
  ]

  // Table columns configuration
  const columns: TableColumn<Position>[] = [
    {
      key: 'title',
      title: '职位名称',
      width: '25%',
      render: (value: string, record: Position) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {record.jd && (
            <div className="text-sm text-gray-500 line-clamp-1 mt-1">
              {record.jd}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'department',
      title: '部门',
      width: '11%',
      render: (value: string) => (
        <span className="text-gray-700">{value || '-'}</span>
      ),
    },
    {
      key: 'salary_range',
      title: '薪资范围',
      width: '14%',
      render: (value: string) => (
        value ? (
          <span className="text-orange-600 font-medium">{value}</span>
        ) : (
          <span className="text-gray-400">未设置</span>
        )
      ),
    },
    {
      key: 'candidates_count',
      title: '候选人数',
      width: '10%',
      align: 'center',
      render: () => (
        <span className="text-gray-600">0</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: '10%',
      align: 'center',
      render: () => (
        <Badge variant="success" size="sm">招聘中</Badge>
      ),
    },
    {
      key: 'created_at',
      title: '创建时间',
      width: '12%',
      render: (value: string) => (
        <span className="text-gray-600">{formatDate(value)}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '18%',
      align: 'center',
      render: (_: any, record: Position) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={(e) => handleViewDetail(e, record.id)}
            className="whitespace-nowrap"
          >
            详情
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Zap className="w-3.5 h-3.5" />}
            onClick={(e) => handleSmartScreening(e, record.id)}
            className="whitespace-nowrap"
          >
            筛选
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">职位管理</h1>
          <p className="text-gray-600 mt-1">管理招聘职位和候选人匹配</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            console.log('Create position')
          }}
        >
          新建职位
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <div className="p-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[300px]">
            <SearchBar
              placeholder="搜索职位名称..."
              value={searchParams.title}
              onChange={handleSearch}
            />
          </div>
          <div className="w-[200px]">
            <SelectDropdown
              options={departmentOptions}
              value={searchParams.department}
              onChange={handleDepartmentFilter}
              placeholder="部门筛选"
            />
          </div>
        </div>
      </Card>

      {/* Position Table */}
      <Card>
        <Table
          columns={columns}
          data={data?.data || []}
          rowKey="id"
          loading={isLoading}
          onRowClick={handleRowClick}
          hoverable
          emptyComponent={
            error ? (
              <div className="p-8">
                <div className="text-center">
                  <p className="text-gray-600">加载失败，请稍后重试</p>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="text-center">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">暂无职位</p>
                  <p className="text-gray-500 text-sm mt-1">还没有职位数据，点击上方按钮创建新职位</p>
                </div>
              </div>
            )
          }
        />
      </Card>

      {/* Summary Stats */}
      {data && data.data.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>共找到 {data.total} 个职位</span>
          {data.total > searchParams.page_size! && (
            <span>
              显示 {(searchParams.page! - 1) * searchParams.page_size! + 1} -{' '}
              {Math.min(searchParams.page! * searchParams.page_size!, data.total)} 条
            </span>
          )}
        </div>
      )}
    </div>
  )
}
