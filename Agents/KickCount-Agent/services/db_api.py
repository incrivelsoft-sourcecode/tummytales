import os, httpx
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi.encoders import jsonable_encoder
from bson import ObjectId
from db.mongo import profile_col, entries_col  # your Motor collections

# ── DB API (writes) ───────────────────────────────────────────
BASE_URL = "https://tummytales-db-api.onrender.com"

# Require only these two env vars
GLOBAL_API_KEY = os.environ["GLOBAL_API_KEY"]
AGENT_API_KEY  = os.environ["AGENT_API_KEY"]

def _u(path: str) -> str:
    return f"{BASE_URL}{path}"  # paths below start with "/"

HEADERS = {
    "X-API-Key": GLOBAL_API_KEY,
    "X-Agent-Key": AGENT_API_KEY,
}

def _raise_for_error(r: httpx.Response):
    if r.is_error:
        raise httpx.HTTPStatusError(
            f"Gateway {r.status_code} at {r.request.method} {r.request.url}: {r.text[:400]}",
            request=r.request,
            response=r,
        )

# ── WRITES → DB API ───────────────────────────────────────────
async def post_kick_movement(payload: Dict[str, Any]):
    async with httpx.AsyncClient(timeout=10) as cx:
        r = await cx.post(_u("/kick_count/movement"), headers=HEADERS, json=jsonable_encoder(payload))
        _raise_for_error(r)
        try: return r.json()
        except ValueError: return {"raw": r.text}

async def post_kick_feedback(payload: Dict[str, Any]):
    async with httpx.AsyncClient(timeout=10) as cx:
        r = await cx.post(_u("/kick_count/feedback"), headers=HEADERS, json=jsonable_encoder(payload))
        _raise_for_error(r)
        try: return r.json()
        except ValueError: return {"raw": r.text}

async def post_feedback_log(payload: Dict[str, Any]):
    async with httpx.AsyncClient(timeout=10) as cx:
        r = await cx.post(_u("/kick_count/log"), headers=HEADERS, json=jsonable_encoder(payload))
        _raise_for_error(r)
        try: return r.json()
        except ValueError: return {"raw": r.text}

# ── READS → Mongo (fallback until the DB API has GETs) ────────
async def get_profile(user_id: str) -> Optional[Dict[str, Any]]:
    # try by _id, then by userId
    doc = None
    try:
        doc = await profile_col.find_one({"_id": ObjectId(user_id)})
    except Exception:
        pass
    if not doc:
        doc = await profile_col.find_one({"userId": user_id})
    if not doc:
        return None
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

async def get_profile_by_email(email: str) -> Optional[Dict[str, Any]]:
    email_norm = (email or "").strip().lower()
    doc = await profile_col.find_one({"email": email_norm})
    if not doc:
        return None
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

async def create_profile(payload: Dict[str, Any]) -> Dict[str, Any]:
    # minimal create in Mongo
    data = dict(payload)
    if "email" in data:
        data["email"] = data["email"].strip().lower()
    res = await profile_col.insert_one(data)
    data["_id"] = str(res.inserted_id)
    return data

async def ensure_profile_by_email(email: str) -> Dict[str, Any]:
    prof = await get_profile_by_email(email)
    if prof:
        return prof
    local = email.split("@")[0].title() if "@" in email else "User"
    return await create_profile({"email": email.strip().lower(), "name": local})

async def list_kick_entries(
    user_id: str,
    start_iso: Optional[str] = None,
    end_iso: Optional[str] = None,
    session_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    q: Dict[str, Any] = {"user_id": user_id}
    if session_id:
        q["session_id"] = session_id
    if start_iso or end_iso:
        tsq: Dict[str, Any] = {}
        if start_iso:
            tsq["$gte"] = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
        if end_iso:
            tsq["$lt"] = datetime.fromisoformat(end_iso.replace("Z", "+00:00"))
        q["timestamp"] = tsq

    cursor = entries_col.find(q).sort("timestamp", 1)
    docs = await cursor.to_list(length=None)

    out: List[Dict[str, Any]] = []
    for d in docs:
        if "_id" in d:
            d["_id"] = str(d["_id"])
        ts = d.get("timestamp")
        if isinstance(ts, datetime):
            d["timestamp"] = ts.isoformat().replace("+00:00", "Z")
        out.append(d)
    return out
