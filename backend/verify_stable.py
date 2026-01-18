import sys
import os
import requests
import json
from datetime import datetime
import time

# Assuming server is running on 8000. 
# Since we are an agent, we can't easily start background server and test against it in one script unless we use threads or separate process.
# But we can try to use FastAPI TestClient! That's better.

try:
    from fastapi.testclient import TestClient
    sys.path.append("d:/college/Projects/MyLife")
    from backend.app.main import app
    from backend.app.database import Base, engine, SessionLocal
except ImportError as e:
    print(f"Import failed: {e}")
    sys.exit(1)

# Reset DB for clean test
# Base.metadata.drop_all(bind=engine)
# Base.metadata.create_all(bind=engine)
# Correction: we don't want to wipe user data if this were real, but for this agent session it matches "local-first" dev.
# Let's just run tests.

client = TestClient(app)

def test_startup_settings():
    print("Testing startup settings...")
    with TestClient(app) as c: # Triggers startup event
        response = c.get("/settings/ai")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["id"] == 1
        assert data["data"]["ai_provider"] == "auto"
        print("PASS: Startup settings auto-created/retrieved.")

def test_strict_ai_validation():
    print("Testing strict AI validation...")
    # 1. Invalid provider
    response = client.put("/settings/ai", json={"ai_provider": "invalid", "local_model": "none", "openai_enabled": False})
    # Pydantic validation error -> 422
    assert response.status_code == 422
    print("PASS: Invalid provider rejected (422).")

    # 2. Local provider without model
    # Note: Pydantic root validator might fail logic.
    response = client.put("/settings/ai", json={"ai_provider": "local", "local_model": "none", "openai_enabled": False})
    # Should be 422 per our schema validator
    assert response.status_code == 422
    print("PASS: Local provider without model rejected (422).")

def test_month_filtering():
    print("Testing month filtering...")
    # Create memories in different months
    # Memory 1: Now (assuming 2026-01 based on metadata)
    client.post("/memories/", json={"title": "Jan Memory", "note": "Note content", "mood": "happy"})
    
    # We can't easily force created_at via API (it's auto). 
    # But filtering for CURRENT month should find it.
    current_month = datetime.now().strftime("%Y-%m")
    
    response = client.get(f"/memories/?month={current_month}")
    data = response.json()
    assert data["success"] is True
    found = any(m["title"] == "Jan Memory" for m in data["data"])
    assert found
    
    # Filter for future month
    response = client.get("/memories/?month=2099-01")
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 0
    print("PASS: Month filtering works.")

def test_updated_at():
    print("Testing updated_at...")
    # Create
    create_res = client.post("/memories/", json={"title": "Update Test", "note": "Original note", "mood": "neutral"})
    mem_id = create_res.json()["data"]["id"]
    created_at = create_res.json()["data"]["created_at"]
    
    time.sleep(1.5) # Wait to ensure time difference
    
    # Update
    update_res = client.put(f"/memories/{mem_id}", json={"note": "Updated note"})
    updated_at = update_res.json()["data"]["updated_at"]
    
    print(f"Created: {created_at}, Updated: {updated_at}")
    assert updated_at > created_at
    print("PASS: updated_at updated correctly.")

def run_tests():
    try:
        test_startup_settings()
        test_strict_ai_validation()
        test_month_filtering()
        test_updated_at()
        print("\nALL VERIFICATION CHECKS PASSED.")
    except AssertionError as e:
        print(f"\nFAIL: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
