from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    reputation = Column(Integer, default=500)
    league = Column(String(20), default="Новичок")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Scenario(Base):
    __tablename__ = "scenarios"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    location = Column(String(50), nullable=False)
    level = Column(Integer, nullable=False)
    attack_type = Column(String(50), nullable=False)
    description = Column(Text)
    narrative = Column(Text)
    cwe_reference = Column(String(50))
    owasp_reference = Column(String(50))
    hint = Column(Text)

class ScenarioChoice(Base):
    __tablename__ = "scenario_choices"
    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id", ondelete="CASCADE"))
    choice_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    feedback_correct = Column(Text)
    feedback_wrong = Column(Text)
    consequence_animation = Column(String(100))
    sort_order = Column(Integer, default=0)

class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    scenario_id = Column(Integer, ForeignKey("scenarios.id", ondelete="CASCADE"))
    is_completed = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    score = Column(Integer, default=0)
    last_attempt = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint('user_id', 'scenario_id'),)

class UserAction(Base):
    __tablename__ = "user_actions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    scenario_id = Column(Integer, ForeignKey("scenarios.id", ondelete="CASCADE"))
    choice_id = Column(Integer, ForeignKey("scenario_choices.id", ondelete="SET NULL"))
    is_correct = Column(Boolean)
    action_timestamp = Column(DateTime(timezone=True), server_default=func.now())