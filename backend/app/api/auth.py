"""
Authentication & Role-Based Access Control Endpoints
Enables multi-role access for Procurement Officers, Technical Reviewers, BIS Admins, and MSMEs.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from app.models.session import get_db
from app.models.database import User
from app.core.security import (
    hash_password, verify_password, create_access_token,
    get_current_user, CurrentUser, require_role
)

router = APIRouter(prefix="/auth", tags=["auth"])


# ─────────────────────────────────────────────────────────────────────────────
# Request / Response Models
# ─────────────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "PROCUREMENT_OFFICER"
    department: Optional[str] = "GeM Buyer Department"
    organization: Optional[str] = "Central Government Procurement"


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: CurrentUser


# ─────────────────────────────────────────────────────────────────────────────
# Seeded Demo Accounts (One-click demo for SIH Judges)
# ─────────────────────────────────────────────────────────────────────────────

DEMO_ACCOUNTS = [
    {
        "role": "PROCUREMENT_OFFICER",
        "title": "Procurement Officer / Buyer",
        "email": "officer@gem.gov.in",
        "password": "officer@sih2026",
        "full_name": "Rajesh Kumar (Procurement Officer)",
        "department": "CPWD / Central Public Works",
        "organization": "Ministry of Housing and Urban Affairs",
        "permissions": ["Search Standards", "Upload Tenders", "Generate Checklists", "Export PDF/Excel"],
    },
    {
        "role": "TECHNICAL_EXPERT",
        "title": "Technical Evaluation Committee",
        "email": "expert@bis.gov.in",
        "password": "expert@sih2026",
        "full_name": "Dr. Ananya Sen (Technical Reviewer)",
        "department": "Bureau of Indian Standards — Civil Engineering Division",
        "organization": "Department of Consumer Affairs",
        "permissions": ["Review Specifications", "Approve Test Methods", "Sign-off Deviations"],
    },
    {
        "role": "COMPLIANCE_ADMIN",
        "title": "BIS / Regulatory Admin",
        "email": "admin@bis.gov.in",
        "password": "admin@sih2026",
        "full_name": "Suresh Patel (BIS Gazette Admin)",
        "department": "Quality Control & Gazette Notification Cell",
        "organization": "Bureau of Indian Standards",
        "permissions": ["Ingest Standards", "Update Gazette QCOs", "Audit Provenance", "Manage Users"],
    },
    {
        "role": "BIDDER_MSME",
        "title": "MSME Vendor / Bidder",
        "email": "msme@vendor.in",
        "password": "msme@sih2026",
        "full_name": "Vikas Sharma (MSME Supplier)",
        "department": "Pipes & Fittings Manufacturing",
        "organization": "Small Enterprise Association",
        "permissions": ["MSME Plain-Language View", "Check CML/CRS License Requirements", "Self-Audit"],
    },
]


@router.get("/demo-accounts")
async def get_demo_accounts():
    """Return pre-configured demo credentials for the SIH live presentation."""
    return {"demo_accounts": DEMO_ACCOUNTS}


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email/password or demo accounts."""
    # 1. First check if it matches a built-in SIH demo account
    for demo in DEMO_ACCOUNTS:
        if req.email.lower() == demo["email"].lower() and req.password == demo["password"]:
            user_payload = {
                "sub": f"demo-{demo['role'].lower()}",
                "email": demo["email"],
                "full_name": demo["full_name"],
                "role": demo["role"],
                "department": demo["department"],
                "organization": demo["organization"],
            }
            token = create_access_token(user_payload)
            return AuthResponse(
                access_token=token,
                user=CurrentUser(**user_payload),
            )

    # 2. Check in database
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    user = result.scalars().first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_payload = {
        "sub": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "department": user.department,
        "organization": user.organization,
    }
    token = create_access_token(user_payload)
    return AuthResponse(
        access_token=token,
        user=CurrentUser(**user_payload),
    )


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user in the system."""
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    new_user = User(
        email=req.email.lower(),
        full_name=req.full_name,
        password_hash=hash_password(req.password),
        role=req.role.upper(),
        department=req.department,
        organization=req.organization,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    user_payload = {
        "sub": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role,
        "department": new_user.department,
        "organization": new_user.organization,
    }
    token = create_access_token(user_payload)
    return AuthResponse(
        access_token=token,
        user=CurrentUser(**user_payload),
    )


@router.get("/me", response_model=CurrentUser)
async def get_me(current_user: CurrentUser = Depends(get_current_user)):
    """Get profile of current authenticated user."""
    return current_user
