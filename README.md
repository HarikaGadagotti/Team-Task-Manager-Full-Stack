# TaskFlow — Team Task Manager

A full-stack web application for managing projects, assigning tasks, and tracking team progress with role-based access control.

## Live URL
https://your-app.railway.app

## Tech Stack
- **Backend:** Node.js, Express, MySQL
- **Frontend:** React 18, Vite
- **Auth:** JWT (JSON Web Tokens)
- **Deployment:** Railway

## Features
- 🔐 JWT Authentication (Signup/Login)
- 👥 Role-based access: Admin & Member
- 📁 Project management with team members
- ✅ Task creation, assignment & status tracking (Kanban board)
- 📊 Dashboard with stats, overdue tasks, recent activity
- 🌐 REST API with full validation

## Local Setup
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## API Endpoints
- POST /api/auth/signup
- POST /api/auth/login
- GET  /api/projects
- POST /api/projects
- GET  /api/projects/:id
- POST /api/tasks
- PUT  /api/tasks/:id
- GET  /api/tasks/dashboard