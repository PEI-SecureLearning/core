import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from src.services.courses import create_course
from src.models import (
    CourseCreate,
    CourseDifficulty,
)
from bson import ObjectId

@pytest.mark.anyio
async def test_create_course_success():
    # Arrange
    payload = CourseCreate(
        title="Test Course",
        description="Test Description",
        category="Test Category",
        difficulty=CourseDifficulty.EASY,
        expected_time="1 hour",
        modules=["65f1a2b3c4d5e6f7a8b9c0d1"]
    )
    created_by = "user-123"
    
    mock_id = ObjectId()
    mock_result = MagicMock()
    mock_result.inserted_id = mock_id
    
    # Mock MongoDB collection
    mock_col = AsyncMock()
    mock_col.insert_one.return_value = mock_result
    
    with patch("src.services.courses.get_courses_collection", return_value=mock_col):
        # Act
        result = await create_course(payload, created_by)
        
        # Assert
        assert result.title == payload.title
        assert result.created_by == created_by
        assert result.id == str(mock_id)
        assert len(result.modules) == 1
        assert result.created_at is not None
        assert result.updated_at is not None
        
        # Verify collection call
        mock_col.insert_one.assert_called_once()
        sent_data = mock_col.insert_one.call_args[0][0]
        assert sent_data["title"] == payload.title
        assert sent_data["created_by"] == created_by
        assert "created_at" in sent_data
        assert "updated_at" in sent_data
