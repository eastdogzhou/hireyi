"""Organization related Pydantic models."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    """Create organization request."""

    name: str = Field(
        ..., min_length=1, max_length=255, description="Organization name"
    )


class OrganizationJoinRequest(BaseModel):
    """Join organization request."""

    org_code: str = Field(
        ..., min_length=6, max_length=6, description="6-digit organization code"
    )


class OrganizationInfo(BaseModel):
    """Organization information."""

    id: str = Field(..., description="Organization UUID")
    name: str = Field(..., description="Organization name")
    org_code: str = Field(..., description="6-digit organization code")
    created_by: str = Field(..., description="Creator user UUID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class OrganizationMemberInfo(BaseModel):
    """Organization member with user details."""

    id: int = Field(..., description="Member record ID")
    org_id: str = Field(..., description="Organization UUID")
    user_id: str = Field(..., description="User UUID")
    user_name: str = Field(..., description="User display name")
    user_email: str = Field(..., description="User email")
    role: Literal["creator", "admin", "interviewer", "pending"] = Field(
        ..., description="Member role (creator=org creator, admin=HR, interviewer=limited access, pending=awaiting approval)"
    )
    requested_at: datetime = Field(..., description="Request timestamp")
    approved_at: datetime | None = Field(default=None, description="Approval timestamp")
    approved_by: str | None = Field(default=None, description="Approver user UUID")


class MemberApprovalRequest(BaseModel):
    """Member approval/rejection request."""

    member_id: int = Field(..., description="Member record ID to approve/reject")
    action: Literal["approve", "reject"] = Field(..., description="Approval action")
    approved_role: Literal["admin", "interviewer"] | None = Field(
        default=None,
        description="Role to assign when approving (defaults to 'interviewer'). Only creators can approve as 'admin'."
    )


class MemberRoleUpdateRequest(BaseModel):
    """Update member role request."""

    member_id: int = Field(..., description="Member record ID")
    new_role: Literal["admin", "interviewer", "pending"] = Field(
        ..., description="New role (cannot set creator)"
    )


class OrganizationWithRole(BaseModel):
    """Organization information with user's role."""

    id: str = Field(..., description="Organization UUID")
    name: str = Field(..., description="Organization name")
    org_code: str = Field(..., description="6-digit organization code")
    my_role: Literal["creator", "admin", "interviewer", "pending"] = Field(
        ..., description="User's role in organization"
    )
    created_at: datetime = Field(..., description="Creation timestamp")
