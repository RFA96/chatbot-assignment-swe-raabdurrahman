from typing import Any, Optional, Dict
from fastapi.responses import JSONResponse
from datetime import datetime, date
import json


class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle datetime objects."""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


def serialize_data(data: Any) -> Any:
    """Serialize data with custom JSON encoder to handle datetime objects."""
    if data is None:
        return None
    # Convert to JSON string and back to dict to handle datetime serialization
    return json.loads(json.dumps(data, cls=CustomJSONEncoder, default=str))


def success_response(
    message: str = "Success",
    data: Optional[Any] = None,
    status_code: int = 200
) -> JSONResponse:
    """
    General form of a successful response.
    Example 200:
    {
        "status": "success",
        "status_code": 200,
        "message": "Data has been successfully retrieved!",
        "data": [...]
    }
    Note: the 'data' key only appears if provided.
    """
    payload: Dict[str, Any] = {
        "status": "success",
        "status_code": status_code,
        "message": message,
    }
    if data is not None:
        payload["data"] = serialize_data(data)
    return JSONResponse(content=payload, status_code=status_code)


def error_response(
    message: str,
    status_code: int = 400,
    errors: Optional[Any] = None
) -> JSONResponse:
    """
    General form of error response.
    Example 400:
    {
        "status": "error",
        "status_code": 400,
        "message": "Bad request",
        "errors": {...}
    }
    Note: the 'errors' key only appears if provided.
    """
    payload: Dict[str, Any] = {
        "status": "error",
        "status_code": status_code,
        "message": message,
    }
    if errors is not None:
        payload["errors"] = serialize_data(errors)
    return JSONResponse(content=payload, status_code=status_code)
