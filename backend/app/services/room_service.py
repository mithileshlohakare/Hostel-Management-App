from app.models.models import Room


def can_allocate(room: Room) -> bool:
    return room.current_occupancy < room.capacity
