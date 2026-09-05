"""Prediction entry point. No trained model is available yet."""


class ModelUnavailableError(RuntimeError):
    """Raised when a forecast cannot be produced without a trained model."""


def is_ready() -> bool:
    return False


def predict(options: dict[str, object]) -> dict[str, object]:
    """Accept region, issue time, horizons, and events as plain Python values.

    Add data preparation and inference here when the model is implemented.
    Keep API-specific types and HTTP responses in the backend.
    """

    raise ModelUnavailableError("No trained nowcasting model is configured")
