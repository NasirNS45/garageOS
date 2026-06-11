from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.customers import router as customers_router
from app.api.v1.endpoints.job_cards import router as job_cards_router
from app.api.v1.endpoints.job_parts import router as job_parts_router
from app.api.v1.endpoints.part_catalog import router as part_catalog_router
from app.api.v1.endpoints.service_presets import router as service_presets_router
from app.api.v1.endpoints.settings import router as settings_router
from app.api.v1.endpoints.summary import router as summary_router

v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(auth_router)
v1_router.include_router(job_cards_router)
v1_router.include_router(job_parts_router)
v1_router.include_router(customers_router)
v1_router.include_router(summary_router)
v1_router.include_router(settings_router)
v1_router.include_router(service_presets_router)
v1_router.include_router(part_catalog_router)
