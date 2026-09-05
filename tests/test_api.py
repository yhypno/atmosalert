from fastapi.testclient import TestClient

from backend.app import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["model_ready"] is False


def test_nowcast_is_unavailable_without_a_model() -> None:
    response = client.post(
        "/v1/nowcasts",
        json={
            "region": {
                "west": 72.0,
                "south": 18.0,
                "east": 73.0,
                "north": 19.0,
            }
        },
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "No trained nowcasting model is configured"
