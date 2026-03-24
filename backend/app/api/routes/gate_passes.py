import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.models import GatePass, GatePassStatus, User, UserRole
from app.schemas.gate_pass import GatePassCreate, GatePassOut, GatePassScanApproveIn, GatePassUpdateStatus
from app.services.notification_service import send_mock_sms
from app.services.qr_service import generate_qr_base64
from app.websocket.manager import manager

router = APIRouter(prefix='/gate-passes', tags=['gate-passes'])


def parse_qr_payload(qr_data: str) -> tuple[int, str]:
    parts = qr_data.strip().split(':', 3)
    if len(parts) != 4 or parts[0] != 'HOSTELSYNC' or parts[1] != 'GATEPASS':
        raise HTTPException(status_code=400, detail='Invalid QR payload format')

    try:
        gate_pass_id = int(parts[2])
    except ValueError:
        raise HTTPException(status_code=400, detail='Invalid gate pass id in QR payload')

    qr_token = parts[3].strip()
    if not qr_token:
        raise HTTPException(status_code=400, detail='Missing QR token in payload')

    return gate_pass_id, qr_token


@router.post('', response_model=dict)
async def create_gate_pass(payload: GatePassCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(UserRole.student))):
    qr_token = secrets.token_urlsafe(24)

    gate_pass = GatePass(
        student_id=current_user.id,
        reason=payload.reason,
        out_time=payload.out_time,
        in_time=payload.in_time,
        qr_token=qr_token,
        status=GatePassStatus.pending,
    )
    db.add(gate_pass)
    await db.commit()
    await db.refresh(gate_pass)

    qr_payload = f'HOSTELSYNC:GATEPASS:{gate_pass.id}:{gate_pass.qr_token}'
    qr_image = generate_qr_base64(qr_payload)
    await manager.broadcast('gate_pass.created', {'id': gate_pass.id, 'student_id': current_user.id, 'status': gate_pass.status.value})
    return {'gate_pass': GatePassOut.model_validate(gate_pass), 'qr_base64': qr_image}


@router.get('', response_model=list[GatePassOut])
async def list_gate_passes(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(GatePass)
    if current_user.role == UserRole.student:
        stmt = stmt.where(GatePass.student_id == current_user.id)
    rows = (await db.scalars(stmt.order_by(GatePass.created_at.desc()))).all()
    return rows


@router.post('/scan/approve', response_model=GatePassOut)
async def approve_gate_pass_by_qr(payload: GatePassScanApproveIn, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(UserRole.warden, UserRole.admin))):
    gate_pass_id, qr_token = parse_qr_payload(payload.qr_data)

    gate_pass = await db.get(GatePass, gate_pass_id)
    if not gate_pass:
        raise HTTPException(status_code=404, detail='Gate pass not found')
    if gate_pass.qr_token != qr_token:
        raise HTTPException(status_code=400, detail='QR token mismatch')
    if gate_pass.status != GatePassStatus.pending:
        raise HTTPException(status_code=400, detail=f'Gate pass cannot be approved from status: {gate_pass.status.value}')

    gate_pass.status = GatePassStatus.approved
    gate_pass.approved_by = current_user.id

    student = await db.get(User, gate_pass.student_id)
    if student:
        await send_mock_sms(db, student, f'Your gate pass request for "{gate_pass.reason}" has been approved.')

    await db.commit()
    await db.refresh(gate_pass)

    await manager.broadcast('gate_pass.updated', {'id': gate_pass.id, 'status': gate_pass.status.value})
    return gate_pass


@router.patch('/{gate_pass_id}', response_model=GatePassOut)
async def update_gate_pass_status(gate_pass_id: int, payload: GatePassUpdateStatus, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(UserRole.warden, UserRole.admin))):
    gate_pass = await db.get(GatePass, gate_pass_id)
    if not gate_pass:
        raise HTTPException(status_code=404, detail='Gate pass not found')

    gate_pass.status = payload.status
    gate_pass.approved_by = current_user.id

    if payload.status in [GatePassStatus.approved, GatePassStatus.rejected]:
        student = await db.get(User, gate_pass.student_id)
        if student:
            await send_mock_sms(db, student, f'Your gate pass request for "{gate_pass.reason}" is {payload.status.value}.')

    await db.commit()
    await db.refresh(gate_pass)
    await manager.broadcast('gate_pass.updated', {'id': gate_pass.id, 'status': gate_pass.status.value})
    return gate_pass
