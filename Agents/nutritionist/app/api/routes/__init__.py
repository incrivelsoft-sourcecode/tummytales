# app/api/routes/__init__.py
from fastapi import APIRouter
from app.api.routes.nutrition import router as nutrition_router
from app.api.routes.meal import router as meal_router
from app.api.routes.agent import router as agent_router
from app.api.routes.customization import router as customization_router

# Create main router
router = APIRouter()

# Include sub-routers
router.include_router(nutrition_router, prefix="/nutrition", tags=["nutrition"])
router.include_router(meal_router, prefix="/meal", tags=["meal"])
router.include_router(agent_router, prefix="/agent", tags=["agent"])
router.include_router(customization_router, prefix="/customization", tags=["customization"])

__all__ = ["router"]