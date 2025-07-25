# app/api/routes/__init__.py
from fastapi import APIRouter

# Create main router
router = APIRouter()

# Import and include routers one by one to catch errors
try:
    from app.api.routes.meal import router as meal_router
    router.include_router(meal_router, prefix="/meal", tags=["meal"])
    print("✅ Meal router loaded successfully")
except Exception as e:
    print(f"❌ Error loading meal router: {e}")

try:
    from app.api.routes.customization import router as customization_router
    router.include_router(customization_router, prefix="/customization", tags=["customization"])
    print("✅ Customization router loaded successfully")
except Exception as e:
    print(f"❌ Error loading customization router: {e}")

try:
    from app.api.routes.agent import router as agent_router
    router.include_router(agent_router, prefix="/agent", tags=["agent"])
    print("✅ Agent router loaded successfully")
except Exception as e:
    print(f"❌ Error loading agent router: {e}")

try:
    from app.api.routes.nutrition import router as nutrition_router
    router.include_router(nutrition_router, prefix="/nutrition", tags=["nutrition"])
    print("✅ Nutrition router loaded successfully")
except Exception as e:
    print(f"❌ Error loading nutrition router: {e}")

__all__ = ["router"]










# # app/api/routes/__init__.py
# from fastapi import APIRouter
# from app.api.routes.nutrition import router as nutrition_router
# from app.api.routes.meal import router as meal_router
# from app.api.routes.agent import router as agent_router
# from app.api.routes.customization import router as customization_router

# # Create main router
# router = APIRouter()

# # Include sub-routers
# router.include_router(nutrition_router, prefix="/nutrition", tags=["nutrition"])
# router.include_router(meal_router, prefix="/meal", tags=["meal"])
# router.include_router(agent_router, prefix="/agent", tags=["agent"])
# router.include_router(customization_router, prefix="/customization", tags=["customization"])

# __all__ = ["router"]