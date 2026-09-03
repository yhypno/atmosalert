"""Interfaces that decouple serving from a concrete ML framework."""

from typing import Protocol

from atmosalert.api.schemas import NowcastRequest


class ModelNotReadyError(RuntimeError):
    """Raised when inference is requested without a loaded trained model."""


class NowcastModel(Protocol):
    """Contract implemented by trained multi-task inference adapters."""

    @property
    def ready(self) -> bool:
        """Whether the model can currently serve predictions."""

    def predict(self, request: NowcastRequest) -> dict[str, object]:
        """Generate event probabilities for the requested region and horizons."""


class UnavailableNowcastModel:
    """Safe placeholder used until a trained artifact is connected."""

    @property
    def ready(self) -> bool:
        return False

    def predict(self, request: NowcastRequest) -> dict[str, object]:
        del request
        raise ModelNotReadyError("No trained nowcasting model is configured")
