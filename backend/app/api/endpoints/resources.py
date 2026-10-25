from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.resource import Resource, ResourceAllocation
from app.models.incident import Incident
from app.schemas.resource import ResourceCreate, ResourceResponse, ResourceAllocationCreate, AllocationResponse

router = APIRouter()

@router.get("/", response_model=List[ResourceResponse])
def get_resources(
    db: Session = Depends(get_db),
    category: Optional[str] = None,
    depot_name: Optional[str] = None,
    low_stock_only: bool = False,
):
    query = db.query(Resource)
    if category and isinstance(category, str):
        query = query.filter(Resource.category == category)
    if depot_name and isinstance(depot_name, str):
        query = query.filter(Resource.depot_name == depot_name)

    items = query.order_by(Resource.depot_name, Resource.name).all()
    results = []
    for r in items:
        avail = max(0, r.total_quantity - r.allocated_quantity)
        is_low = avail <= r.min_threshold
        if low_stock_only and not is_low:
            continue
        
        res_dict = {
            "id": r.id,
            "name": r.name,
            "category": r.category,
            "unit": r.unit,
            "total_quantity": r.total_quantity,
            "allocated_quantity": r.allocated_quantity,
            "available_quantity": avail,
            "min_threshold": r.min_threshold,
            "depot_name": r.depot_name,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "is_demo": r.is_demo,
            "is_low_stock": is_low,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        }
        results.append(ResourceResponse(**res_dict))
    return results

@router.post("/", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def create_resource(
    res_in: ResourceCreate,
    db: Session = Depends(get_db)
):
    res = Resource(
        name=res_in.name,
        category=res_in.category,
        unit=res_in.unit,
        total_quantity=res_in.total_quantity,
        allocated_quantity=0,
        available_quantity=res_in.total_quantity,
        min_threshold=res_in.min_threshold,
        depot_name=res_in.depot_name,
        latitude=res_in.latitude,
        longitude=res_in.longitude,
        is_demo=res_in.is_demo,
    )
    db.add(res)
    db.commit()
    db.refresh(res)
    return ResourceResponse(
        **{
            "id": res.id,
            "name": res.name,
            "category": res.category,
            "unit": res.unit,
            "total_quantity": res.total_quantity,
            "allocated_quantity": res.allocated_quantity,
            "available_quantity": res.available_quantity,
            "min_threshold": res.min_threshold,
            "depot_name": res.depot_name,
            "latitude": res.latitude,
            "longitude": res.longitude,
            "is_demo": res.is_demo,
            "is_low_stock": res.available_quantity <= res.min_threshold,
            "created_at": res.created_at,
            "updated_at": res.updated_at,
        }
    )

@router.post("/allocate", response_model=AllocationResponse, status_code=status.HTTP_201_CREATED)
def allocate_resource(
    alloc_in: ResourceAllocationCreate,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == alloc_in.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Target incident #{alloc_in.incident_id} not found")

    resource = db.query(Resource).filter(Resource.id == alloc_in.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail=f"Relief resource #{alloc_in.resource_id} not found")

    current_avail = resource.total_quantity - resource.allocated_quantity
    if alloc_in.quantity <= 0:
        raise HTTPException(status_code=400, detail="Allocation quantity must be greater than zero")

    if alloc_in.quantity > current_avail:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient stock for '{resource.name}'. Requested: {alloc_in.quantity} {resource.unit}, "
                f"Available: {current_avail} {resource.unit}."
            )
        )

    resource.allocated_quantity += alloc_in.quantity
    resource.available_quantity = resource.total_quantity - resource.allocated_quantity

    allocation = ResourceAllocation(
        incident_id=alloc_in.incident_id,
        resource_id=alloc_in.resource_id,
        quantity=alloc_in.quantity,
        notes=alloc_in.notes or f"Allocated to {incident.title}",
        status="Allocated",
    )
    db.add(allocation)
    db.commit()
    db.refresh(allocation)
    return allocation

@router.get("/allocations")
def get_allocations(
    incident_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(ResourceAllocation)
    if incident_id and isinstance(incident_id, int):
        query = query.filter(ResourceAllocation.incident_id == incident_id)

    allocs = query.order_by(ResourceAllocation.allocated_at.desc()).limit(limit).all()
    results = []
    for a in allocs:
        inc = db.query(Incident).filter(Incident.id == a.incident_id).first()
        res = db.query(Resource).filter(Resource.id == a.resource_id).first()
        results.append({
            "id": a.id,
            "incident_id": a.incident_id,
            "incident_title": inc.title if inc else "Unknown Incident",
            "resource_id": a.resource_id,
            "resource_name": res.name if res else "Unknown Resource",
            "resource_unit": res.unit if res else "units",
            "depot_name": res.depot_name if res else "Unknown Depot",
            "quantity": a.quantity,
            "notes": a.notes,
            "status": a.status,
            "allocated_at": a.allocated_at,
        })
    return results
