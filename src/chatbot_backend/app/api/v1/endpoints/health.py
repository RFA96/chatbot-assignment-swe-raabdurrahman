from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.utils.response_utils import success_response

router = APIRouter()


@router.get("", response_class=JSONResponse)
async def health_check():
    """Health check endpoint."""
    return success_response(
        message="Service is healthy",
        data={
            "app_name": settings.APP_NAME,
            "version": settings.APP_VERSION
        }
    )
