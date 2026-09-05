import pytest

from backend.alerts import AlertLevel, classify_probability


@pytest.mark.parametrize(
    ("probability", "expected"),
    [
        (0.20, AlertLevel.NONE),
        (0.55, AlertLevel.WATCH),
        (0.75, AlertLevel.WARNING),
        (0.90, AlertLevel.EMERGENCY),
    ],
)
def test_classify_probability(probability: float, expected: AlertLevel) -> None:
    assert classify_probability(probability) is expected


@pytest.mark.parametrize("probability", [-0.01, 1.01])
def test_classify_probability_rejects_invalid_values(probability: float) -> None:
    with pytest.raises(ValueError, match="between 0 and 1"):
        classify_probability(probability)
