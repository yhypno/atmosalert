"""FastAPI application factory."""

from fastapi import FastAPI, HTTPException, status

from atmosalert import __version__
from atmosalert.api.schemas import HealthResponse, NowcastRequest
from atmosalert.core.settings import get_settings
from atmosalert.models.base import ModelNotReadyError, UnavailableNowcastModel

settings = get_settings()
model = UnavailableNowcastModel()

app = FastAPI(
    title="AtmosAlert API",
    version=__version__,
    description="Prototype API for hyper-local severe-weather nowcasting.",
)


@app.get("/v1/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    """Return service liveness and model readiness."""

    return HealthResponse(
        status="ok",
        service="atmosalert-api",
        version=__version__,
        environment=settings.environment,
        model_ready=model.ready,
    )


@app.post("/v1/nowcasts", tags=["nowcasts"])
def create_nowcast(request: NowcastRequest) -> dict[str, object]:
    """Create a nowcast when a trained inference adapter is configured."""

    try:
        return model.predict(request)
    except ModelNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
