# School Management System: Backend

Express + MongoDB (Mongoose) API with JWT login, role-based access, classes, students and attendance.

## Run locally

1. Install Node.js 18+ and either MongoDB locally or a free MongoDB Atlas cluster.
2. `cp .env.example .env` and set `MONGODB_URI` and `JWT_SECRET`.
3. ```
   npm install
   npm run db:seed     # creates the first admin and prints its password once
   npm run dev
   ```
4. Check http://localhost:4000/api/health, which should show `"database":"connected"`.

## Deploy on Render (with MongoDB Atlas)

1. In MongoDB Atlas create a free cluster, a database user, and under *Network Access* allow `0.0.0.0/0` (Render's IPs change). Copy the connection string.
2. On Render: **New > Web Service**, connect this repo.
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Environment variables: `MONGODB_URI`, `JWT_SECRET` (long random string), `FRONTEND_URL` (once the frontend is live).
4. Create the admin once, from your own computer, with `MONGODB_URI` in your `.env` pointing at Atlas: `npm run db:seed`.

## Endpoints

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | /api/auth/login | public | Log in, returns JWT |
| POST | /api/auth/users | admin | Create a user |
| GET | /api/auth/me | any | Current user |
| GET / POST | /api/classes | staff / admin | List / create classes |
| GET / POST | /api/students | staff / admin | List / create students |
| GET / PUT | /api/students/:id | staff / admin | One student |
| GET | /api/attendance?class_id=&date= | admin, teacher | Class register for a date |
| POST | /api/attendance/bulk | admin, teacher | Save a whole register (upsert) |
| GET | /api/attendance/summary?class_id=&from=&to= | admin, teacher | Attendance totals |

Send the token as `Authorization: Bearer <token>`. Dates are `YYYY-MM-DD`.

## Design notes

- All ids are UUID strings, so records created offline never collide.
- A unique index on (student_id, date) prevents duplicate attendance and makes offline sync safe to repeat.
- Changes to students are written to the `auditlogs` collection (old and new values).
