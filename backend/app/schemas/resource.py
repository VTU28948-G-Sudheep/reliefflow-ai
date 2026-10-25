import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class ResourceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    category: str = Field(..., description="Medical, Water, Food, Shelter, Rescue Equipment")
    unit: str = Field(..., description="kits, liters, packs, units, boats, etc.")
    total_quantity: int = Field(..., ge=0)
    min_threshold: int = Field(10, ge=0)
    depot_name: str = Field(..., min_length=2, max_length=150)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    is_demo: bool = False

class ResourceCreate(ResourceBase):
    pass

class ResourceAllocationBase(BaseModel):
    incident_id: int
    resource_id: int
    quantity: int = Field(..., gt=0, description="Quantity to allocate")
    notes: Optional[str] = None

class ResourceAllocationCreate(ResourceAllocationBase):
    pass

class AllocationResponse(ResourceAllocationBase):
    id: int
    status: str
    allocated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ResourceResponse(ResourceBase):
    id: int
    allocated_quantity: int
    available_quantity: int
    is_low_stock: bool = False
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
