"""Organization management API endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.config.database import get_supabase
from app.middleware.auth import get_current_user, require_admin
from app.models.auth import CurrentUser
from app.models.organization import (
    MemberApprovalRequest,
    MemberRoleUpdateRequest,
    OrganizationCreate,
    OrganizationInfo,
    OrganizationJoinRequest,
    OrganizationMemberInfo,
    OrganizationWithRole,
)
from app.services.organization_service import OrganizationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])


@router.post("", response_model=OrganizationInfo, status_code=status.HTTP_201_CREATED)
async def create_organization(
    request: OrganizationCreate,
    current_user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> OrganizationInfo:
    """Create a new organization.

    :param request: Organization creation request.
    :param current_user: Current authenticated user.
    :param supabase: Supabase client instance.
    :return: Created organization information.
    :raises HTTPException: If creation fails.
    """
    try:
        org_service = OrganizationService(supabase)
        organization = await org_service.create_organization(
            user_id=current_user.user_id,
            user_name=current_user.name,
            request=request,
        )

        return organization

    except ValueError as e:
        logger.warning(f"Organization creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Organization creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create organization",
        )


@router.post("/join", response_model=OrganizationInfo)
async def join_organization(
    request: OrganizationJoinRequest,
    current_user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> OrganizationInfo:
    """Request to join an existing organization.

    :param request: Join request with org_code.
    :param current_user: Current authenticated user.
    :param supabase: Supabase client instance.
    :return: Organization information.
    :raises HTTPException: If join request fails.
    """
    try:
        org_service = OrganizationService(supabase)
        organization = await org_service.join_organization(
            user_id=current_user.user_id,
            request=request,
        )

        return organization

    except ValueError as e:
        logger.warning(f"Join organization failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Join organization error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join organization",
        )


@router.get("", response_model=list[OrganizationWithRole])
async def get_my_organizations(
    current_user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> list[OrganizationWithRole]:
    """Get all organizations the current user is a member of.

    :param current_user: Current authenticated user.
    :param supabase: Supabase client instance.
    :return: List of organizations with user's role.
    :raises HTTPException: If query fails.
    """
    try:
        org_service = OrganizationService(supabase)
        organizations = await org_service.get_user_organizations(
            user_id=current_user.user_id
        )

        return organizations

    except ValueError as e:
        logger.warning(f"Get organizations failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Get organizations error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get organizations",
        )


@router.get("/{org_id}/members", response_model=list[OrganizationMemberInfo])
async def get_organization_members(
    org_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> list[OrganizationMemberInfo]:
    """Get all members of an organization.

    :param org_id: Organization UUID.
    :param current_user: Current authenticated user.
    :param supabase: Supabase client instance.
    :return: List of organization members.
    :raises HTTPException: If user is not a member or query fails.
    """
    try:
        org_service = OrganizationService(supabase)
        members = await org_service.get_organization_members(
            org_id=org_id,
            user_id=current_user.user_id,
        )

        return members

    except ValueError as e:
        logger.warning(f"Get members failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Get members error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get organization members",
        )


@router.post("/{org_id}/members/approve", response_model=OrganizationMemberInfo)
async def approve_or_reject_member(
    org_id: str,
    request: MemberApprovalRequest,
    current_user: CurrentUser = Depends(require_admin),
    supabase: Client = Depends(get_supabase),
) -> OrganizationMemberInfo:
    """Approve or reject a member join request (admin only).

    :param org_id: Organization UUID.
    :param request: Approval request.
    :param current_user: Current authenticated admin user.
    :param supabase: Supabase client instance.
    :return: Updated member information.
    :raises HTTPException: If user is not admin or approval fails.
    """
    try:
        org_service = OrganizationService(supabase)
        member = await org_service.approve_or_reject_member(
            org_id=org_id,
            admin_user_id=current_user.user_id,
            request=request,
        )

        return member

    except ValueError as e:
        logger.warning(f"Approve/reject member failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Approve/reject member error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to approve/reject member",
        )


@router.put("/{org_id}/members/role", response_model=OrganizationMemberInfo)
async def update_member_role(
    org_id: str,
    request: MemberRoleUpdateRequest,
    current_user: CurrentUser = Depends(require_admin),
    supabase: Client = Depends(get_supabase),
) -> OrganizationMemberInfo:
    """Update a member's role (admin only).

    :param org_id: Organization UUID.
    :param request: Role update request.
    :param current_user: Current authenticated admin user.
    :param supabase: Supabase client instance.
    :return: Updated member information.
    :raises HTTPException: If user is not admin or update fails.
    """
    try:
        org_service = OrganizationService(supabase)
        member = await org_service.update_member_role(
            org_id=org_id,
            admin_user_id=current_user.user_id,
            request=request,
        )

        return member

    except ValueError as e:
        logger.warning(f"Update member role failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Update member role error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update member role",
        )


@router.delete("/{org_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    org_id: str,
    member_id: int,
    current_user: CurrentUser = Depends(require_admin),
    supabase: Client = Depends(get_supabase),
) -> None:
    """Remove a member from organization (admin only).

    :param org_id: Organization UUID.
    :param member_id: Member record ID to remove.
    :param current_user: Current authenticated admin user.
    :param supabase: Supabase client instance.
    :raises HTTPException: If user is not admin or removal fails.
    """
    try:
        org_service = OrganizationService(supabase)
        await org_service.remove_member(
            org_id=org_id,
            admin_user_id=current_user.user_id,
            member_id=member_id,
        )

    except ValueError as e:
        logger.warning(f"Remove member failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Remove member error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove member",
        )
