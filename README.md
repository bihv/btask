# Mello - Trello Clone

A full-stack Trello clone built with modern technologies.

## Tech Stack

### Backend
- **Go Fiber** - Fast web framework
- **PostgreSQL** - Database
- **GORM** - ORM
- **Zap** - Structured logging
- **Air** - Hot reload for development
- **JWT** - Authentication

### Frontend
- **Next.js 14** - React framework with App Router
- **Ant Design 5** - UI component library
- **Zustand** - State management
- **React Query** - Data fetching
- **dnd-kit** - Drag and drop

## Features

- ✅ User authentication (Register/Login)
- ✅ Workspaces management
- ✅ Boards with customizable backgrounds
- ✅ Lists (Kanban columns)
- ✅ Cards with drag & drop
- ✅ Labels and member assignment
- ✅ Comments on cards
- ✅ Due dates with completion status
- ✅ Light/Dark theme
- ✅ Responsive design
- ✅ Plugin System (Marketplace, Safe Sandbox)

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Go 1.21+ (for local backend development)

### Quick Start with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432

### Local Development

#### Backend
```bash
cd backend
cp .env.example .env
go mod download

# Windows (default)
air

# macOS / Linux
air -c .air.unix.toml
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/:id` - Update user

### Workspaces
- `GET /api/workspaces/` - List user workspaces
- `POST /api/workspaces/` - Create workspace
- `GET /api/workspaces/:id` - Get workspace
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Boards
- `GET /api/workspaces/:workspaceId/boards` - List boards
- `POST /api/workspaces/:workspaceId/boards` - Create board
- `GET /api/boards/:id` - Get board with lists & cards
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Lists
- `POST /api/boards/:boardId/lists` - Create list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list
- `PUT /api/lists/:id/move` - Reorder list

### Cards
- `POST /api/lists/:listId/cards` - Create card
- `GET /api/cards/:id` - Get card details
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `PUT /api/cards/:id/move` - Move card

### Comments
- `GET /api/cards/:cardId/comments` - List comments
- `POST /api/cards/:cardId/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

## Project Structure

```
mello/
├── backend/
│   ├── cmd/server/         # Entry point
│   ├── internal/
│   │   ├── config/         # Configuration
│   │   ├── database/       # Database connection
│   │   ├── handlers/       # HTTP handlers
│   │   ├── middleware/     # Middleware (auth, logger)
│   │   ├── models/         # GORM models
│   │   ├── repository/     # Data access layer
│   │   ├── router/         # Route definitions
│   │   └── services/       # Business logic
│   └── pkg/
│       ├── logger/         # Zap logger
│       └── utils/          # Response helpers
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js pages
│   │   ├── components/     # React components
│   │   ├── lib/            # API client
│   │   ├── providers/      # Context providers
│   │   ├── stores/         # Zustand stores
│   │   ├── types/          # TypeScript types
├── plugins/            # Example plugins
│   └── card-view-counter/
├── sdk/                # Plugin SDK
└── docker-compose.yml
```

## Plugins Development

Mello supports a secure, sandboxed plugin system that allows developers to extend functionality without modifying the core codebase.

- **Architecture**: Plugins run in isolated iframes and communicate with the host via a type-safe SDK.
- **SDK**: A comprehensive TypeScript SDK (`@mello/plugin-sdk`) provides hooks for UI components, data storage, and theme synchronization.
- **Example**: Check out `plugins/card-view-counter` for a reference implementation of a plugin that:
    - Renders a badge on the card front.
    - Adds a statistics section to the card back.
    - Uses the Data API to persist information.

## License

MIT
