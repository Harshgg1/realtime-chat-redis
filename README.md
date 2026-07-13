<div align="center">

# SyncSphere — Real-Time Chat Architecture

**A highly scalable, real-time chat application built with Next.js, Node.js, WebSockets, Redis Pub/Sub, and PostgreSQL.**

<div align="center" style="margin-top: 20px;">
  <img src="https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</div>

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

## 1. System Architecture Diagram

This diagram shows how all components connect and interact to provide a seamless, horizontally scalable chat experience.

```mermaid
graph TD
    Client["Client Browser (React UI)"]
    
    subgraph NextJS [Frontend Environment]
        Next["Next.js Application"]
    end
    
    subgraph BackendEnvironment [Backend Environment]
        API["REST API (Express)"]
        WSS["Native WebSocket Server (ws)"]
    end
    
    subgraph Infrastructure [Infrastructure]
        Redis[(Redis Pub/Sub)]
        DB[(PostgreSQL via Prisma)]
    end
    
    Client -->|"HTTP GET/POST"| Next
    Client -->|"WebSocket (wss)"| WSS
    Next -->|"API Proxy"| API
    
    API --> DB
    WSS --> DB
    
    WSS -->|"Publish/Subscribe"| Redis
    API -->|"Publish Events"| Redis

    style Client fill:#0f172a,stroke:#3b82f6,color:#fff
    style Next fill:#1e1b4b,stroke:#8b5cf6,color:#fff
    style API fill:#1e1b4b,stroke:#8b5cf6,color:#fff
    style WSS fill:#1e1b4b,stroke:#8b5cf6,color:#fff
    style Redis fill:#7f1d1d,stroke:#ef4444,color:#fff
    style DB fill:#14532d,stroke:#22c55e,color:#fff
```

---

## 2. Folder Structure

A clean, monorepo-style structure separating the frontend application from the scalable backend architecture.

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
├── public/                          # Static Assets (Images, Icons)
├── docker-compose.yml               # Multi-container orchestration
└── next.config.ts                   # Next.js Proxy Configuration
```

---

## 3. Authentication Flow

How users securely authenticate and establish both HTTP sessions and WebSocket connections.

```mermaid
sequenceDiagram
    participant U as User Browser
    participant N as Next.js Frontend
    participant A as Auth API (Express)
    participant DB as PostgreSQL

    U->>N: Enters Credentials
    N->>A: POST /api/auth/login
    A->>DB: Query User & Verify Password
    DB-->>A: User Verified
    A-->>N: Returns JWT Token
    N->>U: Stores Token in localStorage
    
    Note over U,DB: WebSocket Connection Establishment
    U->>A: Connects to wss://.../?token=JWT
    A->>A: Verifies JWT Token
    A-->>U: WebSocket Connection Established
```

---

## 4. Database ER Diagram

The core schema design managed via Prisma.

```mermaid
erDiagram
    User {
        String id PK
        String username UK
        String password
        String status
        DateTime lastSeen
        DateTime createdAt
    }
    
    Room {
        String id PK
        String name
        String adminId FK
        DateTime createdAt
    }
    
    RoomMember {
        String id PK
        String roomId FK
        String userId FK
        String role
        DateTime joinedAt
    }
    
    Message {
        String id PK
        String roomId FK
        String senderId FK
        String content
        Boolean isEdited
        Boolean isDeleted
        DateTime createdAt
    }
    
    ReadReceipt {
        String id PK
        String messageId FK
        String userId FK
        String status
    }

    User ||--o{ Room : "Administers"
    User ||--o{ RoomMember : "Is part of"
    User ||--o{ Message : "Sends"
    Room ||--o{ RoomMember : "Contains"
    Room ||--o{ Message : "Houses"
    Message ||--o{ ReadReceipt : "Has"
    User ||--o{ ReadReceipt : "Owns"
```

---

## 5. Request Flow

The standard lifecycle of a REST API request in SyncSphere.

```mermaid
flowchart TD
    Req([Browser Request]) --> API[Next.js Proxy]
    API --> Express[Express Route Handler]
    Express --> Auth{JWT Middleware}
    Auth -->|Invalid| 401[401 Unauthorized]
    Auth -->|Valid| Controller[Controller Logic]
    Controller --> DB[(PostgreSQL)]
    DB --> Controller
    Controller --> Res([JSON Response])
```

---

## 6. Real-time Message Flow ⭐

This is how SyncSphere achieves real-time communication across multiple, load-balanced WebSocket servers using Redis Pub/Sub.

```mermaid
sequenceDiagram
    participant A as User A (Client)
    participant WS1 as WebSocket Server 1
    participant DB as PostgreSQL
    participant R as Redis (Pub/Sub)
    participant WS2 as WebSocket Server 2
    participant B as User B (Client)

    A->>WS1: { type: "message", payload: "Hello!" }
    
    note over WS1,DB: Server 1 persists message
    WS1->>DB: INSERT INTO "Message"
    DB-->>WS1: Success (returns message ID)
    
    note over WS1,R: Server 1 publishes to broker
    WS1->>R: PUBLISH room_id "{ ...message }"
    
    note over R,WS2: All subscribed servers receive message
    R-->>WS1: Message Event
    R-->>WS2: Message Event
    
    note over WS1,WS2: Servers broadcast to local connections
    WS1-->>A: { type: "new_message", payload: "Hello!" }
    WS2-->>B: { type: "new_message", payload: "Hello!" }
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