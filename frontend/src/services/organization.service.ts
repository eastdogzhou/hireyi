/**
 * Organization Service
 * 组织服务 - 封装所有组织管理相关的 API 调用
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
    data: ApprovalRequest
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
    data: RoleUpdateRequest
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
