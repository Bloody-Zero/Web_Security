from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database import get_db
from backend.models import User, Scenario, ScenarioChoice, UserProgress, UserAction
from backend.schemas import ScenarioResponse, ActionRequest, ActionResponse, ChoiceResponse
from backend.auth import get_current_user
from backend.scenarios_data import CWE_INFO, OWASP_INFO, PROTECTION_ALGORITHMS

router = APIRouter(prefix="/api/game", tags=["game"])


@router.get("/scenarios")
async def get_scenarios(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scenario).order_by(Scenario.level, Scenario.id))
    scenarios = result.scalars().all()

    result_data = []
    for s in scenarios:
        choices_result = await db.execute(
            select(ScenarioChoice)
            .where(ScenarioChoice.scenario_id == s.id)
            .order_by(ScenarioChoice.sort_order)
        )
        choices = choices_result.scalars().all()

        scenario_dict = ScenarioResponse.model_validate(s).model_dump()
        scenario_dict["choices"] = [
            {"id": c.id, "choice_text": c.choice_text, "sort_order": c.sort_order}
            for c in choices
        ]
        result_data.append(scenario_dict)

    return result_data


@router.get("/scenario/{scenario_id}")
async def get_scenario(scenario_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scenario).where(Scenario.id == scenario_id))
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="Сценарий не найден")

    choices_result = await db.execute(
        select(ScenarioChoice)
        .where(ScenarioChoice.scenario_id == scenario_id)
        .order_by(ScenarioChoice.sort_order)
    )
    choices = choices_result.scalars().all()

    scenario_dict = ScenarioResponse.model_validate(scenario).model_dump()
    scenario_dict["choices"] = [
        {"id": c.id, "choice_text": c.choice_text, "sort_order": c.sort_order}
        for c in choices
    ]
    return scenario_dict


@router.post("/action", response_model=ActionResponse)
async def submit_action(
        action: ActionRequest,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    # Проверяем выбор
    choice_result = await db.execute(
        select(ScenarioChoice).where(ScenarioChoice.id == action.choice_id)
    )
    choice = choice_result.scalar_one_or_none()
    if not choice:
        raise HTTPException(status_code=404, detail="Вариант не найден")

    scenario_result = await db.execute(
        select(Scenario).where(Scenario.id == action.scenario_id)
    )
    scenario = scenario_result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="Сценарий не найден")

    # Записываем действие
    user_action = UserAction(
        user_id=current_user.id,
        scenario_id=action.scenario_id,
        choice_id=action.choice_id,
        is_correct=choice.is_correct
    )
    db.add(user_action)

    # Обновляем прогресс
    progress_result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == current_user.id,
            UserProgress.scenario_id == action.scenario_id
        )
    )
    progress = progress_result.scalar_one_or_none()

    if not progress:
        progress = UserProgress(
            user_id=current_user.id,
            scenario_id=action.scenario_id,
            attempts=1,
            score=100 if choice.is_correct else 0,
            is_completed=choice.is_correct
        )
        db.add(progress)
    else:
        progress.attempts += 1
        if choice.is_correct and not progress.is_completed:
            progress.is_completed = True
            progress.score = max(progress.score, 100 - (progress.attempts - 1) * 20)

    # Расчёт репутации
    rep_change = 0
    if choice.is_correct:
        rep_change = 50 if not progress.is_completed else 10
    else:
        rep_change = -30

    current_user.reputation = max(0, current_user.reputation + rep_change)

    # Обновляем лигу
    if current_user.reputation >= 2000:
        current_user.league = "Легенда"
    elif current_user.reputation >= 1500:
        current_user.league = "Мастер"
    elif current_user.reputation >= 1000:
        current_user.league = "Эксперт"
    elif current_user.reputation >= 600:
        current_user.league = "Продвинутый"
    elif current_user.reputation >= 300:
        current_user.league = "Средний"
    else:
        current_user.league = "Новичок"

    await db.commit()

    # Формируем ответ
    feedback = choice.feedback_correct if choice.is_correct else choice.feedback_wrong
    cwe_info = CWE_INFO.get(scenario.cwe_reference, "")
    owasp_info = OWASP_INFO.get(scenario.owasp_reference, "")
    protection_steps = PROTECTION_ALGORITHMS.get(scenario.attack_type, [])

    return ActionResponse(
        is_correct=choice.is_correct,
        feedback=feedback,
        consequence_animation=choice.consequence_animation if not choice.is_correct else "",
        reputation_change=rep_change,
        scenario_completed=progress.is_completed,
        cwe_info=cwe_info,
        owasp_info=owasp_info,
        protection_steps=protection_steps
    )