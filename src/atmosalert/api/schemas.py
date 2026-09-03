"""Public API request and response schemas."""

from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel, Field, model_validator


class EventType(StrEnum):
    """Extreme-weather events emitted by the planned model heads."""

    SEVERE_THUNDERSTORM = "severe_thunderstorm"
    CLOUDBURST = "cloudburst"
    FLASH_FLOOD = "flash_flood"


class BoundingBox(BaseModel):
    """A WGS84 region of interest."""

    west: float = Field(ge=-180, le=180)
    south: float = Field(ge=-90, le=90)
    east: float = Field(ge=-180, le=180)
    north: float = Field(ge=-90, le=90)

    @model_validator(mode="after")
    def validate_bounds(self) -> "BoundingBox":
        if self.west >= self.east:
            raise ValueError("west must be less than east")
        if self.south >= self.north:
            raise ValueError("south must be less than north")
        return self


class NowcastRequest(BaseModel):
    """Request for risk maps over a bounded region."""

    region: BoundingBox
    issue_time: datetime = Field(default_factory=lambda: datetime.now(UTC))
    horizons_hours: list[int] = Field(default_factory=lambda: [2, 4, 6], min_length=1)
    event_types: list[EventType] = Field(
        default_factory=lambda: list(EventType), min_length=1
    )


class HealthResponse(BaseModel):
    """Basic liveness response."""

    status: str
    service: str
    version: str
    environment: str
    model_ready: bool
