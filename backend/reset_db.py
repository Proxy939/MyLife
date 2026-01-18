import sys
sys.path.append("d:/college/Projects/MyLife")
from backend.app.database import engine, Base
from backend.app.models import * # Import models to register them

print("Resetting database tables...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("Database reset complete.")
