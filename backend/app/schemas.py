from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class PredictionInput(BaseModel):
    area: str = Field(..., min_length=2, max_length=100, description="Country/Region")
    item: str = Field(..., min_length=2, max_length=100, description="Crop item")
    year: int = Field(..., ge=1990, le=2100)
    average_rain_fall_mm_per_year: float = Field(..., ge=0, le=10000)
    pesticides_tonnes: float = Field(..., ge=0, le=1000000)
    avg_temp: float = Field(..., ge=-30, le=60)
    farm_area_hectares: float = Field(default=1.0, gt=0, le=100000)

    @field_validator("area", "item", mode="before")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        if not isinstance(value, str):
            raise TypeError("Expected text value")
        clean = " ".join(value.strip().split())
        if not clean:
            raise ValueError("Value cannot be blank")
        return clean


class PredictionResponse(BaseModel):
    predicted_yield_hg_ha: float
    predicted_yield_t_ha: float
    risk_level: Literal["Low", "Medium", "High"]
    warnings: list[str]
    expected_production_tons: float
    food_security_level: Literal["Secure", "Watch", "Critical"]
    food_security_notes: list[str]
    planting_schedule: dict[str, str | list[str]]
    advisory: str


class HistoryItem(BaseModel):
    area: str
    item: str
    year: int
    predicted_yield_hg_ha: float
    predicted_yield_t_ha: float
    risk_level: Literal["Low", "Medium", "High"]
    created_at: datetime


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    db_ready: bool
