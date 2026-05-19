=====================================
TASKFLOW — TEAM TASK MANAGER
Full Stack Developer Assignment — Ethara.ai
=====================================

LIVE URL
--------
https://natural-victory-production-0c5e.up.railway.app

GITHUB REPOSITORY
-----------------
https://github.com/HarikaGadagotti/Team-Task-Manager-Full-Stack


=====================================
DEMO ACCOUNTS — READY TO USE
=====================================

You can either use the existing demo accounts below OR
signup with a new account directly on the live URL.

Account 1 — Admin (Full Access)
--------------------------------
Name     : Admin User
Email    : admin@demo.com
Password : password123
Role     : Admin

Admin can:
- View all projects and all users
- Create, edit, delete projects
- Add and remove team members
- Create, assign, edit, delete tasks
- View full dashboard stats

Account 2 — Member (Limited Access)
-------------------------------------
Name     : John Member
Email    : john@demo.com
Password : password123
Role     : Member

Member can:
- View only projects they are added to
- Create and update tasks in their projects
- View their own assigned tasks
- View their personal dashboard stats

NOTE: You can also click "Sign Up" on the live URL
to create your own account and test freely.


=====================================
FEATURES
=====================================

- JWT Authentication (Signup / Login)
- Role-Based Access Control (Admin / Member)
- Project Management with team members
- Task Creation, Assignment and Status Tracking
- Kanban Board (Todo / In Progress / Done)
- Dashboard with real-time stats
- Overdue task detection and highlighting
- Task Priority levels (Low / Medium / High)
- Search users to add to projects
- REST API with full validation


=====================================
TECH STACK
=====================================

Frontend   : React 18, Vite, React Router v6
Backend    : Node.js, Express.js
Database   : MySQL 8.0
Auth       : JWT (JSON Web Tokens)
Password   : bcryptjs (hashed)
Deployment : Railway


=====================================
DATABASE SCHEMA
=====================================

users
  - id, name, email, password (hashed), role, created_at

projects
  - id, name, description, owner_id, created_at

project_members
  - project_id, user_id, role, joined_at

tasks
  - id, title, description, status, priority
  - project_id, assignee_id, created_by
  - due_date, created_at, updated_at


=====================================
API ENDPOINTS
=====================================

AUTH
  POST   /api/auth/signup         Register new user
  POST   /api/auth/login          Login user
  GET    /api/auth/me             Get current user

PROJECTS
  GET    /api/projects            List projects
  POST   /api/projects            Create project
  GET    /api/projects/:id        Get project with tasks and members
  PUT    /api/projects/:id        Update project (admin only)
  DELETE /api/projects/:id        Delete project (admin only)
  POST   /api/projects/:id/members      Add member
  DELETE /api/projects/:id/members/:uid Remove member

TASKS
  GET    /api/tasks               List tasks (with filters)
  GET    /api/tasks/dashboard     Dashboard statistics
  POST   /api/tasks               Create task
  PUT    /api/tasks/:id           Update task
  DELETE /api/tasks/:id           Delete task

USERS
  GET    /api/users               List all users (admin only)
  GET    /api/users/search?q=     Search users by name or email


=====================================
ROLE-BASED ACCESS CONTROL
=====================================

Action                    Admin    Member
-----------------------------------------
Create project              YES      YES
Edit / Delete project       YES      NO
Add / Remove members        YES      NO
Create tasks                YES      YES
Edit / Delete tasks         YES      YES
View all projects           YES      NO
View all users              YES      NO
View own tasks              YES      YES


=====================================
LOCAL SETUP
=====================================

Prerequisites:
  - Node.js v18+
  - MySQL 8.0+
  - npm

Step 1 — Clone repo
  git clone https://github.com/HarikaGadagotti/Team-Task-Manager-Full-Stack.git
  cd Team-Task-Manager-Full-Stack

Step 2 — Setup MySQL
  CREATE DATABASE taskmanager;
  CREATE USER 'taskuser'@'localhost' IDENTIFIED BY 'taskpass123';
  GRANT ALL PRIVILEGES ON taskmanager.* TO 'taskuser'@'localhost';
  FLUSH PRIVILEGES;

Step 3 — Backend setup
  cd backend
  Create .env file with:
    JWT_SECRET=ethara_super_secret_jwt_key_2024
    PORT=5000
    NODE_ENV=development
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=taskuser
    DB_PASSWORD=taskpass123
    DB_NAME=taskmanager

  npm install
  npm run dev
  (Runs on http://localhost:5000)

Step 4 — Frontend setup
  cd frontend
  npm install
  npm run dev
  (Runs on http://localhost:5173)


=====================================
PROJECT STRUCTURE
=====================================

Team-Task-Manager-Full-Stack/
  backend/
    src/
      config/
        database.js       MySQL connection and schema
      middleware/
        auth.js           JWT authentication and role guards
      routes/
        auth.js           Signup and Login
        projects.js       Project CRUD and member management
        tasks.js          Task CRUD and dashboard stats
        users.js          User search and listing
    app.js                Express app entry point
    package.json

  frontend/
    src/
      api/
        axios.js          Axios instance with interceptors
      context/
        AuthContext.jsx   Auth state management
      components/
        Layout.jsx        Page layout with sidebar
        Navbar.jsx        Navigation sidebar
        ProtectedRoute    Route guard for auth
      pages/
        Login.jsx         Login page
        Signup.jsx        Signup page
        Dashboard.jsx     Stats dashboard
        Projects.jsx      Project listing
        ProjectDetail.jsx Kanban board with tasks
        Tasks.jsx         My tasks page
    index.html
    package.json


=====================================
DEPLOYMENT — RAILWAY
=====================================

Backend Service:
  - Root Directory: backend
  - Start Command: node src/app.js
  - Environment: DB_HOST, DB_USER, DB_PASSWORD,
                 DB_NAME, DB_PORT, JWT_SECRET,
                 NODE_ENV=production

Frontend Service:
  - Root Directory: frontend
  - Build Command: npm run build
  - Start Command: npx serve dist -p $PORT
  - Environment: VITE_API_URL=<backend-url>/api

Database:
  - MySQL 8.0 plugin on Railway


=====================================
Built with for Ethara.ai
Full Stack Developer Assignment
=====================================