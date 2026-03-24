from fastapi import APIRouter

from app.api.routes import auth, complaints, dashboard, gate_passes, mess, notifications, rooms, users, visitors

api_router = APIRouter(prefix='/api/v1')
api_router.include_router(auth.router)
api_router.include_router(gate_passes.router)
api_router.include_router(complaints.router)
api_router.include_router(rooms.router)
api_router.include_router(users.router)
api_router.include_router(visitors.router)
api_router.include_router(notifications.router)
api_router.include_router(mess.router)
api_router.include_router(dashboard.router)

