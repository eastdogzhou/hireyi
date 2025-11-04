# Test Update Guide for interview_feedbacks v2.0

## ⚠️ Tests Need Update

All tests related to `interview_feedbacks` need to be updated to match v2.0 schema.

## Major Changes

### 1. Field Changes
- `interviewer`: `int` → `UUID`
- `rating` → `interview_rating`
- `interviewer_type`: new required field
- `interview_date`: now required (can't be NULL)
- `comments`: now required (can't be NULL)
- `is_status_change`: removed (inferred from field values)

### 2. New Fields
- `ai_rating`: INTEGER (1-10) for AI evaluations
- `interviewer_type`: VARCHAR ('user', 'agent', 'system')

### 3. Service Method Changes

#### Updated Methods
- `create_interview_feedback()`: new parameters
- `create_status_change_record()`: new parameters
- `get_feedbacks_for_candidate()`: `include_status_changes` → `record_type`
- `get_feedbacks_for_candidate_position()`: `include_status_changes` → `record_type`
- `get_feedbacks_by_interviewer()`: `interviewer: int` → `interviewer: UUID`

#### New Methods
- `create_ai_evaluation()`
- `create_system_log()`
- `get_ai_evaluations_only()`

#### Renamed Methods
- `get_interview_feedbacks_only()` → `get_interview_evaluations_only()`

## Test Files to Update

1. `test_interview_feedback_service.py` - Service layer tests
2. `test_api_interview_feedbacks.py` - API endpoint tests
3. Any integration tests using interview feedbacks

## Example Test Updates

### Before (v1.0)
```python
def test_create_interview_feedback():
    feedback = service.create_interview_feedback(
        candidate_id=1,
        interviewer=123,  # int
        rating=4,  # old field name
        position_id=1,
        comments="Good candidate",
        interview_date="2025-01-27"
    )
```

### After (v2.0)
```python
def test_create_interview_feedback():
    from uuid import UUID

    feedback = service.create_interview_feedback(
        candidate_id=1,
        interviewer=UUID("12345678-1234-5678-1234-567812345678"),  # UUID
        interview_rating=4,  # new field name
        comments="Good candidate",  # required
        position_id=1,
        interview_date="2025-01-27",
        interviewer_type="user"  # new field
    )
```

### New Test: AI Evaluation
```python
def test_create_ai_evaluation():
    from uuid import UUID

    evaluation = service.create_ai_evaluation(
        candidate_id=1,
        ai_agent_id=UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        ai_rating=8,  # 1-10 scale
        comments="AI assessment: Strong technical background",
        position_id=1
    )

    assert evaluation["ai_rating"] == 8
    assert evaluation["interviewer_type"] == "agent"
    assert evaluation["interview_rating"] is None
    assert evaluation["new_status"] is None
```

### Query Parameter Changes
```python
# Before
feedbacks = service.get_feedbacks_for_candidate(
    candidate_id=1,
    include_status_changes=False  # old parameter
)

# After
feedbacks = service.get_feedbacks_for_candidate(
    candidate_id=1,
    record_type="interview"  # new parameter: 'interview', 'ai', 'status', or None
)
```

## TODO Checklist

- [ ] Update `test_interview_feedback_service.py`
  - [ ] Update existing test fixtures (add UUID, interviewer_type)
  - [ ] Update `test_create_interview_feedback`
  - [ ] Update `test_create_status_change_record`
  - [ ] Add `test_create_ai_evaluation`
  - [ ] Add `test_create_system_log`
  - [ ] Update query tests (record_type parameter)
  - [ ] Add mutual exclusivity tests

- [ ] Update `test_api_interview_feedbacks.py`
  - [ ] Update API request payloads
  - [ ] Update expected response schemas
  - [ ] Add API tests for AI evaluations
  - [ ] Update query parameter tests

- [ ] Add new test cases
  - [ ] Test mutual exclusivity validation
  - [ ] Test interviewer_type validation
  - [ ] Test interview_date auto-fill
  - [ ] Test comments required validation
  - [ ] Test UUID format validation

## Running Tests

After updates, run tests with:

```bash
uv run pytest backend/tests/test_interview_feedback_service.py -v
uv run pytest backend/tests/test_api_interview_feedbacks.py -v
```

## Notes

- All tests currently use mock data with INT interviewer IDs
- Need to generate valid UUIDs for test fixtures
- Schema validation is now stricter (required fields)
- Consider using `pytest-cov` to check coverage after updates
