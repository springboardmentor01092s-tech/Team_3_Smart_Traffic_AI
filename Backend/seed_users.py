"""
Seed script to reset and insert default users into users.db.
Run from the Backend directory:  python seed_users.py
"""

import sys
import os

# Make sure the app package is importable
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, SessionLocal, Base
from app.models import User
from app.utils import hash_password

# Ensure tables exist
Base.metadata.create_all(bind=engine)

USERS = [
    {
        "username": "Sri",
        "email": "Srilekha@gmail.com",
        "password": "123456",
        "role": "admin",
    },
    {
        "username": "Archee",
        "email": "archee@gmail.com",
        "password": "123456",
        "role": "operator",
    },
    {
        "username": "Chandini",
        "email": "chandini@gmail.com",
        "password": "123456",
        "role": "commuter",
    },
]

db = SessionLocal()

try:
    for u in USERS:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if existing:
            # Update password and role in case they changed
            existing.password = hash_password(u["password"])
            existing.role = u["role"]
            existing.username = u["username"]
            print(f"  Updated : {u['email']}  (role={u['role']})")
        else:
            new_user = User(
                username=u["username"],
                email=u["email"],
                password=hash_password(u["password"]),
                role=u["role"],
            )
            db.add(new_user)
            print(f"  Inserted: {u['email']}  (role={u['role']})")

    db.commit()
    print("\n  Seed complete. All 3 users are ready.")

except Exception as e:
    db.rollback()
    print(f"\n  Error: {e}")
    raise

finally:
    db.close()
