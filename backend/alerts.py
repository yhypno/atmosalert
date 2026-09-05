"""Basic alert thresholds used by the backend."""

from dataclasses import dataclass
from enum import StrEnum


class AlertLevel(StrEnum):
    NONE = "none"
    WATCH = "watch"
    WARNING = "warning"
    EMERGENCY = "emergency"


@dataclass(frozen=True)
class AlertThresholds:
    watch: float = 0.55
    warning: float = 0.75
    emergency: float = 0.90

    def __post_init__(self) -> None:
        if not 0 <= self.watch < self.warning < self.emergency <= 1:
            raise ValueError("thresholds must increase from 0 to 1")


DEFAULT_THRESHOLDS = AlertThresholds()


def classify_probability(
    probability: float,
    thresholds: AlertThresholds = DEFAULT_THRESHOLDS,
) -> AlertLevel:
    """Map a calibrated event probability to an alert category."""

    if not 0 <= probability <= 1:
        raise ValueError("probability must be between 0 and 1")
    if probability >= thresholds.emergency:
        return AlertLevel.EMERGENCY
    if probability >= thresholds.warning:
        return AlertLevel.WARNING
    if probability >= thresholds.watch:
        return AlertLevel.WATCH
    return AlertLevel.NONE
