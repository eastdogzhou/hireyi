"""Authentication service for user registration and login."""

import logging
from datetime import UTC, datetime, timedelta

import jwt
from supabase import Client

from app.config.settings import get_settings
from app.models.auth import (
    AuthToken,
    CurrentUser,
    LoginRequest,
    PasswordResetRequest,
    RegisterRequest,
    UserProfile,
)

logger = logging.getLogger(__name__)


class AuthService:
    """Service for handling authentication operations."""

    def __init__(self, supabase: Client):
        """Initialize auth service.

        :param supabase: Supabase client instance.
        """
        self.supabase = supabase
        self.settings = get_settings()

    async def register(self, request: RegisterRequest) -> tuple[AuthToken, UserProfile]:
        """Register a new user.

        :param request: Registration request data.
        :return: Tuple of (auth token, user profile).
        :raises ValueError: If registration fails.
        """
        try:
            # Step 1: Create auth user with Supabase Auth
            auth_response = self.supabase.auth.sign_up(
                {
                    "email": request.email,
                    "password": request.password,
                }
            )

            if not auth_response.user:
                raise ValueError("Failed to create user account")

            user_id = auth_response.user.id

            # Step 2: Create user profile in users table
            user_data = {
                "id": user_id,
                "name": request.name,
                "email": request.email,
                "current_org_id": None,
            }

            user_response = self.supabase.table("users").insert(user_data).execute()

            if not user_response.data:
                # Rollback: delete auth user
                logger.error("Failed to create user profile, rolling back")
                # Note: Supabase doesn't provide direct user deletion via client
                # This would require admin API or SQL trigger
                raise ValueError("Failed to create user profile")

            # Step 3: Handle organization if provided
            if request.org_id:
                # Create join request (pending role)
                member_data = {
                    "org_id": request.org_id,
                    "user_id": user_id,
                    "role": "pending",  # Awaiting approval
                }
                self.supabase.table("org_members").insert(member_data).execute()

            # Step 4: Generate tokens
            access_token = self._create_access_token(user_id, request.email)
            expires_in = self.settings.jwt_access_token_expire_minutes * 60

            auth_token = AuthToken(
                access_token=access_token,
                token_type="bearer",
                expires_in=expires_in,
                refresh_token=auth_response.session.refresh_token
                if auth_response.session
                else None,
            )

            user_profile = UserProfile(
                id=user_id,
                email=request.email,
                name=request.name,
                current_org_id=None,
                created_at=datetime.now(UTC),
            )

            return auth_token, user_profile

        except Exception as e:
            logger.error(f"Registration failed: {e}")
            raise ValueError(f"Registration failed: {e!s}")

    async def login(self, request: LoginRequest) -> tuple[AuthToken, UserProfile]:
        """Login user with email and password.

        :param request: Login request data.
        :return: Tuple of (auth token, user profile).
        :raises ValueError: If login fails.
        """
        try:
            # Step 1: Authenticate with Supabase Auth
            auth_response = self.supabase.auth.sign_in_with_password(
                {"email": request.email, "password": request.password}
            )

            if not auth_response.user:
                raise ValueError("Invalid email or password")

            user_id = auth_response.user.id

            # Step 2: Fetch user profile
            user_response = (
                self.supabase.table("users").select("*").eq("id", user_id).execute()
            )

            if not user_response.data:
                raise ValueError("User profile not found")

            user_data = user_response.data[0]

            # Step 3: Generate tokens
            access_token = self._create_access_token(user_id, request.email)
            expires_in = self.settings.jwt_access_token_expire_minutes * 60

            auth_token = AuthToken(
                access_token=access_token,
                token_type="bearer",
                expires_in=expires_in,
                refresh_token=auth_response.session.refresh_token
                if auth_response.session
                else None,
            )

            user_profile = UserProfile(
                id=user_id,
                email=user_data["email"],
                name=user_data["name"],
                current_org_id=user_data.get("current_org_id"),
                created_at=user_data["created_at"],
            )

            return auth_token, user_profile

        except Exception as e:
            logger.error(f"Login failed: {e}")
            raise ValueError(f"Login failed: {e!s}")

    async def request_password_reset(self, request: PasswordResetRequest) -> None:
        """Send password reset email.

        :param request: Password reset request.
        :raises ValueError: If request fails.
        """
        try:
            self.supabase.auth.reset_password_email(request.email)
        except Exception as e:
            logger.error(f"Password reset request failed: {e}")
            raise ValueError(f"Password reset request failed: {e!s}")

    async def get_current_user(self, user_id: str) -> CurrentUser:
        """Get current user with organization context.

        :param user_id: User UUID.
        :return: Current user information.
        :raises ValueError: If user not found.
        """
        try:
            # Fetch user profile
            user_response = (
                self.supabase.table("users").select("*").eq("id", user_id).execute()
            )

            if not user_response.data:
                raise ValueError("User not found")

            user_data = user_response.data[0]

            # Fetch organization membership if user has current_org_id
            org_role = None
            is_admin = False

            if user_data.get("current_org_id"):
                member_response = (
                    self.supabase.table("org_members")
                    .select("role")
                    .eq("org_id", user_data["current_org_id"])
                    .eq("user_id", user_id)
                    .execute()
                )

                if member_response.data:
                    org_role = member_response.data[0]["role"]
                    # Admin: creator or admin role (not pending or interviewer)
                    is_admin = org_role in ["creator", "admin"]

            return CurrentUser(
                user_id=user_id,
                email=user_data["email"],
                name=user_data["name"],
                org_id=user_data.get("current_org_id"),
                org_role=org_role,
                is_admin=is_admin,
            )

        except Exception as e:
            logger.error(f"Failed to get current user: {e}")
            raise ValueError(f"Failed to get current user: {e!s}")

    def verify_token(self, token: str) -> dict:
        """Verify JWT token and extract payload.

        :param token: JWT token string.
        :return: Decoded token payload.
        :raises ValueError: If token is invalid or expired.
        """
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith("Bearer "):
                token = token[7:]

            # Decode and verify token
            payload = jwt.decode(
                token,
                self.settings.supabase_jwt_secret,
                algorithms=[self.settings.jwt_algorithm],
                options={"verify_exp": True},
            )

            return payload

        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError as e:
            raise ValueError(f"Invalid token: {e!s}")

    def _create_access_token(self, user_id: str, email: str) -> str:
        """Create JWT access token.

        :param user_id: User UUID.
        :param email: User email.
        :return: Encoded JWT token.
        """
        now = datetime.now(UTC)
        expires_delta = timedelta(minutes=self.settings.jwt_access_token_expire_minutes)

        payload = {
            "sub": user_id,
            "email": email,
            "iat": now,
            "exp": now + expires_delta,
            "iss": "supabase",
        }

        token = jwt.encode(
            payload,
            self.settings.supabase_jwt_secret,
            algorithm=self.settings.jwt_algorithm,
        )

        return token
