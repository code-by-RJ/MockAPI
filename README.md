# MockAPI

A powerful platform to create and manage mock APIs without coding. Define schemas, generate fake data, and test your application endpoints in seconds.

## Features

- **🚀 Quick Setup** - Create mock APIs in minutes, not hours
- **📊 Schema Builder** - Intuitive visual schema builder with Zod validation
- **🎲 Fake Data Generator** - Generate realistic fake data with Faker.js
- **🔐 User Authentication** - Secure JWT-based authentication
- **📱 Live Preview** - Real-time preview of generated data (killer feature)
- **🎯 Dynamic Endpoints** - Auto-generated REST endpoints for your resources
- **📝 Query Support** - Pagination, sorting, and filtering support
- **💾 Project Management** - Organize multiple projects and resources

## Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Axios** - HTTP client with interceptors

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Zod** - Schema validation
- **Faker.js** - Fake data generation
- **JWT** - Authentication

## Project Structure

```
MockAPI/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   └── lib/
│   └── package.json
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middlewares/
│   ├── models/
│   ├── index.js
│   └── package.json
├── .env
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd mockapi
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

4. **Setup environment variables**
```bash
# In server root
cp .env.example .env
# Edit .env with your configuration
```

### Running the Application

1. **Start MongoDB**
```bash
mongod
```

2. **Start the server**
```bash
cd server
npm run dev
```

3. **Start the client**
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Resources
- `GET /api/resources/project/:projectId` - Get all resources
- `POST /api/resources/project/:projectId` - Create resource
- `GET /api/resources/:id` - Get resource details
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

### Dynamic Endpoints
- `GET/POST/PUT/DELETE /api/engine/:projectId/:resourceId` - Dynamic endpoint handler

## Usage Example

1. **Create a User Account**
```bash
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

2. **Create a Project**
```bash
POST /api/projects
{
  "name": "User API",
  "description": "Mock user management API"
}
```

3. **Create a Resource with Schema**
```bash
POST /api/resources/project/{projectId}
{
  "name": "users",
  "endpoint": "/users",
  "responseType": "array",
  "schema": {
    "fields": [
      { "name": "id", "type": "number", "required": true },
      { "name": "name", "type": "string", "required": true },
      { "name": "email", "type": "email", "required": true },
      { "name": "active", "type": "boolean", "required": false }
    ]
  }
}
```

4. **Test the Dynamic Endpoint**
```bash
GET /api/engine/{projectId}/users?page=1&limit=10&sort=name&order=asc
```

## Environment Variables

```env
PORT=5000                                      # Server port
NODE_ENV=development                           # Environment
MONGODB_URI=mongodb://localhost:27017/mockapi # MongoDB connection
JWT_SECRET=your_secret_key                    # JWT signing key
CORS_ORIGIN=http://localhost:5173             # Frontend origin
FAKER_SEED=12345                              # Faker seed for consistency
```

## Development

### Scripts

Server:
```bash
npm run dev          # Start dev server with nodemon
npm start            # Start production server
npm test             # Run tests
```

Client:
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm preview          # Preview production build
```

## Features Breakdown

### Schema Builder
- Visual interface to define data schemas
- Support for multiple field types (string, number, boolean, array, object)
- Real-time validation with Zod
- Field customization and validation rules

### Live Preview
- Real-time preview of generated fake data
- Instant updates as schema changes
- JSON format display
- Copy-to-clipboard functionality

### Engine Pipeline (7-step process)
1. Validate request
2. Load schema
3. Parse query parameters
4. Apply filters
5. Generate/fetch data
6. Format response
7. Send response

### Caching
- In-memory project cache for performance
- Automatic cache invalidation
- Configurable cache TTL

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial use.

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the maintainers.

---

**Happy Mocking! 🎉**
