<div align="center">

# SyncSphere — Real-Time Chat Architecture

**A highly scalable, real-time chat application built with Next.js, Node.js, WebSockets, Redis Pub/Sub, and PostgreSQL.**

![SyncSphere UI Banner](./public/banner.jpg)

</div>

---

## 🌟 Features

| Category | Features |
|---|---|
| **Real-Time Engine** | Native WebSocket connections managed by a custom Node.js server. |
| **Scalable Architecture** | Redis Pub/Sub integration allows horizontal scaling of WebSocket servers without sticky sessions. |
| **Authentication** | JWT-based authentication for secure messaging and user sessions. |
| **Persistent Storage** | PostgreSQL database with Prisma ORM for robust data integrity and message history. |
| **Dynamic UI** | Built with Next.js App Router, React 19, and TailwindCSS for a highly responsive, modern glassmorphic interface. |
| **Rooms & Presence** | Join via Room ID, view online members, real-time typing indicators, and instant read receipts. |
| **Dockerized** | Fully containerized environment using Docker Compose for instant local deployment. |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [Next.js (App Router)](https://nextjs.org/) | React Framework & Client Routing |
| [React 19](https://react.dev/) | UI Library |
| [TailwindCSS 4](https://tailwindcss.com/) | Utility-first CSS framework |
| [TypeScript](https://www.typescriptlang.org/) | Strict Type Safety |

### Backend & Infrastructure
| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) | High-performance Runtime |
| [Express](https://expressjs.com/) | REST API Framework |
| [ws](https://github.com/websockets/ws) | Native WebSocket server |
| [Redis](https://redis.io/) | Message broker & Pub/Sub for scalability |
| [PostgreSQL](https://www.postgresql.org/) | Primary Relational Database |
| [Prisma](https://www.prisma.io/) | Next-generation ORM |
| [Docker](https://www.docker.com/) | Containerization & Orchestration |

---

## 🚀 System Architecture

```mermaid
graph TB
    subgraph ClientLayer["Client Layer (Next.js)"]
        UI["React 19 Components<br/>TailwindCSS"]
        AUTH_CTX["Auth Context & JWT"]
        WS_HOOKS["Custom Hooks<br/>useWebSocket · useMessages · useTyping"]
    end

    subgraph ServerLayer["WebSocket & API Layer (Node.js)"]
        subgraph API["REST API"]
            CTRL["Controllers<br/>Auth · Rooms · Messages"]
            AUTH_MW["JWT Middleware"]
        end

        subgraph WS["WebSocket Server (ws)"]
            WSS["WS Connection Manager"]
            HANDLERS["Event Handlers<br/>Typing · Read Receipts · Messages"]
        end
    end

    subgraph MessageBroker["Message Broker (Redis)"]
        REDIS_PUB["Redis Publisher"]
        REDIS_SUB["Redis Subscriber"]
    end

    subgraph Database["Persistent Storage"]
        PG["PostgreSQL (chatdb)"]
        PRISMA["Prisma ORM"]
    end

    UI --> AUTH_CTX
    UI --> WS_HOOKS
    WS_HOOKS -->|"HTTP/REST"| AUTH_MW
    WS_HOOKS -->|"WebSocket wss://"| WSS
    
    AUTH_MW --> CTRL
    CTRL --> PRISMA
    
    WSS --> HANDLERS
    HANDLERS -->|"Publish Message"| REDIS_PUB
    REDIS_SUB -->|"Receive Message"| WSS
    
    HANDLERS --> PRISMA
    PRISMA --> PG

    style ClientLayer fill:#0f172a,stroke:#3b82f6,color:#fff
    style ServerLayer fill:#1e1b4b,stroke:#8b5cf6,color:#fff
    style MessageBroker fill:#7f1d1d,stroke:#ef4444,color:#fff
    style Database fill:#14532d,stroke:#22c55e,color:#fff
```

*The diagram above illustrates how SyncSphere achieves true horizontal scalability. By introducing Redis Pub/Sub as a message broker, any number of WebSocket backend instances can be spun up. When a user sends a message to Instance A, it publishes to Redis, and Instance B receives it and forwards it to the intended recipient.*

---

## 📁 Project Structure

```text
SyncSphere/
├── app/                             # Next.js Frontend (App Router)
│   ├── api/                         # Next.js API Routes (Proxy to Backend)
│   ├── room/[roomId]/               # Dynamic Chat Room UI & Hooks
│   │   ├── components/              # ChatHeader, MessageList, etc.
│   │   └── hooks/                   # useMessages, useWebSocket, useTyping
│   ├── page.tsx                     # Dashboard & Authentication
│   └── globals.css                  # Tailwind styles
├── backend/                         # Node.js WebSocket & REST Server
│   ├── src/
│   │   ├── index.ts                 # Express & WS Server Entry
│   │   └── redis.ts                 # Redis Pub/Sub Singleton
│   ├── prisma/
│   │   └── schema.prisma            # DB Models (User, Room, Message)
│   └── Dockerfile                   # Backend Container Config
├── public/                          # Static Assets
├── docker-compose.yml               # Multi-container orchestration
└── next.config.ts                   # Next.js Proxy Configuration
```

---

## ⚙️ Quick Start (Docker)

The fastest way to run SyncSphere locally is using Docker Compose. This spins up PostgreSQL, Redis, the Node.js Backend, and the Next.js Frontend simultaneously.

### 1. Clone the repository
```bash
git clone https://github.com/Harshgg1/SyncSphere.git
cd SyncSphere
```

### 2. Configure Environment
A default `.env.example` is provided. You can optionally create a `.env` in both the root and `backend/` directories for custom overrides.

### 3. Spin up the cluster
```bash
docker compose up --build
```

### 4. Access the Application
- **Frontend UI:** Open your browser to `http://localhost:3000`
- **Backend API:** Running on `http://localhost:8080`
- **WebSocket:** Running on `ws://localhost:8080`

---

## 🧪 Manual Setup (Without Docker)

If you prefer to run services manually on your local machine:

**1. Prerequisites**
Ensure you have **Node.js (v20+)**, **PostgreSQL**, and **Redis** running locally.

**2. Backend Setup**
```bash
cd backend
npm install
npm run db:migrate   # Setup PostgreSQL tables
npm run db:generate  # Generate Prisma Client
npm run dev          # Starts on port 8080
```

**3. Frontend Setup** (In a new terminal)
```bash
# From the project root
npm install
npm run dev          # Starts on port 3000
```

---

<div align="center">
<i>Built with passion by <a href="https://github.com/Harshgg1">Harshgg1</a></i>
</div>