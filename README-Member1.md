# Member 1 — Auth & Middleware Lead — Step by Step Guide

## What you're building
Registration/login with hashed passwords, JWT access + refresh tokens in HTTP-only cookies, role-based middleware, centralized error handling, and request validation. Every other member's routes will depend on your `authenticate` and `authorize` middleware — build and share these FIRST.

---

## Step 1 — Project setup (10:00–10:10)
```bash
mkdir backend && cd backend
npm init -y
npm install express mongoose bcrypt jsonwebtoken cookie-parser cors dotenv joi
npm install -D nodemon
```
In `package.json` add: `"scripts": { "dev": "nodemon server.js" }`

Create this folder structure:
```
backend/
  config/db.js
  models/User.js
  middleware/authenticate.js
  middleware/authorize.js
  middleware/errorHandler.js
  middleware/validate.js
  validators/authValidators.js
  controllers/authController.js
  routes/authRoutes.js
  utils/AppError.js
  server.js
  .env
```

## Step 2 — Copy in the provided files
Copy each file from this package into the matching path above (same filenames). Then create `.env` from `.env.example` and fill in real values — generate random secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run this twice, once for `JWT_ACCESS_SECRET`, once for `JWT_REFRESH_SECRET`.

## Step 3 — Get MongoDB running
Either:
- Install MongoDB locally and use `MONGO_URI=mongodb://localhost:27017/resolvex`, OR
- Create a free MongoDB Atlas cluster and paste its connection string into `.env`

## Step 4 — Run the server
```bash
npm run dev
```
You should see `MongoDB connected` and `Server running on port 5000`.

## Step 5 — Test in Postman immediately (don't wait until later)

**Register:**
```
POST http://localhost:5000/api/auth/register
Body (JSON):
{
  "name": "Test Student",
  "email": "student1@test.com",
  "password": "test1234",
  "role": "USER"
}
```
Expected: `201`, cookies `accessToken` and `refreshToken` set (check Postman's Cookies tab).

**Login:**
```
POST http://localhost:5000/api/auth/login
Body: { "email": "student1@test.com", "password": "test1234" }
```

**Refresh:**
```
POST http://localhost:5000/api/auth/refresh
```
(Postman auto-sends cookies from the same domain if "Automatically follow redirects" and cookie jar are on)

**Logout:**
```
POST http://localhost:5000/api/auth/logout
```

**Failure cases to test (for your Postman collection):**
- Register with existing email → expect `400`
- Login with wrong password → expect `401`
- Access a protected route with no cookie → expect `401`

## Step 6 — Register more test users for other roles
Repeat Step 5's register call with different emails and roles: `STAFF`, `DEPT_ADMIN`, `GRIEVANCE_OFFICER`, `SUPER_ADMIN`. Save each user's login cookies as separate Postman environment variables so Member 4 can test restricted routes later.

## Step 7 — Hand off to the team (do this by ~11:00 AM)
Share with everyone:
- Your `authenticate` middleware — they import it and add to any route needing login: `router.get('/mine', authenticate, controller)`
- Your `authorize` middleware — they use it for role restriction: `router.patch('/:id/status', authenticate, authorize('DEPT_ADMIN','SUPER_ADMIN'), controller)`
- Your `AppError` class and `validate` middleware pattern — they follow the same pattern for their own validation schemas
- Push to the shared repo on a branch, open a PR, merge into `main` before others build on top of it

## Step 8 — Once merged, keep iterating
- Add rate limiting on `/login` if time allows (`express-rate-limit`) to prevent brute force — nice-to-have, not required
- Double check cookie flags before demo: `sameSite: 'strict'`, `secure: true` only in production (keep `false` locally or the cookies won't be sent over `http://localhost`)

## Common issues & fixes
| Problem | Fix |
|---|---|
| Cookies not showing up in Postman | Enable Postman's cookie jar / "Send cookies" setting, and make sure `credentials: true` is set in your `cors()` config on the backend, and frontend fetch calls use `credentials: 'include'` |
| `MongoServerError: bad auth` | Check your Atlas connection string — username/password must be URL-encoded if they contain special characters |
| Token errors after schema changes | Old cookies reference old token secrets — clear cookies and log in again after changing `.env` |
