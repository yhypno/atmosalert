"""Shared ingestion contract."""

from datetime import datetime
from pathlib import Path
from typing import Protocol


class DataSource(Protocol):
    """Contract for time-bounded, resumable source ingestion."""

    def fetch(self, start: datetime, end: datetime, destination: Path) -> list[Path]:
        """Fetch and validate source assets for the requested interval."""
