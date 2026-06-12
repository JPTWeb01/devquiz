import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.user import Role, User
from app.schemas.user import TokenOut, UserLogin, UserOut, UserRegister

GUEST_EMAIL = "guest@devquiz.local"

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
@limiter.limit("20/minute")
def login(request: Request, data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/guest", response_model=TokenOut)
@limiter.limit("30/minute")
def guest_login(request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == GUEST_EMAIL).first()
    if not user:
        user = User(
            email=GUEST_EMAIL,
            name="Guest",
            password_hash=hash_password(str(uuid.uuid4())),
            role=Role.STUDENT,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(
        {"sub": user.id, "role": user.role.value},
        expires_delta=timedelta(hours=24),
    )
    return TokenOut(access_token=token, user=UserOut.model_validate(user))
