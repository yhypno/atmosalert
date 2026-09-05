"""AtmosAlert API. Run with: uv run uvicorn backend.app:app --reload."""

import os
from datetime import UTC, datetime
from enum import StrEnum

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, model_validator

from model import predict as nowcast_model

VERSION = "0.1.0"


class EventType(StrEnum):
    SEVERE_THUNDERSTORM = "severe_thunderstorm"
    CLOUDBURST = "cloudburst"
    FLASH_FLOOD = "flash_flood"


class BoundingBox(BaseModel):
    """A region in longitude/latitude coordinates."""

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
    region: BoundingBox
    issue_time: datetime = Field(default_factory=lambda: datetime.now(UTC))
    horizons_hours: list[int] = Field(default_factory=lambda: [2, 4, 6], min_length=1)
    event_types: list[EventType] = Field(
        default_factory=lambda: list(EventType), min_length=1
    )


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    model_ready: bool


app = FastAPI(
    title="AtmosAlert API",
    version=VERSION,
    description="Prototype API for hyper-local severe-weather nowcasting.",
)


@app.get("/v1/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="atmosalert-api",
        version=VERSION,
        environment=os.getenv("ATMOSALERT_ENVIRONMENT", "development"),
        model_ready=nowcast_model.is_ready(),
    )


@app.post("/v1/nowcasts", tags=["nowcasts"])
def create_nowcast(request: NowcastRequest) -> dict[str, object]:
    """Pass validated forecast options to the model."""

    try:
        return nowcast_model.predict(request.model_dump())
    except nowcast_model.ModelUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
