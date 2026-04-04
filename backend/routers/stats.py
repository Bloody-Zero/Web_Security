from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.database import get_db
from backend.models import User, UserProgress, UserAction
from backend.schemas import StatsResponse
from backend.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/", response_model=StatsResponse)
async def get_stats(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    # Получаем прогресс
    progress_result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == current_user.id)
    )
    progress_list = progress_result.scalars().all()

    completed = sum(1 for p in progress_list if p.is_completed)
    total_attempts = sum(p.attempts for p in progress_list)

    # Собираем результаты по сценариям
    scenario_results = []
    for p in progress_list:
        scenario_result = await db.execute(
            select(UserAction).where(
                UserAction.user_id == current_user.id,
                UserAction.scenario_id == p.scenario_id
            ).order_by(UserAction.action_timestamp.desc())
        )
        actions = scenario_result.scalars().all()

        scenario_result = await db.execute(
            select(UserProgress.scenario_id).where(UserProgress.id == p.id)
        )

        # Получаем детали сценария
        scenario_detail = await db.execute(
            select(
                UserProgress.scenario_id,
                UserProgress.is_completed,
                UserProgress.attempts,
                UserProgress.score
            ).where(UserProgress.id == p.id)
        )
        row = scenario_detail.first()

        # Получаем название сценария
        scenario_name_result = await db.execute(
            select(UserProgress.scenario_id).where(UserProgress.id == p.id)
        )

        scenario_results.append({
            "scenario_id": p.scenario_id,
            "is_completed": p.is_completed,
            "attempts": p.attempts,
            "score": p.score
        })

    # Статистика действий
    actions_result = await db.execute(
        select(func.count()).where(
            UserAction.user_id == current_user.id,
            UserAction.is_correct == True
        )
    )
    correct_actions = actions_result.scalar() or 0

    total_actions_result = await db.execute(
        select(func.count()).where(UserAction.user_id == current_user.id)
    )
    total_actions = total_actions_result.scalar() or 0

    success_rate = (correct_actions / total_actions * 100) if total_actions > 0 else 0

    # Прогресс лиги
    rep = current_user.reputation
    if rep >= 2000:
        league_progress = 1.0
    elif rep >= 1500:
        league_progress = (rep - 1500) / 500
    elif rep >= 1000:
        league_progress = (rep - 1000) / 500
    elif rep >= 600:
        league_progress = (rep - 600) / 400
    elif rep >= 300:
        league_progress = (rep - 300) / 300
    else:
        league_progress = rep / 300

    return StatsResponse(
        total_scenarios=len(progress_list),
        completed_scenarios=completed,
        success_rate=round(success_rate, 1),
        total_attempts=total_attempts,
        current_reputation=current_user.reputation,
        league=current_user.league,
        league_progress=round(min(league_progress, 1.0), 2),
        scenario_results=scenario_results
    )