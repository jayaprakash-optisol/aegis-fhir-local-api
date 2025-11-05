# AEGIS FHIR Local API

A robust NestJS-based REST API for healthcare data management with FHIR integration, authentication, and role-based access control.

## 🚀 Features

- 🔐 **JWT Authentication** - Secure token-based authentication
- 👥 **Role-Based Access Control** - ADMIN, CLINICIAN, PATIENT, DATA_SCIENTIST roles
- 🏥 **FHIR Integration** - Data scientist endpoints for accessing FHIR data
- 📊 **PostgreSQL Database** - Prisma ORM for type-safe database access
- 📚 **Swagger Documentation** - Interactive API documentation
- 🛡️ **Security** - Helmet, CORS, rate limiting, input validation
- 📝 **Logging** - Winston-based logging with request tracking
- ⚡ **Performance** - Request throttling and optimized queries

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd aegis-fhir-local-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/aegis_fhir?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Application Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (optional)
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

### 4. Database Setup

```bash
# Generate Prisma client and run migrations (recommended)
npm run db:setup

# Or run individually:
npm run prisma:generate    # Generate Prisma client
npm run db:migrate        # Run migrations in development
```

**Available Database Scripts:**

````bash
# Prisma Client
npm run prisma:generate   # Generate Prisma client

# Migrations
npm run prisma:migrate          # Create and apply migrations (dev)
npm run prisma:migrate:dev      # Same as above
npm run prisma:migrate:deploy   # Apply migrations (production)
npm run prisma:migrate:reset    # Reset database and apply migrations

# Database Management
npm run prisma:studio      # Open Prisma Studio (database GUI)
npm run prisma:format      # Format Prisma schema
npm run prisma:validate    # Validate Prisma schema



## 🚀 Running the Application

### Development Mode

```bash
npm run start:dev
````

The application will start on `http://localhost:3000` (or the port specified in `.env`).

### Production Mode

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

## 📚 API Documentation

Once the application is running, access the interactive Swagger documentation:

```
http://localhost:3000/api/docs
```

The Swagger UI provides:

- Complete API endpoint documentation
- Interactive API testing
- Request/response schemas
- Authentication support
- Example payloads

## 🔐 Authentication

### Register a New User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "role": "CLINICIAN"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Using the Access Token

Include the token in the Authorization header:

```bash
curl -X GET http://localhost:3000/api/endpoint \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 👥 User Roles

The API supports the following roles:

- **ADMIN** - Full system access
- **CLINICIAN** - Healthcare provider access
- **PATIENT** - Patient access to own data
- **DATA_SCIENTIST** - Access to FHIR data for research

## 📁 Project Structure

```
aegis-fhir-local-api/
├── src/
│   ├── common/              # Shared utilities
│   │   ├── decorators/      # Custom decorators (roles, etc.)
│   │   ├── enums/           # Enumerations (Role, etc.)
│   │   ├── filters/         # Exception filters
│   │   ├── guards/          # Auth guards (JWT, Roles)
│   │   ├── interceptors/    # Logging interceptors
│   │   ├── logger/          # Winston logger configuration
│   │   ├── strategies/      # Passport strategies (JWT)
│   │   └── types/           # TypeScript type definitions
│   ├── config/              # Configuration modules
│   │   └── database/        # Prisma module and service
│   ├── modules/             # Feature modules
│   │   ├── auth/            # Authentication module
│   │   └── data-scientist/  # Data scientist endpoints
│   ├── middlewares/         # Request ID middleware
│   ├── app.module.ts        # Root application module
│   └── main.ts              # Application entry point
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── test/                    # E2E tests
├── .env                     # Environment variables
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run test:cov
```

### E2E Tests

```bash
npm run test:e2e
```

## 🛠️ Development

### Available Scripts

**Application:**

```bash
npm run start          # Start application
npm run start:dev      # Start in development mode (watch)
npm run start:debug    # Start in debug mode
npm run start:prod     # Start in production mode
npm run build          # Build for production
```

**Code Quality:**

```bash
npm run format         # Format code with Prettier
npm run lint           # Lint and fix code
```

**Testing:**

```bash
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run end-to-end tests
```

**Database (Prisma):**

```bash
npm run db:setup       # Generate client + run migrations (recommended)
npm run prisma:generate # Generate Prisma client
npm run db:migrate     # Create and apply migrations (dev)
npm run prisma:migrate:deploy # Apply migrations (production)
npm run db:reset       # Reset database
npm run db:studio      # Open Prisma Studio (database GUI)
npm run prisma:format  # Format Prisma schema
npm run prisma:validate # Validate Prisma schema
```

### Code Formatting

```bash
npm run format
```

### Linting

```bash
npm run lint
```

### Build

```bash
npm run build
```

## 🔒 Security Features

- **Helmet** - Sets various HTTP headers for security
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - 50 requests per minute per IP
- **Input Validation** - Class-validator for DTOs
- **JWT Tokens** - Secure token-based authentication
- **Password Hashing** - bcrypt for password encryption
- **Request ID Tracking** - Unique ID for each request

## 📊 Database Schema

### User Model

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(CLINICIAN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  CLINICIAN
  PATIENT
  DATA_SCIENTIST
}
```

## 🌐 API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get access token
- `POST /auth/refresh` - Refresh access token

### Data Scientist

- `GET /data-scientist/*` - Data scientist specific endpoints (requires DATA_SCIENTIST role)

All endpoints require authentication unless specified otherwise.

## 📝 Environment Variables

| Variable          | Description                                  | Required | Default     |
| ----------------- | -------------------------------------------- | -------- | ----------- |
| `DATABASE_URL`    | PostgreSQL connection string                 | Yes      | -           |
| `JWT_SECRET`      | Secret key for JWT tokens                    | Yes      | -           |
| `PORT`            | Server port                                  | No       | 3000        |
| `NODE_ENV`        | Environment (development/production)         | No       | development |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | No       | \* (all)    |

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### Prisma Issues

```bash
# Regenerate Prisma client
npm run prisma:generate

# Validate Prisma schema
npm run prisma:validate

# Format Prisma schema
npm run prisma:format

# Reset database (WARNING: deletes all data)
npm run db:reset

# Open Prisma Studio to inspect database
npm run db:studio
```

### Port Already in Use

Change the `PORT` in your `.env` file or kill the process using the port:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

## 📦 Dependencies

### Core Dependencies

- **@nestjs/common** - NestJS core framework
- **@nestjs/core** - NestJS core functionality
- **@nestjs/jwt** - JWT authentication
- **@nestjs/passport** - Passport integration
- **@prisma/client** - Prisma ORM client
- **bcrypt** - Password hashing
- **class-validator** - Input validation
- **winston** - Logging

### Development Dependencies

- **@nestjs/cli** - NestJS CLI
- **@nestjs/testing** - Testing utilities
- **typescript** - TypeScript compiler
- **jest** - Testing framework
- **prettier** - Code formatting
- **eslint** - Code linting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED license.

## 🆘 Support

For issues and questions:

1. Check the [Swagger Documentation](http://localhost:3000/api/docs)
2. Review the code comments
3. Check existing issues in the repository
4. Create a new issue with detailed information

## 🎯 Roadmap

- [ ] FHIR resource management endpoints
- [ ] Patient data management
- [ ] Medication tracking
- [ ] Additional FHIR resource types
- [ ] Advanced search and filtering
- [ ] Bulk operations support

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [FHIR](https://www.hl7.org/fhir/) - Healthcare interoperability standard

---

**Built with ❤️ using NestJS and TypeScript**
