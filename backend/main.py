from typing import Literal
from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from . import database, models

app = FastAPI(title="Role-Based Notification System")


# CORS middleware to allow frontend running on different ports to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class NotificationCreate(BaseModel): # Schema for creating a new notification via API
    title: str = Field(..., min_length=2, max_length=160)
    message: str = Field(..., min_length=2)
    audience_type: Literal["all", "roles"]
    role_ids: list[int] = Field(default_factory=list)


class NotificationReadUpdate(BaseModel): # Schema for updating a notification's read status via API
    is_read: bool


class ConnectionManager: # Manages WebSocket connections for real-time notifications
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        connections = self.active_connections.get(user_id, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections:
            self.active_connections.pop(user_id, None)

    async def send_to_users(self, user_ids: list[int], payload: dict):
        for user_id in user_ids:
            for websocket in list(self.active_connections.get(user_id, [])):
                await websocket.send_json(payload)


manager = ConnectionManager()


def get_db(): # Dependency function to get a database session for each request
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def serialize_user(user: models.User): # Helper function to convert User model to a dictionary for API responses
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role_id": user.role_id,
        "role": user.role.name if user.role else None,
    }


def serialize_notification_state(state: models.NotificationState): # Helper function to convert NotificationState model to a dictionary for API responses
    notification = state.notification
    return {
        "id": notification.id,
        "state_id": state.id,
        "title": notification.title,
        "message": notification.message,
        "audience_type": notification.audience_type,
        "role_ids": notification.role_ids,
        "created_at": notification.created_at.isoformat(),
        "delivered_at": state.delivered_at.isoformat(),
        "is_read": state.is_read,
    }

# API endpoints for roles, users, notifications, and WebSocket connections
@app.get("/")
def read_root():
    return {"message": "Notification System API is running"}


@app.get("/roles")
def get_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).order_by(models.Role.id).all()


@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).options(joinedload(models.User.role)).order_by(models.User.id).all()
    return [serialize_user(user) for user in users]


@app.get("/notifications")
def get_notifications(user_id: int | None = None, db: Session = Depends(get_db)):
    if user_id is None:
        return db.query(models.Notification).order_by(models.Notification.created_at.desc()).all()

    states = (
        db.query(models.NotificationState)
        .options(joinedload(models.NotificationState.notification))
        .filter(models.NotificationState.user_id == user_id)
        .join(models.Notification)
        .order_by(models.Notification.created_at.desc())
        .all()
    )
    return [serialize_notification_state(state) for state in states]


@app.get("/notifications/unread-count/{user_id}")
def get_unread_count(user_id: int, db: Session = Depends(get_db)):
    count = (
        db.query(models.NotificationState)
        .filter(
            models.NotificationState.user_id == user_id,
            models.NotificationState.is_read.is_(False),
        )
        .count()
    )
    return {"user_id": user_id, "unread_count": count}


@app.post("/notifications")
async def send_notification(payload: NotificationCreate, db: Session = Depends(get_db)):
    if payload.audience_type == "roles" and not payload.role_ids:
        raise HTTPException(status_code=400, detail="Select at least one role.")

    users_query = db.query(models.User)
    if payload.audience_type == "roles":
        users_query = users_query.filter(models.User.role_id.in_(payload.role_ids))

    recipients = users_query.order_by(models.User.id).all()
    if not recipients:
        raise HTTPException(status_code=404, detail="No recipients match this audience.")

    notification = models.Notification(
        title=payload.title.strip(),
        message=payload.message.strip(),
        audience_type=payload.audience_type,
        role_ids=payload.role_ids if payload.audience_type == "roles" else [],
    )
    db.add(notification)
    db.flush()

    states = [
        models.NotificationState(notification_id=notification.id, user_id=user.id)
        for user in recipients
    ]
    db.add_all(states)
    db.commit()

    created_states = (
        db.query(models.NotificationState)
        .options(joinedload(models.NotificationState.notification))
        .filter(models.NotificationState.notification_id == notification.id)
        .all()
    )
    delivered_payloads = {
        state.user_id: serialize_notification_state(state)
        for state in created_states
    }
    await manager.send_to_users(
        list(delivered_payloads.keys()),
        {"type": "notification", "notification": None, "notifications": delivered_payloads},
    )

    return {
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "audience_type": notification.audience_type,
        "role_ids": notification.role_ids,
        "recipient_count": len(recipients),
        "created_at": notification.created_at.isoformat(),
    }


@app.patch("/notifications/{state_id}/read")
def update_read_state(
    state_id: int,
    payload: NotificationReadUpdate,
    db: Session = Depends(get_db),
):
    state = (
        db.query(models.NotificationState)
        .options(joinedload(models.NotificationState.notification))
        .filter(models.NotificationState.id == state_id)
        .first()
    )
    if state is None:
        raise HTTPException(status_code=404, detail="Notification state not found.")

    state.is_read = payload.is_read
    db.commit()
    db.refresh(state)
    return serialize_notification_state(state)


@app.websocket("/ws/{user_id}")
async def notifications_websocket(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
