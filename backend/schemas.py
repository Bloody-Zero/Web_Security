from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_-]+$')
    email: EmailStr
    password: str = Field(..., min_length=8)  # ← Явно указываем 8

    @field_validator('password')
    @classmethod
    def password_must_be_strong(cls, v):
        if len(v) < 8:
            raise ValueError('Пароль должен содержать минимум 8 символов')
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