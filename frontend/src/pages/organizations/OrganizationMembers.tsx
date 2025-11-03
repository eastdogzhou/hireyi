/**
 * Organization Members Page
 * 组织成员管理页 - 管理组织成员、审批加入申请、分配角色
 */

import { useState } from 'react'
import {
  useMyOrganizations,
  useOrganizationMembers,
  useApproveMember,
  useUpdateMemberRole,
  useRemoveMember,
} from '@/hooks/api'
import type { OrganizationMember, MemberRole } from '@/types'
import {
  Card,
  Button,
  Badge,
  Table,
  SelectDropdown,
  type TableColumn,
} from '@/ui/components/common'
import { formatDate } from '@/lib/utils/format'
import { Users, UserPlus, UserMinus, Shield, CheckCircle, XCircle } from 'lucide-react'

export default function OrganizationMembers() {
  // Selected organization
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')

  // Fetch user's organizations
  const { data: organizations, isLoading: orgsLoading, error: orgsError, isError: hasOrgError } = useMyOrganizations()

  // Fetch members for selected organization
  const {
    data: members,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useOrganizationMembers(selectedOrgId, !!selectedOrgId)

  // Mutations
  const approveMemberMutation = useApproveMember()
  const updateRoleMutation = useUpdateMemberRole()
  const removeMemberMutation = useRemoveMember()

  // Get selected organization
  const selectedOrg = organizations?.find((org) => org.id === selectedOrgId)

  // Check if current user is admin (creator or admin role)
  const isAdmin = selectedOrg?.my_role === 'creator' || selectedOrg?.my_role === 'admin'

  // Handle organization selection
  const handleOrgChange = (value: string | number | (string | number)[]) => {
    setSelectedOrgId(value as string)
  }

  // Handle approve member
  const handleApprove = async (memberId: number) => {
    if (!selectedOrgId) return

    try {
      await approveMemberMutation.mutateAsync({
        orgId: selectedOrgId,
        data: { member_id: memberId, action: 'approve' },
      })
      refetchMembers()
    } catch (error) {
      console.error('Failed to approve member:', error)
    }
  }

  // Handle reject member
  const handleReject = async (memberId: number) => {
    if (!selectedOrgId) return

    try {
      await approveMemberMutation.mutateAsync({
        orgId: selectedOrgId,
        data: { member_id: memberId, action: 'reject' },
      })
      refetchMembers()
    } catch (error) {
      console.error('Failed to reject member:', error)
    }
  }

  // Handle role update
  const handleRoleUpdate = async (memberId: number, newRole: MemberRole) => {
    if (!selectedOrgId) return

    try {
      await updateRoleMutation.mutateAsync({
        orgId: selectedOrgId,
        data: { member_id: memberId, new_role: newRole },
      })
      refetchMembers()
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  // Handle remove member
  const handleRemove = async (memberId: number) => {
    if (!selectedOrgId) return
    if (!confirm('确定要移除此成员吗？')) return

    try {
      await removeMemberMutation.mutateAsync({
        orgId: selectedOrgId,
        memberId,
      })
      refetchMembers()
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  // Organization options for dropdown (exclude pending organizations)
  const orgOptions = organizations
    ?.filter((org) => org.my_role !== 'pending')
    .map((org) => ({
      value: org.id,
      label: `${org.name} (${org.org_code})`,
    })) || []

  // Role badge variant
  const getRoleBadgeVariant = (role: MemberRole) => {
    switch (role) {
      case 'creator':
        return 'primary' as const
      case 'admin':
        return 'warning' as const
      case 'interviewer':
        return 'default' as const
      case 'pending':
        return 'gray' as const
      default:
        return 'default' as const
    }
  }

  // Role display text
  const getRoleText = (role: MemberRole) => {
    const roleMap: Record<MemberRole, string> = {
      creator: '创建者',
      admin: '管理员',
      interviewer: '面试官',
      pending: '待审批',
    }
    return roleMap[role] || role
  }

  // Table columns for members
  const columns: TableColumn<OrganizationMember>[] = [
    {
      key: 'user_name',
      title: '姓名',
      width: '20%',
      render: (value: string, record: OrganizationMember) => (
        <div>
          <div className="font-medium text-gray-900">{value || '未知用户'}</div>
          <div className="text-sm text-gray-500">{record.user_email || '-'}</div>
        </div>
      ),
    },
    {
      key: 'role',
      title: '角色',
      width: '15%',
      render: (value: MemberRole) => (
        <Badge variant={getRoleBadgeVariant(value)} size="sm">
          {getRoleText(value)}
        </Badge>
      ),
    },
    {
      key: 'approved_at',
      title: '加入时间',
      width: '15%',
      render: (value: string | null) => (
        <span className="text-gray-600">
          {value ? formatDate(value) : '-'}
        </span>
      ),
    },
    {
      key: 'requested_at',
      title: '申请时间',
      width: '15%',
      render: (value: string) => (
        <span className="text-gray-600">{formatDate(value)}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '26%',
      align: 'center',
      render: (_: any, record: OrganizationMember) => {
        // Only show actions for admins
        if (!isAdmin) return <span className="text-gray-400">-</span>

        // Pending members: show approve/reject
        if (record.role === 'pending') {
          return (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="success"
                size="sm"
                icon={<CheckCircle className="w-3.5 h-3.5" />}
                onClick={() => handleApprove(record.id)}
                loading={approveMemberMutation.isPending}
                className="whitespace-nowrap"
              >
                批准
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="w-3.5 h-3.5" />}
                onClick={() => handleReject(record.id)}
                loading={approveMemberMutation.isPending}
                className="whitespace-nowrap"
              >
                拒绝
              </Button>
            </div>
          )
        }

        // Approved members: show role change and remove (except creator)
        if (record.role !== 'pending' && record.role !== 'creator') {
          return (
            <div className="flex items-center justify-center gap-2">
              {/* Role change dropdown */}
              <SelectDropdown
                options={[
                  { value: 'admin', label: '管理员' },
                  { value: 'interviewer', label: '面试官' },
                ]}
                value={record.role}
                onChange={(value) => handleRoleUpdate(record.id, value as MemberRole)}
                placeholder="角色"
                size="sm"
              />
              <Button
                variant="danger"
                size="sm"
                icon={<UserMinus className="w-3.5 h-3.5" />}
                onClick={() => handleRemove(record.id)}
                loading={removeMemberMutation.isPending}
                className="whitespace-nowrap"
              >
                移除
              </Button>
            </div>
          )
        }

        return <span className="text-gray-400">-</span>
      },
    },
  ]

  // Separate pending and approved members
  const pendingMembers = members?.filter((m) => m.role === 'pending') || []
  const approvedMembers = members?.filter((m) => m.role !== 'pending') || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">组织成员管理</h1>
          <p className="text-gray-600 mt-1">管理组织成员、审批加入申请、分配角色</p>
        </div>
      </div>

      {/* Organization Selection */}
      <Card overflowVisible>
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择组织
          </label>

          {/* Debug info */}
          {hasOrgError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <div><strong>错误:</strong> {orgsError?.message || '无法加载组织列表'}</div>
              <div className="mt-2 text-xs">
                <div>请检查：</div>
                <div>1. 是否已登录？</div>
                <div>2. 浏览器控制台是否有更多错误信息？</div>
                <div>3. 后端服务是否正常运行？</div>
              </div>
            </div>
          )}

          <SelectDropdown
            options={orgOptions}
            value={selectedOrgId}
            onChange={handleOrgChange}
            placeholder="请选择组织"
            className="w-full max-w-md"
          />
          {selectedOrg && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>
                您的角色: <strong>{getRoleText(selectedOrg.my_role)}</strong>
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Pending Approvals (only show for admins) */}
      {selectedOrgId && isAdmin && pendingMembers.length > 0 && (
        <Card overflowVisible>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-orange-600" />
              待审批申请 ({pendingMembers.length})
            </h2>
          </div>
          <Table
            columns={columns}
            data={pendingMembers}
            rowKey="id"
            loading={membersLoading}
            hoverable
            overflowVisible
          />
        </Card>
      )}

      {/* Members List */}
      {selectedOrgId && (
        <Card overflowVisible>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              组织成员 ({approvedMembers.length})
            </h2>
          </div>
          <Table
            columns={columns}
            data={approvedMembers}
            rowKey="id"
            loading={membersLoading}
            hoverable
            overflowVisible
            emptyComponent={
              <div className="p-8">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">暂无成员</p>
                  <p className="text-gray-500 text-sm mt-1">
                    该组织还没有已批准的成员
                  </p>
                </div>
              </div>
            }
          />
        </Card>
      )}

      {/* Empty State - No Organization Selected */}
      {!selectedOrgId && !orgsLoading && (
        <Card>
          <div className="p-12">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">请选择一个组织</p>
              <p className="text-gray-500 text-sm mt-2">
                从上方下拉菜单中选择一个组织以查看和管理成员
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State - No Organizations */}
      {!selectedOrgId && !orgsLoading && organizations?.length === 0 && (
        <Card>
          <div className="p-12">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">暂无组织</p>
              <p className="text-gray-500 text-sm mt-2">
                您还没有加入任何组织，请先创建或加入一个组织
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
