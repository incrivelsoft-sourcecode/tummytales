# routes/report.py
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from db.mongo import entries_col
from openpyxl import Workbook
from datetime import datetime
from io import BytesIO
from typing import Optional, Dict, Any, List

router = APIRouter(tags=["Reports"])

@router.get("/kick-entries.xlsx")
async def export_kicks_xlsx(
    user_id: str = Query(...),
    start: Optional[str] = Query(None, description="ISO8601 start (UTC)"),
    end:   Optional[str] = Query(None, description="ISO8601 end (UTC)"),
    session_id: Optional[str] = Query(None)
):
    try:
        q: Dict[str, Any] = {"user_id": user_id}
        if session_id:
            q["session_id"] = session_id
        if start or end:
            tsq: Dict[str, Any] = {}
            if start: tsq["$gte"] = datetime.fromisoformat(start.replace("Z", "+00:00")).replace(tzinfo=None)
            if end:   tsq["$lt"]  = datetime.fromisoformat(end.replace("Z", "+00:00")).replace(tzinfo=None)
            q["timestamp"] = tsq

        docs: List[Dict[str, Any]] = await entries_col.find(q).sort("timestamp", 1).to_list(length=None)

        wb = Workbook()
        ws = wb.active
        ws.title = "Kick Logs"
        ws.append(["#", "Date", "Time", "Strength", "Duration (min)"])  # no sensitive fields

        for i, k in enumerate(docs, start=1):
            ts = k.get("timestamp")
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            date_str = ts.strftime("%Y-%m-%d") if isinstance(ts, datetime) else ""
            time_str = ts.strftime("%H:%M")     if isinstance(ts, datetime) else ""
            ws.append([i, date_str, time_str, k.get("strength") or "Unknown", k.get("duration") or ""])

        bio = BytesIO()
        wb.save(bio)
        bio.seek(0)
        filename = f"kick-logs-{user_id}-{datetime.utcnow().date().isoformat()}.xlsx"
        return StreamingResponse(
            bio,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Export error: {e}")
