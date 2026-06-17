# MockAPI

A platform to create and manage mock REST APIs without writing backend code. Define a schema, get working endpoints with fake data instantly.

**Live:** https://mockapi.spacego.online

---

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-auth-000000?style=flat&logo=jsonwebtokens&logoColor=white)

---

## Features

- **Schema Builder** — visual field editor with drag-to-reorder, live JSON preview, type reference
- **Fake Data Engine** — 10 records auto-seeded on resource create via Faker.js
- **Dynamic Endpoints** — full REST CRUD auto-generated per resource (public, no auth)
- **Query Support** — pagination, sorting, and filtering out of the box
- **Error Simulation** — configurable error rate and response delay per resource
- **Request Logs** — last 100 requests per project, auto-refresh
- **Shareable Demo** — public demo page per project, no login required

---

## Project Structure

```
MockAPI/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/           # Landing, Login, Register, Dashboard,
│   │   │                    # ProjectDetail, SchemaBuilder, EndpointViewer,
│   │   │                    # ShareableDemo, NotFound
│   │   ├── components/      # ConfirmModal, Skeleton, RequestLogsPanel,
│   │   │                    # ErrorSimConfig, ProtectedRoute
│   │   ├── context/         # ToastContext
│   │   ├── contexts/        # AuthContext
│   │   ├── hooks/           # useAuth, useProjects
│   │   └── lib/             # axios (JWT interceptor)
│   └── package.json
├── server/                  # Node.js + Express backend
│   ├── controllers/         # authController, resourceController
│   ├── middlewares/         # auth, pipeline, errorHandler
│   ├── models/              # User, Project, Resource, DynamicData, RequestLog
│   ├── routes/              # auth, projects, resources, engine
│   ├── services/            # schemaService, fakerService, cacheService, queryService
│   ├── index.js
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+ (local) or MongoDB Atlas

### Installation

```bash
# Clone
git clone https://github.com/code-by-RJ/MockAPI.git
cd MockAPI

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### Environment Variables

Create `server/.env`:

```env
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mockapi
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:5173
```

> `JWT_SECRET` is required in all environments. `MONGODB_URI` and `CLIENT_URL` are required in production — server will exit on start if missing.

### Running Locally

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

App available at `http://localhost:5173`

---

## API Reference

### Auth

```
POST   /api/auth/register     { name, email, password }
POST   /api/auth/login        { email, password }
GET    /api/auth/me           Authorization: Bearer <token>
```

### Projects  *(requires auth)*

```
GET    /api/projects
POST   /api/projects          { name, isPublic? }
DELETE /api/projects/:slug
```

### Resources  *(requires auth)*

```
GET    /api/projects/:slug/resources
POST   /api/projects/:slug/resources    { name, schema? }
PUT    /api/projects/:slug/resources/:name
DELETE /api/projects/:slug/resources/:name
```

### Dynamic Engine  *(public — no auth)*

```
GET    /api/:slug/:resource              ?page=1&limit=10&sort=-createdAt&filter=name:john
GET    /api/:slug/:resource/:id
POST   /api/:slug/:resource             { ...fields }
PUT    /api/:slug/:resource/:id         { ...fields }
DELETE /api/:slug/:resource/:id
```

**Rate limit:** 100 requests / 15 min per IP.

---

## Production Deployment

### Backend — Render

| Setting | Value |
|---|---|
| Build command | `cd server && npm install` |
| Start command | `node index.js` |
| Root directory | `server` |

**Env vars on Render:**

```
NODE_ENV=production
MONGODB_URI=<atlas-connection-string>
JWT_SECRET=<strong-random-secret>
CLIENT_URL=https://mockapi.spacego.online
PORT=8000
```

### Frontend — Vercel

| Setting | Value |
|---|---|
| Framework | Vite |
| Root directory | `client` |
| Build command | `npm run build` |
| Output directory | `dist` |

**Env var on Vercel:**

```
VITE_API_URL=https://<your-render-url>.onrender.com/api
```

### DNS — Hostinger

```
CNAME  mockapi  →  cname.vercel-dns.com
```

---

## Screenshots

> Coming soon after deploy.

---

## License

MIT