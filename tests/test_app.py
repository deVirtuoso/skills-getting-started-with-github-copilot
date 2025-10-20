import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


def test_signup_for_activity():
    activity_name = "Chess Club"
    email = "newuser@mergington.edu"
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for {activity_name}"


def test_signup_for_activity_already_registered():
    activity_name = "Chess Club"
    email = "michael@mergington.edu"
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_unregister_from_activity():
    activity_name = "Chess Club"
    email = "michael@mergington.edu"
    response = client.delete(f"/activities/{activity_name}/unregister", params={"email": email})
    assert response.status_code == 200
    assert response.json()["message"] == f"Unregistered {email} from {activity_name}"


def test_unregister_from_activity_not_registered():
    activity_name = "Chess Club"
    email = "nonexistent@mergington.edu"
    response = client.delete(f"/activities/{activity_name}/unregister", params={"email": email})
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is not signed up for this activity"