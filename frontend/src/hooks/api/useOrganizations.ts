/**
 * Organization API Hooks
 * 组织管理 API Hooks - 使用 React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  CreateOrganizationRequest,
  JoinOrganizationRequest,
  ApprovalRequest,
  RoleUpdateRequest,
} from '@/types'
import * as organizationApi from '@/services/organizationApi'

/**
 * Query key factory for organizations
 * 组织查询键工厂
 */
export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  members: (orgId: string) => [...organizationKeys.all, 'members', orgId] as const,
}

/**
 * Hook: Get user's organizations
 * 获取用户的组织列表
 */
export function useMyOrganizations() {
  return useQuery({
    queryKey: organizationKeys.lists(),
    queryFn: () => organizationApi.getMyOrganizations(),
  })
}

/**
 * Hook: Get organization members
 * 获取组织成员列表
 */
export function useOrganizationMembers(orgId: string, enabled = true) {
  return useQuery({
    queryKey: organizationKeys.members(orgId),
    queryFn: () => organizationApi.getOrganizationMembers(orgId),
    enabled: enabled && !!orgId,
  })
}

/**
 * Hook: Create new organization
 * 创建新组织
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateOrganizationRequest) =>
      organizationApi.createOrganization(data),
    onSuccess: () => {
      // Invalidate organization lists to refetch
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },
  })
}

/**
 * Hook: Join an organization
 * 加入组织
 */
export function useJoinOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: JoinOrganizationRequest) =>
      organizationApi.joinOrganization(data),
    onSuccess: () => {
      // Invalidate organization lists to refetch
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },
  })
}

/**
 * Hook: Approve or reject a member
 * 审批或拒绝成员
 */
export function useApproveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: ApprovalRequest }) =>
      organizationApi.approveMember(orgId, data),
    onSuccess: (_, variables) => {
      // Invalidate members list for this organization
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(variables.orgId),
      })
    },
  })
}

/**
 * Hook: Update member role
 * 更新成员角色
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: RoleUpdateRequest }) =>
      organizationApi.updateMemberRole(orgId, data),
    onSuccess: (_, variables) => {
      // Invalidate members list for this organization
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(variables.orgId),
      })
    },
  })
}

/**
 * Hook: Remove a member from organization
 * 从组织中移除成员
 */
export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orgId, memberId }: { orgId: string; memberId: number }) =>
      organizationApi.removeMember(orgId, memberId),
    onSuccess: (_, variables) => {
      // Invalidate members list for this organization
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(variables.orgId),
      })
    },
  })
}
