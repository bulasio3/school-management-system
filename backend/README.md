# School Management System: Backend (Phase 1)

Express + PostgreSQL API with JWT login, role-based access, classes, students and attendance.

## Setup

1. Install Node.js 18+ and PostgreSQL 13+.
2. Create a database:  `createdb school_db`  (or use pgAdmin)
3. Copy the env file and edit it:  `cp .env.example .env`
   - Set DATABASE_URL to match your PostgreSQL username/password.
   - Set JWT_SECRET to a long random string.
4. Install and initialise:
   ```
   npm install
   npm run db:init
   npm run db:seed
   npm run dev
   ```
5. Test it:  http://localhost:4000/api/health

Default admin (change it!): `admin@school.test` / `Admin@12345`

## Endpoints

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | /api/auth/login | public | Log in, returns JWT |
| POST | /api/auth/users | admin | Create a user |
| GET | /api/auth/me | any | Current user |
| GET/POST | /api/classes | admin (POST), staff (GET) | List / create classes |
| GET/POST | /api/students | admin (POST), staff (GET) | List / create students |
| GET/PUT | /api/students/:id | admin (PUT), staff (GET) | One student |
| GET | /api/attendance?class_id=&date= | admin, teacher | Class register for a date |
| POST | /api/attendance/bulk | admin, teacher | Save a whole register (upsert) |
| GET | /api/attendance/summary?class_id=&from=&to= | admin, teacher | Attendance totals |

Send the token as: `Authorization: Bearer <token>`

## Quick test with curl

```
# 1. login
curl -X POST localhost:4000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@school.test","password":"Admin@12345"}'

# 2. create a class (replace TOKEN)
curl -X POST localhost:4000/api/classes -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"S.2","stream":"East","year":2026}'
```
