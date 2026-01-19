import os
from pathlib import Path

# Determine if running as PyInstaller bundle
IS_BUNDLED = getattr(sys, 'frozen', False)

# Base directory
if IS_BUNDLED:
    # Running as compiled exe
    BASE_DIR = Path(sys._MEIPASS)
    # Use APPDATA for user data
    APP_DATA_DIR = Path(os.getenv('APPDATA')) / 'MyLife'
else:
    # Running as Python script
    BASE_DIR = Path(__file__).resolve().parent.parent
    APP_DATA_DIR = BASE_DIR

# Create necessary directories
APP_DATA_DIR.mkdir(parents=True, exist_ok=True)
(APP_DATA_DIR / 'db').mkdir(exist_ok=True)
(APP_DATA_DIR / 'storage' / 'photos').mkdir(parents=True, exist_ok=True)
(APP_DATA_DIR / 'storage' / 'backups_tmp').mkdir(parents=True, exist_ok=True)

# Database
DATABASE_URL = f"sqlite:///{APP_DATA_DIR / 'db' / 'mylife.db'}"

# Storage
PHOTO_STORAGE_DIR = APP_DATA_DIR / 'storage' / 'photos'
BACKUP_DIR = APP_DATA_DIR / 'storage' / 'backups_tmp'

# Ensure storage directories exist
PHOTO_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

# Sentence Transformers Model Cache (will download to APPDATA on first run)
os.environ['SENTENCE_TRANSFORMERS_HOME'] = str(APP_DATA_DIR / 'models')

# API Configuration
API_HOST = "127.0.0.1"
API_PORT = 8000
