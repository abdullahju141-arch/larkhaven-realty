# Larkhaven Realty — MERN property site with an AI assistant

A demo real-estate website built with **MongoDB, Express, React and Node**. Visitors can search homes, save favourites and send viewing requests. **Lark**, the built-in AI assistant, understands plain-English requests ("3 bed house in Millbrook under 600k with a garden"), searches the real listings and replies with matching homes. It also answers common questions about viewings, fees and offers.

> Larkhaven Realty, Larkhaven Valley and every listing are fictional. Photos are from Unsplash.

## Features

- Listings with filters (town, type, price, beds, baths, features), sorting and pagination, all kept in the URL
- Property pages with a photo gallery, details, agent card, enquiry form and similar homes
- Accounts (register / log in) with saved homes
- Admin dashboard: add, edit and delete listings; read enquiries and mark them handled
- **Lark AI assistant** (Google Gemini):
  - turns a message into search filters, then runs a real database query, so it never invents homes
  - remembers the conversation, so "only ones with a fireplace" refines the last search
  - loosens the search slightly when nothing matches and says what it changed
  - falls back to a built-in keyword parser if no API key is set or the AI is busy
- Security: hashed passwords (scrypt), signed tokens, whitelisted filters, rate limits, a spam honeypot

## Tech

| Part | Used |
| --- | --- |
| Front end | React 19, bundled with esbuild; no UI framework, hand-written CSS |
| Back end | Node 20+, Express 4 |
| Database | MongoDB (Mongoose 8); an in-memory store is used when no database is set |
| AI | Google Gemini API (free tier works) |

## Run it on your laptop

You need **Node.js 20.12 or newer**.

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm start
```

Open http://localhost:3000.

- With `MONGODB_URI` empty the site uses an in-memory database with 16 sample homes. Changes are lost on restart.
- With `GEMINI_API_KEY` empty, Lark runs in **basic mode** (keyword search, no AI).
- Admin login: the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.

Other commands:

```bash
npm test               # 15 automated tests (search, auth, chat, admin)
npm run build:client   # rebuild the React app after changing client/src
npm run dev            # restart the server when server files change
npm run seed:reset     # wipe and re-add the sample listings (needs MONGODB_URI)
```

## Environment variables

| Name | What it is |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string. Empty = in-memory demo data |
| `JWT_SECRET` | Long random string used to sign log-in tokens. **Required in production** |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | The admin account, created on first start |
| `GEMINI_API_KEY` | Google AI Studio key. Empty = basic mode |
| `GEMINI_MODEL` | Default `gemini-3.5-flash-lite` |
| `PORT` | Default 3000 (hosts set this for you) |

Never commit `.env` or paste your API key into code. It is already in `.gitignore`.

## Deploy for free (Render + MongoDB Atlas)

### 1. Database — MongoDB Atlas (free cluster, 512 MB)

1. Sign up at https://www.mongodb.com/cloud/atlas and create a **Free** cluster.
2. **Database Access** → add a database user with a password.
3. **Network Access** → add IP address `0.0.0.0/0` (Render's free plan has no fixed IP).
4. **Connect → Drivers** → copy the connection string. Replace `<password>` and add a database name before the `?`, for example
   `mongodb+srv://lark:YOURPASS@cluster0.xxxxx.mongodb.net/larkhaven?retryWrites=true&w=majority`

### 2. Code — GitHub

Create a new repository and upload this folder (without `node_modules` and `.env`).

### 3. Website — Render (free web service)

1. Sign up at https://render.com with GitHub → **New → Web Service** → pick the repository.
2. Settings:
   - Runtime: **Node**
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: **Free**
   - Health check path: `/api/health`
3. **Environment** → add `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `GEMINI_API_KEY`.
4. Deploy. On the first start the server adds the 16 sample homes and the admin account.

The free plan sleeps after 15 minutes without visitors; the first visit after that takes about a minute to load.

## Project layout

```
server/
  app.js            Express app (security headers, API, static files)
  routes.js         Every API route in one table
  services/         Listings, auth, favourites, enquiries, admin, chat
  lib/              Search filters, keyword parser, Gemini client, auth helpers
  store/            MongoDB store and in-memory store (same interface)
  data/             Sample listings, towns, agents and FAQ
  public/           Built React app (served by Express)
  test/             node:test suites
client/
  src/              React pages and components
  build.mjs         esbuild bundle → server/public
```

## API

| Method | Path | |
| --- | --- | --- |
| GET | `/api/listings` | search (`city, type, minPrice, maxPrice, beds, baths, features, q, sort, page`) |
| GET | `/api/listings/:slug` | one home + similar homes |
| GET | `/api/meta` | towns, types, features |
| POST | `/api/chat` | `{ message, history }` → reply + matching homes |
| POST | `/api/auth/register`, `/api/auth/login` | returns a token |
| GET/POST/DELETE | `/api/favourites` | saved homes (logged in) |
| POST | `/api/enquiries` | viewing request |
| * | `/api/admin/...` | admin only |

---

Built by Muhammad Abdullah as a MERN + AI portfolio demo.
