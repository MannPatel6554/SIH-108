"""
Enterprise Security, JWT Authentication & Role-Based Access Control (RBAC)
Designed for Government Procurement Compliance (BIS SmartSpec AI)
"""
import os
import json
import base64
import hmac
import hashlib
import time
from typing import Optional, Dict, Any, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

# Secret key for signing tokens
JWT_SECRET = os.environ.get("JWT_SECRET", "bis_smartspec_sih2026_secure_procurement_key_987654321")
TOKEN_EXPIRE_SECONDS = 60 * 60 * 24  # 24 hours

security_scheme = HTTPBearer(auto_error=False)


# ─────────────────────────────────────────────────────────────────────────────
# Password Hashing using PBKDF2-HMAC-SHA256 (Standard Library, Zero C-Deps)
# ─────────────────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash password using salt + PBKDF2-HMAC-SHA256."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"{salt.hex()}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored salt$hash string."""
    try:
        salt_hex, key_hex = hashed_password.split("$")
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)
        key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100_000)
        return hmac.compare_digest(key, expected_key)
    except Exception:
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Lightweight, Robust JWT implementation (HMAC-SHA256)
# ─────────────────────────────────────────────────────────────────────────────

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[int] = None) -> str:
    """Create signed HMAC-SHA256 JWT."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    now = int(time.time())
    payload["iat"] = now
    payload["exp"] = now + (expires_delta or TOKEN_EXPIRE_SECONDS)

    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))

    signature = hmac.new(
        JWT_SECRET.encode("utf-8"),
        f"{header_b64}.{payload_b64}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    sig_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts

        # Verify signature
        expected_sig = hmac.new(
            JWT_SECRET.encode("utf-8"),
            f"{header_b64}.{payload_b64}".encode("utf-8"),
            hashlib.sha256,
        ).digest()

        if not hmac.compare_digest(_base64url_encode(expected_sig), sig_b64):
            return None

        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        if payload.get("exp", 0) < int(time.time()):
            return None  # Expired

        return payload
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Role-Based Access Control (RBAC) Dependency
# ─────────────────────────────────────────────────────────────────────────────

class CurrentUser(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    department: Optional[str] = None
    organization: Optional[str] = None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> CurrentUser:
    """Extract and validate current user from Bearer token."""
    if not credentials or not credentials.credentials:
        # For Hackathon demo convenience, return default Procurement Officer if unauthenticated
        return CurrentUser(
            id="demo-user-officer",
            email="officer@gem.gov.in",
            full_name="Rajesh Kumar (Demo Procurement Officer)",
            role="PROCUREMENT_OFFICER",
            department="CPWD / Central Public Procurement",
            organization="Ministry of Housing and Urban Affairs",
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return CurrentUser(
        id=payload.get("sub", ""),
        email=payload.get("email", ""),
        full_name=payload.get("full_name", ""),
        role=payload.get("role", "PROCUREMENT_OFFICER"),
        department=payload.get("department"),
        organization=payload.get("organization"),
    )


def require_role(allowed_roles: List[str]):
    """Enforce role-based access control on endpoints."""
    async def role_checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires one of {allowed_roles}, but current role is {user.role}",
            )
        return user
    return role_checker
