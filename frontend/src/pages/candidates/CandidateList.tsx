/**
 * Candidate List Page
 * 候选人列表页 - 展示、搜索、筛选候选人
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCandidates } from '@/hooks/api'
import { UploadResumeModal } from '@/components/business/UploadResumeModal'
import type { CandidateListParams } from '@/types'
import {
  Card,
  Button,
  SearchBar,
  SelectDropdown,
  Badge,
  Table,
  Pagination,
  LoadingSpinner,
  EmptyState,
} from '@/ui/components/common'
import { Upload, Plus, UserPlus } from 'lucide-react'

export default function CandidateList() {
  const navigate = useNavigate()

  // Search and filter state
  const [searchParams, setSearchParams] = useState<CandidateListParams>({
    page: 1,
    page_size: 20,
    name: '',
    skills: [],
    min_score: undefined,
  })

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Fetch candidates
  const { data, isLoading, error, refetch } = useCandidates(searchParams)

  // Handle search
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, name: value, page: 1 }))
  }

  // Handle score filter
  const handleScoreFilter = (value: string | number | (string | number)[]) => {
    const score = value as number
    setSearchParams(prev => ({
      ...prev,
      min_score: score || undefined,
      page: 1,
    }))
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }))
  }

  // Navigate to candidate detail
  const handleRowClick = (candidateId: number) => {
    navigate(`/candidates/${candidateId}`)
  }

  // Handle upload resume success
  const handleUploadSuccess = () => {
    refetch()
    setShowUploadModal(false)
  }

  // Handle create candidate
  const handleCreateCandidate = () => {
    // TODO: Implement create candidate modal or navigate to create page
    alert('新增候选人功能开发中，请先使用"上传简历"功能自动创建候选人')
  }

  // Score options for filter
  const scoreOptions = [
    { value: '', label: '全部评分' },
    { value: 4, label: '⭐⭐⭐⭐ 优秀' },
    { value: 3, label: '⭐⭐⭐ 良好' },
    { value: 2, label: '⭐⭐ 一般' },
    { value: 1, label: '⭐ 较差' },
  ]

  // Table columns
  const columns = [
    {
      key: 'id',
      title: 'ID',
      width: '80px',
      render: (_: any, record: any) => <span className="text-gray-500">#{record.id}</span>,
    },
    {
      key: 'name',
      title: '姓名',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
            {record.name?.charAt(0) || '?'}
          </div>
          <div>
            <div className="font-medium text-gray-900">{record.name}</div>
            <div className="text-sm text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'skills',
      title: '技能标签',
      render: (_: any, record: any) => (
        <div className="flex flex-wrap gap-1">
          {record.skills?.slice(0, 3).map((skill: string, index: number) => (
            <Badge key={index} variant="default" size="sm">
              {skill}
            </Badge>
          ))}
          {record.skills?.length > 3 && (
            <Badge variant="gray" size="sm">
              +{record.skills.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'score',
      title: '评分',
      width: '120px',
      render: (_: any, record: any) => {
        if (!record || record.score === null || record.score === undefined) {
          return (
            <div className="flex items-center gap-2">
              <Badge variant="gray">未评分</Badge>
            </div>
          )
        }

        const scoreVariants: Record<number, 'success' | 'warning' | 'default'> = {
          4: 'success',
          3: 'success',
          2: 'warning',
          1: 'default',
        }
        const scoreLabels: Record<number, string> = {
          4: '优秀',
          3: '良好',
          2: '一般',
          1: '较差',
        }
        return (
          <div className="flex items-center gap-2">
            <Badge variant={scoreVariants[record.score] || 'default'}>
              {scoreLabels[record.score] || 'N/A'}
            </Badge>
            <span className="text-sm text-gray-500">{'⭐'.repeat(record.score)}</span>
          </div>
        )
      },
    },
    {
      key: 'created_at',
      title: '创建时间',
      width: '150px',
      render: (_: any, record: any) => (
        <span className="text-sm text-gray-600">
          {new Date(record.created_at).toLocaleDateString('zh-CN')}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">人才库</h1>
          <p className="text-gray-600 mt-1">管理和查看所有人才信息</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => setShowUploadModal(true)}
          >
            上传简历
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card overflowVisible>
        <div className="p-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[300px]">
            <SearchBar
              placeholder="搜索人才姓名..."
              value={searchParams.name}
              onChange={handleSearch}
            />
          </div>
          <div className="w-[200px]">
            <SelectDropdown
              options={scoreOptions}
              value={searchParams.min_score}
              onChange={handleScoreFilter}
              placeholder="评分筛选"
            />
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-8">
            <EmptyState title="加载失败" description="无法加载人才列表，请稍后重试" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<UserPlus className="w-12 h-12" />}
              title="暂无人才"
              description="还没有人才数据，点击上方按钮上传简历"
            />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={data.data}
              onRowClick={row => handleRowClick(row.id)}
              className="cursor-pointer"
            />
            <div className="p-4 border-t border-gray-200">
              <Pagination
                currentPage={searchParams.page || 1}
                totalPages={Math.ceil(data.total / (searchParams.page_size || 20))}
                totalItems={data.total}
                pageSize={searchParams.page_size || 20}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </Card>

      {/* Upload Resume Modal */}
      <UploadResumeModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
}
