import os

os.environ.update(
    {
        "POSTGRES_SERVER": "localhost",
        "POSTGRES_USER": "testuser",
        "POSTGRES_PASSWORD": "testpassword",
        "RABBITMQ_HOST": "localhost",
        "RABBITMQ_USER": "guest",
        "RABBITMQ_PASS": "guest",
        "RABBITMQ_QUEUE": "email_queue",
        "KEYCLOAK_URL": "http://fake-keycloak:8080",
        "CLIENT_SECRET": "fake-secret",
    }
)

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
from src.main import app
from src.core.dependencies import get_db, get_current_realm
from src.core.security import oauth_2_scheme
from src.models import (
    CourseOut,
    PaginatedCourses,
    CourseDifficulty
)
from datetime import datetime

# Setup TestClient
client = TestClient(app)

@pytest.fixture(autouse=True)
def override_dependencies():
    # Mock database session
    mock_session = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_session
    
    # Mock OAuth2 token
    app.dependency_overrides[oauth_2_scheme] = lambda: "fake-token"
    
    # Mock CurrentRealm
    app.dependency_overrides[get_current_realm] = lambda: "test-realm"
    
    yield
    app.dependency_overrides = {}

@pytest.mark.anyio
async def test_list_courses_endpoint():
    # Arrange
    mock_paginated = PaginatedCourses(
        items=[
            CourseOut(
                id="123", title="Test Course", description="Desc",
                category="Cat", difficulty=CourseDifficulty.EASY,
                expected_time="1h", modules=[], created_at=datetime.now(), updated_at=datetime.now()
            )
        ],
        total=1, page=1, limit=20, pages=1
    )
    
    with patch("src.services.courses.list_courses", new_callable=AsyncMock) as mock_service:
        mock_service.return_value = mock_paginated
        
        # Act
        response = client.get("/api/courses")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Test Course"

@pytest.mark.anyio
async def test_get_course_endpoint():
    # Arrange
    mock_course = CourseOut(
        id="123", title="Test Course", description="Desc",
        category="Cat", difficulty=CourseDifficulty.EASY,
        expected_time="1h", modules=[], created_at=datetime.now(), updated_at=datetime.now()
    )
    
    with patch("src.services.courses.get_course", new_callable=AsyncMock) as mock_service:
        mock_service.return_value = mock_course
        
        # Act
        response = client.get("/api/courses/123")
        
        # Assert
        assert response.status_code == 200
        assert response.json()["id"] == "123"

@pytest.mark.anyio
async def test_create_course_endpoint():
    # Arrange
    payload = {
        "title": "New Course",
        "description": "Desc",
        "category": "Cat",
        "difficulty": "Easy",
        "expected_time": "1h",
        "modules": []
    }
    mock_course = CourseOut(
        id="123", title="New Course", description="Desc",
        category="Cat", difficulty=CourseDifficulty.EASY,
        expected_time="1h", modules=[], created_at=datetime.now(), updated_at=datetime.now()
    )
    
    with patch("src.routers.courses.decode_token_verified") as mock_decode:
        mock_decode.return_value = {"sub": "user-123"}
        with patch("src.services.courses.create_course", new_callable=AsyncMock) as mock_service:
            mock_service.return_value = mock_course
            
            # Act
            response = client.post("/api/courses", json=payload)
            
            # Assert
            assert response.status_code == 201
            assert response.json()["title"] == "New Course"

@pytest.mark.anyio
async def test_assign_course_endpoint():
    # Arrange
    payload = {
        "user_ids": ["u1", "u2"],
        "start_date": datetime.now().isoformat(),
        "deadline": datetime.now().isoformat(),
    }
    
    with patch("src.routers.courses.assign_course") as mock_assign:
        mock_assign.return_value = [MagicMock(), MagicMock()] # 2 assigned
        
        # Act
        response = client.post("/api/courses/123/assign", json=payload)
        
        # Assert
        assert response.status_code == 200
        assert response.json()["assigned_count"] == 2

@pytest.mark.anyio
async def test_get_enrolled_courses_endpoint():
    with patch("src.services.courses.list_enrolled_courses", new_callable=AsyncMock) as mock_service:
        mock_service.return_value = []
        response = client.get("/api/courses/u1/enrolled")
        assert response.status_code == 200
        assert response.json() == []

@pytest.mark.anyio
async def test_list_all_assignments_endpoint():
    # This involves session.exec and mocking multiple records
    with patch("src.services.courses.list_enrolled_courses", new_callable=AsyncMock) as mock_service:
        mock_service.return_value = []
        response = client.get("/api/courses/assignments/all")
        assert response.status_code == 200
        assert response.json() == []

@pytest.mark.anyio
async def test_force_scheduler_tick_endpoint():
    with patch("src.routers.courses.process_course_assignments") as mock_task:
        response = client.post("/api/courses/scheduler/force-tick")
        assert response.status_code == 200
        mock_task.assert_called_once()

@pytest.mark.anyio
async def test_update_course_endpoint():
    mock_course = CourseOut(
        id="123", title="N", description="D", category="C", difficulty=CourseDifficulty.EASY,
        expected_time="1", modules=[], created_at=datetime.now(), updated_at=datetime.now()
    )
    with patch("src.services.courses.update_course", new_callable=AsyncMock) as mock_service:
        mock_service.return_value = mock_course
        response = client.put("/api/courses/123", json={"title": "N", "description": "D", "category": "C", "difficulty": "Easy", "expected_time": "1", "modules": []})
        assert response.status_code == 200

@pytest.mark.anyio
async def test_patch_course_endpoint():
    mock_course = CourseOut(
        id="123", title="Patch", description="D", category="C", difficulty=CourseDifficulty.EASY,
        expected_time="1", modules=[], created_at=datetime.now(), updated_at=datetime.now()
    )
    with patch("src.services.courses.patch_course", new_callable=AsyncMock) as mock_service:
        mock_service.return_value = mock_course
        response = client.patch("/api/courses/123", json={"title": "Patch"})
        assert response.status_code == 200

@pytest.mark.anyio
async def test_delete_course_endpoint():
    with patch("src.services.courses.delete_course", new_callable=AsyncMock) as mock_service:
        response = client.delete("/api/courses/123")
        assert response.status_code == 204

@pytest.mark.anyio
async def test_get_sub_missing_claim():
    with patch("src.routers.courses.decode_token_verified") as mock_decode:
        mock_decode.return_value = {} # Missing 'sub'
        response = client.post("/api/courses", json={"title":"A", "description":"B", "category":"C", "difficulty":"Easy", "expected_time":"D", "modules":[]})
        assert response.status_code == 401
