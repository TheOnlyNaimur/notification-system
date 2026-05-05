from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import Base, engine
from .models import Notification, NotificationState, Role, User

ROLE_NAMES = ["Admin", "Manager", "Editor", "Viewer", "Support"]
# These are the users we want to have in our system right away for testing and demo purposes.
SEEDED_USERS = [
    ("Navid_Admin", "navid@admin.com", "Admin"),
    ("Sadek_Manager", "sadek@manager.com", "Manager"),
    ("Ovijit_Editor", "ovijit@editor.com", "Editor"),
    ("Monamy_Viewer", "monamy@viewer.com", "Viewer"),
    ("Adnan_Support", "adnan@support.com", "Support"),
    ("Moin_Viewer", "moin@viewer.com", "Viewer"),
]


def migrate_existing_notifications():
    """Keep older local databases working after the notification model upgrade."""
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(160)"))
        connection.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS audience_type VARCHAR(20) DEFAULT 'all'"))
        connection.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS role_ids JSONB DEFAULT '[]'::jsonb"))
        connection.execute(text("UPDATE notifications SET title = 'Legacy notification' WHERE title IS NULL"))
        connection.execute(text("UPDATE notifications SET audience_type = 'all' WHERE audience_type IS NULL"))
        connection.execute(text("UPDATE notifications SET role_ids = '[]'::jsonb WHERE role_ids IS NULL"))
        connection.execute(text("ALTER TABLE notifications ALTER COLUMN title SET NOT NULL"))
        connection.execute(text("ALTER TABLE notifications ALTER COLUMN audience_type SET NOT NULL"))
        connection.execute(text("ALTER TABLE notifications ALTER COLUMN role_ids SET NOT NULL"))


def backfill_notification_states(session: Session):
    if session.query(NotificationState).first():
        return

    notifications = session.query(Notification).all()
    if not notifications:
        return

    users = session.query(User).all()
    states = []
    for notification in notifications:
        if notification.audience_type == "roles":
            recipients = [user for user in users if user.role_id in notification.role_ids]
        else:
            recipients = users

        states.extend(
            NotificationState(notification_id=notification.id, user_id=user.id)
            for user in recipients
        )

    session.add_all(states)
    session.commit()


def init_db():
    Base.metadata.create_all(bind=engine)
    migrate_existing_notifications()
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        roles_by_name = {role.name: role for role in session.query(Role).all()}
        for role_name in ROLE_NAMES:
            if role_name not in roles_by_name:
                role = Role(name=role_name)
                session.add(role)
                roles_by_name[role_name] = role
        session.commit()

        roles_by_name = {role.name: role for role in session.query(Role).all()}
        users_by_email = {user.email: user for user in session.query(User).all()}
        for username, email, role_name in SEEDED_USERS:
            if email not in users_by_email:
                session.add(
                    User(
                        username=username,
                        email=email,
                        role_id=roles_by_name[role_name].id,
                    )
                )
        session.commit()

        backfill_notification_states(session)

    print("Database ready: 5 roles and 6 seeded users are available.")


if __name__ == "__main__":
    init_db()
