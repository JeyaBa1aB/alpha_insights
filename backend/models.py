# models.py
# MongoDB User model for Alpha Insights

def get_user_collection(db):
    return db['users']

# Example user document structure:
# {
#   "username": "johndoe",
#   "email": "john@example.com",
#   "password_hash": "...",
#   "role": "user"  # or "admin"
# }

def create_user(db, username, email, password_hash, role="user"):
    user = {
        "username": username,
        "email": email,
        "password_hash": password_hash,
        "role": role
    }
    result = get_user_collection(db).insert_one(user)
    return result.inserted_id
