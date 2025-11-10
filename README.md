# SDFC Application Backend

A backend API for a loan management system built with Hono, Bun, and SQLite. This application provides endpoints for user authentication, loan management, and payment tracking.

## Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
  - Install Bun: `curl -fsSL https://bun.sh/install | bash` (Linux/macOS) or `powershell -c "irm bun.sh/install.ps1 | iex"` (Windows)

## Setup Instructions

### 1. Clone the Repository

```sh
git clone <repository-url>
cd sdfc-application-be
```

### 2. Install Dependencies

```sh
bun install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```sh
JWT_TOKEN=your-secret-jwt-token-here
```

**Important:** Replace `your-secret-jwt-token-here` with a strong, random secret key for JWT token signing. You can generate one using:

```sh
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

### 4. Database Setup

The SQLite database (`db.sqlite`) will be automatically created when you first run the application. The database schema includes:

- **users** - User accounts with email, username, and password hash
- **loans** - Loan records with loan numbers, amounts, interest rates, and EMI calculations
- **payments** - Payment records linked to loans

No manual database migration is required - the schema is applied automatically on first run.

### 5. Run the Development Server

```sh
bun run dev
```

The server will start with hot-reload enabled and will be available at:

```
http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/signup` - Create a new user account
- `POST /api/login` - Authenticate and receive JWT token
- `POST /api/logout` - Logout and clear session cookie
- `GET /api/auth/profile` - Get authenticated user profile (requires JWT)

### Loans
- `POST /api/auth/create-loan` - Create a new loan (requires JWT)
- `GET /api/auth/get-loans` - Get all loans for authenticated user (requires JWT)
- `GET /api/auth/get-loan/:id` - Get a specific loan by loan number (requires JWT)

### Payments
- `POST /api/auth/create-payment/:loanNumber` - Create a payment for a loan (requires JWT)
- `GET /api/auth/get-payments/:loanNumber` - Get all payments for a loan (requires JWT)

## Features

- **JWT Authentication** - Secure token-based authentication with HTTP-only cookies
- **CSRF Protection** - Cross-site request forgery protection for API endpoints
- **CORS Enabled** - Configured for frontend at `http://localhost:5173`
- **Password Hashing** - Secure password storage using Bun's built-in password hashing
- **Auto Schema Migration** - Database tables are created automatically
- **Loan Management** - Create loans with automatic EMI calculation
- **Payment Tracking** - Track payments against loans

## Project Structure

```
src/
├── db/
│   ├── db.ts           # Database connection and schema
│   ├── queries.ts      # Database query functions
│   └── queries.test.ts # Database query tests
├── schemas/
│   ├── loan-schema.ts    # Loan validation schema
│   ├── login-schema.ts   # Login validation schema
│   ├── payment-schema.ts # Payment validation schema
│   └── signup-schema.ts  # Signup validation schema
├── test/
│   └── test-db.ts      # Database tests
├── helpers.ts          # Utility functions (JWT, EMI calculation, etc.)
└── index.ts            # Main application entry point
```

## Technology Stack

- **Runtime:** Bun
- **Framework:** Hono
- **Database:** SQLite (via Bun's built-in SQLite support)
- **Validation:** Zod
- **Authentication:** JWT (Hono JWT middleware)
- **Security:** CSRF protection, CORS

## Development

The development server runs with hot-reload enabled, so changes to your code will automatically restart the server.

## Notes

- The database file (`db.sqlite`) and its associated files (`db.sqlite-wal`, `db.sqlite-shm`) are created automatically and should be committed to version control or added to `.gitignore` based on your needs
- JWT tokens expire after 1 hour
- The CORS origin is configured for `http://localhost:5173` - update this in `src/index.ts` if your frontend runs on a different port
