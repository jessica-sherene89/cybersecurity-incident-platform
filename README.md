# Cybersecurity Incident Reporting and Response Management Platform

A full-stack enterprise web application engineered exclusively on the **MERN** (MongoDB, Express.js, React.js, Node.js) stack in pure JavaScript. This platform empowers organizations to report, classify, assign, investigate, mitigate, and resolve cybersecurity incidents with forensic evidence handling, investigation notes, playbook response checklists, and executive SOC analytics.

---

## 1. Project Folder Structure

```
cybersecurity-incident-platform/
│
├── package.json                    # Root convenience scripts
├── README.md                       # Comprehensive documentation
│
├── server/                         # Backend (Node.js & Express.js)
│   ├── .env                        # Environment configuration
│   ├── .env.example                # Environment variables template
│   ├── server.js                   # Express server entrypoint & middleware
│   ├── package.json                # Server dependencies & scripts
│   ├── config/
│   │   └── db.js                   # Mongoose MongoDB connection & retry logic
│   ├── models/
│   │   ├── User.js                 # User schema (bcryptjs, RBAC: employee/analyst/admin)
│   │   ├── Incident.js             # Incident schema (7-stage lifecycle, severities, IoCs)
│   │   ├── Evidence.js             # Forensic artifact metadata & file paths
│   │   ├── InvestigationNote.js    # Chronological investigation notes
│   │   └── ResponseAction.js       # Playbook containment & response checklist
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT Bearer token authentication
│   │   ├── roleMiddleware.js       # Role-Based Access Control (RBAC)
│   │   ├── uploadMiddleware.js     # Multer file upload storage & validation
│   │   └── errorMiddleware.js      # Centralized error handler & 404 responder
│   ├── controllers/
│   │   ├── authController.js       # Register, Login, Get Current User
│   │   ├── incidentController.js   # Incident CRUD, filters, assignments, status
│   │   ├── evidenceController.js   # Multer forensic uploads, downloads, gallery
│   │   ├── noteController.js       # Add & list chronological investigation notes
│   │   ├── actionController.js     # Response actions & status toggles
│   │   ├── dashboardController.js  # SOC telemetry & Chart.js aggregations
│   │   └── userController.js       # Identity & role management (Admin)
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth
│   │   ├── incidentRoutes.js       # /api/incidents
│   │   ├── evidenceRoutes.js       # /api/evidence
│   │   ├── actionRoutes.js         # /api/actions
│   │   ├── dashboardRoutes.js      # /api/dashboard
│   │   └── userRoutes.js           # /api/users
│   ├── utils/
│   │   ├── generateId.js           # Formatted Incident ID generator (INC-YYYY-XXXX)
│   │   └── seed.js                 # Database seeder with demo accounts & incidents
│   └── uploads/                    # Physical storage for forensic evidence artifacts
│
└── client/                         # Frontend (React.js)
    ├── package.json                # Client dependencies (React 18, React Router, Chart.js)
    ├── vite.config.js              # Bundler configuration & API proxy to :5000
    ├── index.html                  # HTML5 entrypoint with Google cyber fonts
    ├── public/
    │   └── index.html              # Public asset template
    └── src/
        ├── index.jsx               # React DOM root render
        ├── index.css               # Cyber-Navy SOC design system & variables
        ├── App.jsx                 # Router, ProtectedRoute guards, & Route layout
        ├── context/
        │   └── AuthContext.jsx     # Global authentication, token persistence, role state
        ├── services/
        │   └── api.js              # Axios instance with automatic JWT interceptors
        ├── utils/
        │   └── constants.js        # Severity colors, status badges, date/size formatters
        ├── components/
        │   ├── ProtectedRoute.jsx  # Route guard checking authentication & user role
        │   ├── StatusBadge.jsx     # Glowing status pills for incident stages
        │   ├── SeverityBadge.jsx   # High-contrast severity tags with Lucide icons
        │   ├── WorkflowStepper.jsx # 7-stage interactive incident response stepper
        │   ├── StatCard.jsx        # SOC telemetry metric card with cyber accents
        │   └── Modal.jsx           # Accessible cyber modal dialog for assignments/status
        ├── layouts/
        │   ├── Sidebar.jsx         # Collapsible cyber navigation with RBAC filtering
        │   ├── Navbar.jsx          # Top status bar, live feed pill, profile menu, logout
        │   └── MainLayout.jsx      # Shell container wrapping Sidebar, Navbar, and content
        └── pages/
            ├── Login.jsx           # Sign in with one-click demo credentials
            ├── Register.jsx        # User account creation with role selection
            ├── Dashboard.jsx       # 4 Chart.js charts (Severity, Type, Status, Timeline)
            ├── Incidents.jsx       # Inventory with live search, filters, pagination
            ├── ReportIncident.jsx  # Incident submission form with evidence upload
            ├── IncidentDetails.jsx # 7-stage stepper, audit history, evidence, notes, actions
            ├── MyIncidents.jsx     # Incidents submitted by the logged-in user
            ├── MyAssignments.jsx   # Dedicated workbench for Security Analysts
            ├── Evidence.jsx        # Central forensic vault of all uploaded artifacts
            ├── ResponseTracking.jsx# Mitigation actions tracker across all incidents
            ├── Reports.jsx         # Executive report, SLA metrics, print format, CSV export
            ├── Users.jsx           # User & identity access management (Admin)
            ├── Profile.jsx         # Operator profile details & password rotation
            ├── Settings.jsx        # Live system health check & SOC automation toggles
            └── NotFound.jsx        # "404 - Access Denied / Incident Not Found" screen
```

---

## 2. Installation Commands

Ensure you have [Node.js](https://nodejs.org/) (v16+ or v18+) installed.

### Backend Setup:
```bash
cd server
npm install
```

### Frontend Setup:
```bash
cd ../client
npm install
```

---

## 3. MongoDB Setup Instructions

1. **Local MongoDB**: Ensure MongoDB is running locally on port `27017` (e.g., via MongoDB Compass or Windows Service).
   ```
   mongodb://127.0.0.1:27017/cybersecurity_platform
   ```
2. **MongoDB Atlas (Cloud)**: Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), create a database user, and replace `MONGO_URI` in `server/.env` with your Atlas connection string.

### Run Database Seeder:
Populate the database with demo users, realistic cybersecurity incidents, forensic log files, and response actions:
```bash
cd server
node utils/seed.js
```

---

## 4. Environment Configuration (.env)

The backend `.env` file is located at `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/cybersecurity_platform
JWT_SECRET=super_cyber_incident_secret_key_2026_jwt_token
NODE_ENV=development
```

---

## 5. Running the Application

### Start the Backend Server:
```bash
cd server
npm run dev
```
*Backend runs at:* **`http://localhost:5000`**

### Start the Frontend Client:
```bash
cd client
npm start
```
*Frontend runs at:* **`http://localhost:3000`**

---

## 6. Demo Login Credentials

All demo accounts share the password: **`Password123!`**

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@example.com` | `Password123!` | Full control: Assign analysts, user management, analytics reports, all incidents |
| **Security Analyst** | `analyst@example.com` | `Password123!` | Investigation workbench, workflow status transitions, notes, playbook actions |
| **Threat Hunter** | `hunter@example.com` | `Password123!` | Forensic evidence analysis, threat hunting docket, containment actions |
| **Employee** | `employee@example.com` | `Password123!` | Report new incidents, track status of submitted incidents |

*(Note: The Login page features 1-click quick-fill buttons for instant demo switching).*

---

## 7. REST API Endpoint List

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET /api/auth/me` — Retrieve current authenticated user profile

### Incidents (`/api/incidents`)
- `GET /api/incidents` — List incidents (supports search, severity, type, status, pagination)
- `POST /api/incidents` — Report a new incident (supports multipart forensic evidence upload)
- `GET /api/incidents/my-incidents` — Get incidents reported by current user
- `GET /api/incidents/my-assignments` — Get incidents assigned to current Analyst
- `GET /api/incidents/:id` — Get comprehensive incident details
- `PUT /api/incidents/:id` — Update incident status/details (Analyst, Admin)
- `PUT /api/incidents/:id/assign` — Assign incident to an analyst (Admin)
- `DELETE /api/incidents/:id` — Expunge incident record (Admin)

### Forensic Evidence (`/api/evidence` & `/api/incidents/:id/evidence`)
- `POST /api/incidents/:id/evidence` — Upload forensic evidence artifact to an incident
- `GET /api/incidents/:id/evidence` — Get evidence files for an incident
- `GET /api/evidence` — Global forensic repository across all incidents
- `DELETE /api/evidence/:id` — Delete forensic artifact (Admin)

### Investigation Notes (`/api/incidents/:id/notes`)
- `POST /api/incidents/:id/notes` — Record an investigation finding/note
- `GET /api/incidents/:id/notes` — Get chronological notes for an incident

### Response Actions (`/api/actions` & `/api/incidents/:id/actions`)
- `POST /api/incidents/:id/actions` — Add mitigation playbook action
- `GET /api/incidents/:id/actions` — Get playbook actions for an incident
- `GET /api/actions` — Global response actions tracking board
- `PUT /api/actions/:id` — Toggle action status (`Pending`, `In Progress`, `Completed`)

### SOC Dashboard & Analytics (`/api/dashboard`)
- `GET /api/dashboard/stats` — High-speed telemetry, severity doughnut, type bar, and 30-day timeline trend

### Identity & Access Management (`/api/users`)
- `GET /api/users` — List all registered users (Admin)
- `GET /api/users/analysts` — List all active Security Analysts for assignment
- `PUT /api/users/:id/role` — Update user role and status (Admin)
- `DELETE /api/users/:id` — Delete user account (Admin)

### Platform Health
- `GET /api/health` — Service uptime and API status

---

## 8. Communication Architecture: React, Express, Node.js & MongoDB

```
+-------------------------------------------------------------------------+
|                           CLIENT (React.js)                             |
|  - UI Pages & Cyber Components (Chart.js, Lucide Icons, Workflow Stepper)|
|  - AuthContext (Session persistence & Role checking)                   |
|  - Axios Service Layer (api.js with JWT Interceptors)                   |
+------------------------------------+------------------------------------+
                                     | HTTP Requests (JSON / Multipart)
                                     | Authorization: Bearer <JWT>
                                     v
+-------------------------------------------------------------------------+
|                        SERVER (Node.js & Express)                       |
|  - Express Router & Middleware (CORS, JSON Body Parser, Multer Upload)  |
|  - authMiddleware (Validates JWT signatures, attaches req.user)         |
|  - roleMiddleware (Enforces role-based permissions: admin/analyst/user) |
|  - API Controllers (Business logic, status history audit, aggregations) |
+------------------------------------+------------------------------------+
                                     | Mongoose Queries
                                     | (find, create, aggregate, populate)
                                     v
+-------------------------------------------------------------------------+
|                           DATABASE (MongoDB)                            |
|  - Users Collection (Credentials, bcrypt hashes, roles)                 |
|  - Incidents Collection (Indexed by status, severity, incidentId)       |
|  - Evidence Collection (File metadata referencing server/uploads/)      |
|  - InvestigationNotes & ResponseActions Collections                     |
+-------------------------------------------------------------------------+
```

1. **Client Request**: The React frontend sends asynchronous HTTP requests via Axios (`api.js`). If a user is logged in, an Axios interceptor automatically injects `Authorization: Bearer <token>` into the HTTP request headers.
2. **Server Middleware**: The Express.js backend receives the request, parses JSON payloads or multipart file uploads (`Multer`), and runs `authMiddleware` to verify the JWT token.
3. **Role Authorization**: Sensitive routes pass through `roleMiddleware` (e.g., verifying `req.user.role === 'admin'` before allowing analyst assignments or user deletions).
4. **Controller Execution**: The controller executes business logic, logs audit changes to the incident's `statusHistory` array, or triggers MongoDB aggregation pipelines.
5. **Database Interaction**: Mongoose ODM interacts with MongoDB using schema definitions, indexing, and document population (`.populate()`) to link incidents with reporters and assigned analysts.
6. **Response Lifecycle**: Express sends a structured JSON response back to the client. React components update their local and context states, triggering smooth re-renders and updating Chart.js analytics graphs.
