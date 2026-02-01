from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.api.deps import DbSession, CurrentCustomer
from app.services.address_service import AddressService
from app.utils.response_utils import success_response

router = APIRouter()


@router.get(
    "",
    response_class=JSONResponse,
    summary="Get Customer Addresses",
    description="Retrieve all addresses for the authenticated customer"
)
async def get_addresses(
    current_customer: CurrentCustomer,
    db: DbSession
):
    """
    Get all addresses for the current customer.

    Returns a list of saved shipping addresses.
    Requires authentication.
    """
    service = AddressService(db)
    result = await service.get_addresses(current_customer)
    return success_response(
        message="Addresses retrieved successfully",
        data=result
    )


@router.get(
    "/{address_id}",
    response_class=JSONResponse,
    summary="Get Address by ID",
    description="Retrieve a specific address by its ID"
)
async def get_address(
    address_id: str,
    current_customer: CurrentCustomer,
    db: DbSession
):
    """
    Get a specific address by ID.

    - **address_id**: The address unique identifier

    Requires authentication.
    """
    service = AddressService(db)
    result = await service.get_address_by_id(
        customer=current_customer,
        address_id=address_id
    )
    return success_response(
        message="Address retrieved successfully",
        data=result
    )
