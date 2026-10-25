import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)  # Medical, Water, Food, Shelter, Rescue Equipment
    unit = Column(String(50), nullable=False)      # kits, liters, cases, packs, units
    total_quantity = Column(Integer, nullable=False, default=0)
    allocated_quantity = Column(Integer, nullable=False, default=0)
    available_quantity = Column(Integer, nullable=False, default=0)
    min_threshold = Column(Integer, nullable=False, default=10)
    
    # Depot Location
    depot_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    allocations = relationship("ResourceAllocation", back_populates="resource", cascade="all, delete-orphan")


class ResourceAllocation(Base):
    __tablename__ = "resource_allocations"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="Allocated", nullable=False)  # Allocated, Dispatched, Delivered, Returned
    allocated_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    resource = relationship("Resource", back_populates="allocations")
