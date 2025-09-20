from app import database

# --- Dependencia DB ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()