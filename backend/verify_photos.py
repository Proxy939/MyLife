import sys
import os
import requests
import json
import time

# We need requests for multipart upload, testclient also supports it.
# Let's use requests against a running server? 
# No, we don't have a background server running reliably in this agent env.
# We must use TestClient.

try:
    from fastapi.testclient import TestClient
    sys.path.append("d:/college/Projects/MyLife")
    from backend.app.main import app
    from backend.app.database import Base, engine
except ImportError as e:
    print(f"Import failed: {e}")
    sys.exit(1)

client = TestClient(app)

def test_photo_upload_flow():
    print("Testing Photo Upload Flow...")
    
    # 1. Create Memory
    print("1. Creating memory...", end=" ")
    res = client.post("/memories/", json={"title": "Photo Mem", "note": "Pic test", "mood": "happy"})
    # DEBUG
    if res.status_code != 200:
        print(f"\nFAIL: Status {res.status_code}, Body: {res.text}")
        sys.exit(1)
        
    json_data = res.json()
    if json_data.get("data") is None:
         print(f"\nFAIL: Data is None. Full Body: {json_data}")
         sys.exit(1)
         
    mem_id = json_data["data"]["id"]
    print(f"OK (ID: {mem_id})")
    
    # 2. Upload Photo
    print("2. Uploading photo...", end=" ")
    # Create dummy image content
    dummy_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR..." # Fake header
    files = {'files': ('test.png', dummy_content, 'image/png')}
    
    res = client.post("/media/upload", files=files)
    if res.status_code != 200:
        print(f"FAIL: {res.json()}")
        sys.exit(1)
        
    data = res.json()["data"]
    paths = data["paths"]
    assert len(paths) == 1
    photo_path = paths[0]
    print(f"OK (Path: {photo_path})")
    
    # 3. Attach Photo
    print("3. Attaching photo...", end=" ")
    attach_body = {"paths": [photo_path]}
    res = client.post(f"/memories/{mem_id}/photos", json=attach_body)
    assert res.status_code == 200
    
    updated_mem = res.json()["data"]
    assert len(updated_mem["photos"]) == 1
    assert updated_mem["photos"][0] == photo_path
    print("OK")
    
    # 4. Persistence Check (Read back)
    print("4. Reading back logic...", end=" ")
    res = client.get(f"/memories/{mem_id}")
    read_mem = res.json()["data"]
    assert read_mem["photos"][0] == photo_path
    print("OK")

    print("\nPHOTO UPLOAD VERIFICATION PASSED.")

if __name__ == "__main__":
    test_photo_upload_flow()
