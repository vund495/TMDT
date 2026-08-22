from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_schema_generated():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/products" in paths
    assert "/api/v1/cart" in paths
    assert "/api/v1/orders" in paths
    assert "/api/v1/tours/bookings" in paths
