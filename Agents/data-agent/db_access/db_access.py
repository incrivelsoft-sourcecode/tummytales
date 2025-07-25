# import os
# import uuid
# from datetime import datetime, timezone
# from pymongo.mongo_client import MongoClient
# from pymongo.server_api import ServerApi
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()
# uri = os.getenv("MONGO_URI")
# client = MongoClient(uri, server_api=ServerApi('1'))

# # Database and shared-collections
# db = client["tummytales"]
# users = db["users"]
# activity_logs = db["activity_logs"]
# sessions = db["sessions"]
# feedback_messages = db["feedback_messages"]
# media_references = db["media_references"]

# def insert_user(name, email, phone):
#     if users.find_one({"email": email}):
#         print(f"User with email {email} already exists.")
#         return None

#     user_id = str(uuid.uuid4())
#     user_doc = {
#         "user_id": user_id,
#         "name": name,
#         "email": email,
#         "phone": phone,
#         "created_at": datetime.now(timezone.utc),
#         "schema_version": 1,
#         "agent_metadata": {}
#     }
#     users.insert_one(user_doc)
#     print(f"Inserted user {user_id}")
#     return user_id

# def update_agent_metadata(agent, user_id, update_fields):
#     if not users.find_one({"user_id": user_id}):
#         print(f"No user found with user_id: {user_id}")
#         return

#     update_path = {f"agent_metadata.{agent}.{k}": v for k, v in update_fields.items()}
#     result = users.update_one({"user_id": user_id}, {"$set": update_path})
#     if result.modified_count:
#         print(f"Updated {agent} metadata for user_id {user_id}")
#     else:
#         print(f"No updates made for user_id {user_id}")

# def log_activity(agent, user_id, action, details):
#     if not users.find_one({"user_id": user_id}):
#         print(f"No user found with user_id: {user_id}")
#         return

#     activity_logs.insert_one({
#         "user_id": user_id,
#         "agent": agent,
#         "action": action,
#         "timestamp": datetime.now(timezone.utc),
#         "details": details
#     })
#     print(f"Logged activity for {agent} and user_id {user_id}")

# def create_session(user_id, agents_involved, session_type, summary):
#     if not users.find_one({"user_id": user_id}):
#         print(f"No user found with user_id: {user_id}")
#         return

#     session_id = "sess_" + user_id[:8]
#     now = datetime.now(timezone.utc)
#     sessions.insert_one({
#         "session_id": session_id,
#         "user_id": user_id,
#         "agents_involved": agents_involved,
#         "start_time": now,
#         "end_time": now.replace(minute=now.minute + 10),
#         "session_type": session_type,
#         "summary": summary
#     })
#     print(f"Created session {session_id} for user_id {user_id}")
#     return session_id

# def save_feedback(agent, user_id, session_id, feedback_type, feedback_text, metadata):
#     if not users.find_one({"user_id": user_id}):
#         print(f"No user found with user_id: {user_id}")
#         return

#     feedback_messages.insert_one({
#         "user_id": user_id,
#         "agent": agent,
#         "session_id": session_id,
#         "timestamp": datetime.now(timezone.utc),
#         "feedback_type": feedback_type,
#         "feedback_text": feedback_text,
#         "metadata": metadata
#     })
#     print(f"Saved feedback from {agent} for user_id {user_id}")

# def save_media_reference(agent, user_id, media_type, s3_url, tags):
#     if not users.find_one({"user_id": user_id}):
#         print(f"No user found with user_id: {user_id}")
#         return

#     media_references.insert_one({
#         "user_id": user_id,
#         "agent": agent,
#         "media_type": media_type,
#         "s3_url": s3_url,
#         "uploaded_at": datetime.now(timezone.utc),
#         "tags": tags
#     })
#     print(f"Saved media reference for agent {agent} and user_id {user_id}")


# def create_indexes():
#     print("Creating indexes...")

#     # Users collection
#     users.create_index("user_id", unique=True)
#     users.create_index("email", unique=True)

#     # Activity logs
#     activity_logs.create_index([("user_id", 1)])
#     activity_logs.create_index([("agent", 1)])
#     activity_logs.create_index([("timestamp", -1)])  # descending for recent logs

#     # Sessions
#     sessions.create_index("user_id")
#     sessions.create_index("session_id", unique=True)

#     # Feedback messages
#     feedback_messages.create_index("user_id")
#     feedback_messages.create_index("session_id")

#     # Media references
#     media_references.create_index("user_id")
#     media_references.create_index("uploaded_at")

#     print("Indexes created successfully.")

# def remove_all_duplicates():
#     print("Cleaning duplicates in all collections...")

#     def clean_duplicates(collection, unique_field):
#         pipeline = [
#             {"$group": {
#                 "_id": f"${unique_field}",
#                 "count": {"$sum": 1},
#                 "ids": {"$push": "$_id"}
#             }},
#             {"$match": {
#                 "_id": {"$ne": None},
#                 "count": {"$gt": 1}
#             }}
#         ]
#         duplicates = list(collection.aggregate(pipeline))
#         total = 0
#         for dup in duplicates:
#             ids_to_delete = dup["ids"][1:]  # Keep the first
#             result = collection.delete_many({"_id": {"$in": ids_to_delete}})
#             print(f"{collection.name}: Deleted {result.deleted_count} duplicates of {unique_field} = {dup['_id']}")
#             total += result.deleted_count
#         if total == 0:
#             print(f"{collection.name}: No duplicates found.")
#         else:
#             print(f"{collection.name}: {total} duplicates removed.")

#     clean_duplicates(users, "email")
#     clean_duplicates(activity_logs, "user_id")
#     clean_duplicates(sessions, "session_id")
#     clean_duplicates(feedback_messages, "session_id")
#     clean_duplicates(media_references, "s3_url")

#     print("Duplicate cleanup complete.")


# # Schema validation for all shared collections
# def apply_schema_validation():
#     print("Applying schema validation rules...")

#     db.command("collMod", "users", validator={
#         "$jsonSchema": {
#             "bsonType": "object",
#             "required": ["user_id", "email", "name", "created_at", "agent_metadata"],
#             "properties": {
#                 "user_id": {"bsonType": "string"},
#                 "email": {"bsonType": "string", "pattern": "^.+@.+$"},
#                 "name": {"bsonType": "string"},
#                 "phone": {"bsonType": "string"},
#                 "created_at": {"bsonType": "date"},
#                 "schema_version": {"bsonType": "int"},
#                 "agent_metadata": {"bsonType": "object"}
#             }
#         }
#     })

#     db.command("collMod", "activity_logs", validator={
#         "$jsonSchema": {
#             "bsonType": "object",
#             "required": ["user_id", "agent", "action", "timestamp"],
#             "properties": {
#                 "user_id": {"bsonType": "string"},
#                 "agent": {"bsonType": "string"},
#                 "action": {"bsonType": "string"},
#                 "timestamp": {"bsonType": "date"},
#                 "details": {"bsonType": "object"}
#             }
#         }
#     })

#     db.command("collMod", "sessions", validator={
#         "$jsonSchema": {
#             "bsonType": "object",
#             "required": ["session_id", "user_id", "agents_involved", "start_time", "end_time", "session_type"],
#             "properties": {
#                 "session_id": {"bsonType": "string"},
#                 "user_id": {"bsonType": "string"},
#                 "agents_involved": {"bsonType": "array", "items": {"bsonType": "string"}},
#                 "start_time": {"bsonType": "date"},
#                 "end_time": {"bsonType": "date"},
#                 "session_type": {"bsonType": "string"},
#                 "summary": {"bsonType": "string"}
#             }
#         }
#     })

#     db.command("collMod", "feedback_messages", validator={
#         "$jsonSchema": {
#             "bsonType": "object",
#             "required": ["user_id", "agent", "session_id", "timestamp", "feedback_type", "feedback_text"],
#             "properties": {
#                 "user_id": {"bsonType": "string"},
#                 "agent": {"bsonType": "string"},
#                 "session_id": {"bsonType": "string"},
#                 "timestamp": {"bsonType": "date"},
#                 "feedback_type": {"bsonType": "string"},
#                 "feedback_text": {"bsonType": "string"},
#                 "metadata": {"bsonType": "object"}
#             }
#         }
#     })

#     db.command("collMod", "media_references", validator={
#         "$jsonSchema": {
#             "bsonType": "object",
#             "required": ["user_id", "agent", "media_type", "s3_url", "uploaded_at"],
#             "properties": {
#                 "user_id": {"bsonType": "string"},
#                 "agent": {"bsonType": "string"},
#                 "media_type": {"bsonType": "string"},
#                 "s3_url": {"bsonType": "string"},
#                 "uploaded_at": {"bsonType": "date"},
#                 "tags": {"bsonType": "array", "items": {"bsonType": "string"}}
#             }
#         }
#     })

#     print("Schema validation rules applied to all collections.")

