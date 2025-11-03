/**
 * Organization Service
 * 组织服务 - 封装所有组织管理相关的 API 调用
 */

import { apiClient } from './auth.service'

/**
 * 组织信息
 */
export interface Organization {
  id: string
  name: string
  org_code: string
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * 组织（带用户角色信息）
 */
export interface OrganizationWithRole {
  id: string
  name: string
  org_code: string
  my_role: 'admin' | 'member'
  my_status: 'approved' | 'pending' | 'rejected'
  created_at: string
}

/**
 * 组织成员信息
 */
export interface OrganizationMember {
  id: number
  org_id: string
  user_id: string
  user_name: string
  user_email: string
  role: 'admin' | 'member'
  status: 'approved' | 'pending' | 'rejected'
  requested_at: string
  approved_at: string | null
  approved_by: string | null
}

/**
 * 创建组织请求
 */
export interface CreateOrganizationRequest {
  name: string
}

/**
 * 加入组织请求
 */
export interface JoinOrganizationRequest {
  org_code: string
}

/**
 * 审批成员请求
 */
export interface ApproveMemberRequest {
  member_id: number
  action: 'approve' | 'reject'
}

/**
 * 更新成员角色请求
 */
export interface UpdateMemberRoleRequest {
  member_id: number
  new_role: 'admin' | 'member'
}

/**
 * 组织服务类
 */
class OrganizationService {
  /**
   * 创建组织
   */
  async createOrganization(data: CreateOrganizationRequest): Promise<Organization> {
    const response = await apiClient.post<Organization>('/api/organizations', data)
    return response.data
  }

  /**
   * 加入组织
   */
  async joinOrganization(data: JoinOrganizationRequest): Promise<Organization> {
    const response = await apiClient.post<Organization>('/api/organizations/join', data)
    return response.data
  }

  /**
   * 获取用户所属的组织列表
   */
  async getUserOrganizations(): Promise<OrganizationWithRole[]> {
    const response = await apiClient.get<OrganizationWithRole[]>('/api/organizations')
    return response.data
  }

  /**
   * 获取组织成员列表
   */
  async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    const response = await apiClient.get<OrganizationMember[]>(
      `/api/organizations/${orgId}/members`
    )
    return response.data
  }

  /**
   * 审批或拒绝成员加入请求
   */
  async approveMember(
    orgId: string,
    data: ApproveMemberRequest
  ): Promise<OrganizationMember> {
    const response = await apiClient.post<OrganizationMember>(
      `/api/organizations/${orgId}/members/approve`,
      data
    )
    return response.data
  }

  /**
   * 更新成员角色
   */
  async updateMemberRole(
    orgId: string,
    data: UpdateMemberRoleRequest
  ): Promise<OrganizationMember> {
    const response = await apiClient.put<OrganizationMember>(
      `/api/organizations/${orgId}/members/role`,
      data
    )
    return response.data
  }

  /**
   * 移除组织成员
   */
  async removeMember(orgId: string, memberId: number): Promise<void> {
    await apiClient.delete(`/api/organizations/${orgId}/members/${memberId}`)
  }
}

// 导出单例实例
export const organizationService = new OrganizationService()
