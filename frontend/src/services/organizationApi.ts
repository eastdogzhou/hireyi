/**
 * Organization API Service
 * 组织管理 API 服务层
 */

import { apiClient } from './auth.service'
import type {
  Organization,
  OrganizationWithRole,
  OrganizationMember,
  CreateOrganizationRequest,
  JoinOrganizationRequest,
  ApprovalRequest,
  RoleUpdateRequest,
} from '@/types'

/**
 * Get user's organizations
 * 获取用户的组织列表
 */
export async function getMyOrganizations(): Promise<OrganizationWithRole[]> {
  const response = await apiClient.get<OrganizationWithRole[]>('/api/organizations')
  return response.data
}

/**
 * Create a new organization
 * 创建新组织
 */
export async function createOrganization(
  data: CreateOrganizationRequest
): Promise<Organization> {
  const response = await apiClient.post<Organization>('/api/organizations', data)
  return response.data
}

/**
 * Join an organization
 * 加入组织
 */
export async function joinOrganization(
  data: JoinOrganizationRequest
): Promise<Organization> {
  const response = await apiClient.post<Organization>('/api/organizations/join', data)
  return response.data
}

/**
 * Get organization members
 * 获取组织成员列表
 */
export async function getOrganizationMembers(
  orgId: string
): Promise<OrganizationMember[]> {
  const response = await apiClient.get<OrganizationMember[]>(`/api/organizations/${orgId}/members`)
  return response.data
}

/**
 * Approve or reject a member
 * 审批或拒绝成员
 */
export async function approveMember(
  orgId: string,
  data: ApprovalRequest
): Promise<OrganizationMember> {
  const response = await apiClient.post<OrganizationMember>(
    `/api/organizations/${orgId}/members/approve`,
    data
  )
  return response.data
}

/**
 * Update member role
 * 更新成员角色
 */
export async function updateMemberRole(
  orgId: string,
  data: RoleUpdateRequest
): Promise<OrganizationMember> {
  const response = await apiClient.put<OrganizationMember>(
    `/api/organizations/${orgId}/members/role`,
    data
  )
  return response.data
}

/**
 * Remove a member from organization
 * 从组织中移除成员
 */
export async function removeMember(
  orgId: string,
  memberId: number
): Promise<void> {
  await apiClient.delete(`/api/organizations/${orgId}/members/${memberId}`)
}
