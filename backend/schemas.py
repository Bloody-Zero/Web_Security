from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)  # ← Ограничение 72 символа

    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Пароль не должен превышать 72 байта')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Пароль должен содержать хотя бы одну заглавную букву')
        if not re.search(r'[a-z]', v):
            raise ValueError('Пароль должен содержать хотя бы одну строчную букву')
        if not re.search(r'\d', v):
            raise ValueError('Пароль должен содержать хотя бы одну цифру')
        return v


class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    reputation: int
    league: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChoiceResponse(BaseModel):
    id: int
    choice_text: str
    sort_order: int

    class Config:
        from_attributes = True

class ScenarioResponse(BaseModel):
    id: int
    title: str
    location: str
    level: int
    attack_type: str
    description: str
    narrative: str
    cwe_reference: str
    owasp_reference: str
    hint: str
    choices: List[ChoiceResponse] = []

    class Config:
        from_attributes = True

class ActionRequest(BaseModel):
    scenario_id: int
    choice_id: int

class ActionResponse(BaseModel):
    is_correct: bool
    feedback: str
    consequence_animation: str
    reputation_change: int
    scenario_completed: bool
    cwe_info: Optional[str] = None
    owasp_info: Optional[str] = None
    protection_steps: Optional[List[str]] = None

class StatsResponse(BaseModel):
    total_scenarios: int
    completed_scenarios: int
    success_rate: float
    total_attempts: int
    current_reputation: int
    league: str
    league_progress: float
    scenario_results: List[dict] = []

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse