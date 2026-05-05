# Role-Based Notification System

Assessment project built with React, FastAPI, and local PostgreSQL.

## Features

- 5 seeded roles: Admin, Manager, Editor, Viewer, Support
- 6 seeded users, each with exactly one role
- User switcher instead of authentication
- Admin-only notification composer
- Audience targeting for all users or selected roles
- User inbox filtered by the selected user's delivery rules
- Newest-first notifications
- Unread badge and mark read/unread
- Search and read/unread filtering
- Real-time notification delivery through WebSocket

## Run Locally

Start PostgreSQL:

```bash
docker compose up -d
```

Initialize the database:

```bash
python -m backend.init_db
```

Start the backend:

```bash
uvicorn backend.main:app --reload
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## API Overview

- `GET /roles` returns all roles.
- `GET /users` returns seeded users with role names.
- `GET /notifications?user_id={id}` returns notifications delivered to one user.
- `POST /notifications` creates a notification for all users or selected roles.
- `PATCH /notifications/{state_id}/read` marks one delivered notification read/unread.
- `WS /ws/{user_id}` streams new notifications for the selected user.
