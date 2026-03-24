from datetime import datetime, timezone
from fastapi import Request


async def request_context_middleware(request: Request, call_next):
    request.state.request_time = datetime.now(timezone.utc)
    response = await call_next(request)
    response.headers['X-Request-Timestamp'] = request.state.request_time.isoformat()
    return response
