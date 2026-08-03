# Chatty

A real-time chat app built with the MERN stack and Socket.io. Two users can sign up, message each other instantly, share images, and see who's online — no page refresh needed.

**Live:** https://fullstack-chat-app-xs00.onrender.com
**Repo:** https://github.com/JasmineeKaur/fullstack-chat-app

> Hosted on Render's free tier, so the server spins down after inactivity. First request after idle time can take 30–50 seconds to wake back up — that's a hosting limitation, not a bug.

## What it does

- Email/password signup and login, sessions kept alive with JWTs stored in httpOnly cookies
- Real-time messaging over WebSockets — messages and online status update live, both sides, no polling
- Profile picture upload (Cloudinary), stored as a URL on the user document, not the image itself
- Image sharing inside a conversation
- Route-level auth middleware — protected endpoints reject requests without a valid token before any controller logic runs

## Stack and why

**Backend:** Node/Express, MongoDB with Mongoose, Socket.io, JWT, bcrypt, Cloudinary SDK

**Frontend:** React (Vite), Zustand for state, React Router, Tailwind + DaisyUI, Axios

I used Zustand instead of Context API for global state (auth user, chat state, socket connection) — less boilerplate than Context + useReducer for this size of app, and avoids the re-render issues Context can cause when state changes frequently, which matters here since socket events fire often.

Passwords are hashed with bcrypt before storage, never stored or logged in plain text. JWTs live in httpOnly cookies rather than localStorage specifically to reduce XSS exposure — client-side JS can't read the token even if a script injection occurred.

## Architecture notes

Routes and controllers are split by feature (`auth`, `messages`), each controller only handles one thing. A single `protectRoute` middleware verifies the JWT and attaches `req.user`, so any protected route just adds it to the middleware chain instead of duplicating auth logic:

```js
router.put("/update-profile", protectRoute, updateProfile);
```

On the Socket.io side, each connected user's socket ID is tracked in a `userId -> socketId` map on the server. When a message is sent, the server looks up the receiver's socket ID and emits directly to that socket, rather than broadcasting to everyone — so a message from user A only ever reaches user B's specific connection.

## Problems I actually hit building this

**Express 5 broke the SPA fallback route.** The catch-all route that serves `index.html` for any non-API path (`app.get("*", ...)`) failed on deploy with a `path-to-regexp` parsing error. Worked fine locally, failed in production — turned out Express 5 changed how bare wildcard routes are parsed and now requires a named wildcard (`app.get("/{*splat}", ...)`). Traced it through the stack trace rather than guessing, since the failure was clearly coming from inside Express's routing internals, not my own code.

**Production build failed silently on a devDependency.** `vite: not found` during the Render build step, even though it was correctly listed in `package.json`. npm skips `devDependencies` by default when `NODE_ENV=production` is set — but Vite is needed *during* the build step itself, before the app is actually running. Fixed by forcing devDependencies to install for that specific build command (`--include=dev`) rather than moving Vite into regular dependencies, which would've been the easier but less accurate fix.

**MongoDB Atlas connection failing with SRV DNS errors, only sometimes.** `mongodb+srv://` connection strings require a DNS SRV lookup before connecting at all, and this was failing (`querySrv ECONNREFUSED`) despite correct credentials. Confirmed it wasn't a credentials or network issue by running the same SRV lookup manually with `nslookup`, which succeeded — meaning the failure was specific to Node's own DNS resolver, not the OS or ISP. Fixed by explicitly pointing Node's resolver at a public DNS server before connecting.

## Running it locally

```bash
git clone https://github.com/JasmineeKaur/fullstack-chat-app.git
cd fullstack-chat-app
```

`backend/.env`:
```
MONGODB_URI=your_mongodb_connection_string
PORT=5001
JWT_SECRET=your_jwt_secret
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

```bash
cd backend && npm install && npm run dev
```
```bash
cd frontend && npm install && npm run dev
```

App runs at `localhost:5173`, API at `localhost:5001`.

## What I'd add next

- Typing indicators and read receipts
- Message search
- Rate limiting on message sending
- Automated tests for the auth flow
