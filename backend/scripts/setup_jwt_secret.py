#!/usr/bin/env python3
"""
Helper script to add SUPABASE_JWT_SECRET to .env file.

This script guides the user through obtaining the JWT secret from Supabase Dashboard
and automatically adds it to the .env file.

Usage:
    uv run python scripts/setup_jwt_secret.py
"""

import os
import sys
from pathlib import Path


def main() -> int:
    """Guide user to configure JWT secret."""
    print("\n" + "=" * 70)
    print("  Supabase JWT Secret Configuration Helper")
    print("=" * 70 + "\n")

    # Check if .env file exists
    env_file = Path(__file__).parent.parent / ".env"
    if not env_file.exists():
        print(f"❌ Error: .env file not found at {env_file}")
        print("Please create a .env file from .env.example first:")
        print("  cp .env.example .env")
        return 1

    # Check if JWT secret already exists
    env_content = env_file.read_text()
    if "SUPABASE_JWT_SECRET=" in env_content and not env_content.count(
        "SUPABASE_JWT_SECRET=your-jwt-secret-here"
    ):
        print("✅ SUPABASE_JWT_SECRET is already configured in .env file")
        return 0

    print("📋 Steps to get your Supabase JWT Secret:")
    print()
    print("1. Open your Supabase project dashboard:")
    print("   https://app.supabase.com/project/vgqhnqcfsonurqgxesni")
    print()
    print("2. Navigate to: Project Settings → API")
    print()
    print("3. Scroll down to 'JWT Settings' section")
    print()
    print("4. Copy the 'JWT Secret' value")
    print()
    print("=" * 70)
    print()

    # Get JWT secret from user
    jwt_secret = input(
        "Paste your JWT Secret here (or press Ctrl+C to cancel): "
    ).strip()

    if not jwt_secret:
        print("\n❌ JWT Secret cannot be empty")
        return 1

    if jwt_secret == "your-jwt-secret-here":
        print("\n❌ Please use the actual JWT Secret from your Supabase dashboard")
        return 1

    # Add or update JWT secret in .env file
    lines = env_content.splitlines()
    jwt_line = f"SUPABASE_JWT_SECRET={jwt_secret}"

    # Check if SUPABASE_JWT_SECRET line exists
    jwt_secret_index = None
    for i, line in enumerate(lines):
        if line.startswith("SUPABASE_JWT_SECRET="):
            jwt_secret_index = i
            break

    if jwt_secret_index is not None:
        # Update existing line
        lines[jwt_secret_index] = jwt_line
    else:
        # Add after SUPABASE_SERVICE_ROLE_KEY
        service_key_index = None
        for i, line in enumerate(lines):
            if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                service_key_index = i
                break

        if service_key_index is not None:
            lines.insert(service_key_index + 1, jwt_line)
        else:
            # Add to end of file
            lines.append(jwt_line)

    # Write back to .env file
    env_file.write_text("\n".join(lines) + "\n")

    print("\n✅ JWT Secret successfully added to .env file!")
    print("\nYou can now start the server with:")
    print("  uv run python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
    print()

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
