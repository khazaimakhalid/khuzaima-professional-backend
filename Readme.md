
# Khuzaima Professional Backend

A REST API for a video-sharing platform built with Node.js, Express, MongoDB, and Cloudinary. The API supports user accounts, video publishing, comments, likes, playlists, tweets, subscriptions, watch history, and channel dashboard statistics.

## Features

- User registration, login, logout, token refresh, and password updates
- JWT authentication through cookies or Bearer tokens
- Video upload, update, deletion, publishing, and thumbnail management
- Cloudinary media uploads with Multer temporary-file handling
- Comments, likes, tweets, playlists, and channel subscriptions
- Watch history and creator dashboard statistics
- Centralized API responses and error handling
- CORS and cookie support for frontend clients

## Tech Stack

- Node.js
- Express 5
- MongoDB with Mongoose
- JSON Web Tokens
- Cloudinary
- Multer
- bcrypt

## Prerequisites

- Node.js 18 or newer
- npm
- A MongoDB deployment
- A Cloudinary account for media uploads

## Getting Started

1. Clone the repository and open the project directory.

2. Install dependencies:

	```bash
	npm install
	```

3. Create a file named `env` in the project root. The application currently loads this exact filename from `src/index.js`.

4. Add the required environment variables:

	```env
	PORT=8000
	CORS_ORIGIN=http://localhost:3000

	MongoDB_URI=<your-mongodb-connection-string>

	ACCESS_TOKEN_SECRET=replace-with-a-long-random-secret
	ACCESS_TOKEN_EXPIRES_IN=1d
	REFRESH_TOKEN_SECRET=replace-with-another-long-random-secret
	REFRESH_TOKEN_EXPIRES_IN=10d

	cloudinary_name=your-cloudinary-cloud-name
	cloudinary_api_key=your-cloudinary-api-key
	cloudinary_api_secret=your-cloudinary-api-secret
	```

	Keep this file private and add it to `.gitignore`. Never commit database credentials, token secrets, or Cloudinary secrets.

5. Start the development server:

	```bash
	npm run dev
	```

	The server runs at `http://localhost:8000` unless another `PORT` is configured.

## API Routes

The base URL is `http://localhost:8000/api/v1`.

| Area | Base path | Description |
| --- | --- | --- |
| Users | `/users` | Registration, authentication, profiles, account updates, and watch history |
| Health check | `/healthcheck` | API availability check |
| Videos | `/video` | Browse, publish, update, delete, and toggle video visibility |
| Comments | `/comment` | Read, create, update, and delete video comments |
| Likes | `/like` | Like videos, comments, and tweets; list liked videos |
| Playlists | `/playlist` | Create and manage playlists and their videos |
| Subscriptions | `/subscription` | Subscribe to channels and view subscriber relationships |
| Tweets | `/tweets` | Create, read, update, and delete tweets |
| Dashboard | `/dashboard` | Channel statistics and channel videos |

Most routes require authentication. Send an access token in either an HTTP-only cookie named `accessToken` or the following header:

```http
Authorization: Bearer <access-token>
```

### Example Requests

Health check:

```bash
curl http://localhost:8000/api/v1/healthcheck
```

Login:

```bash
curl -X POST http://localhost:8000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"your-password"}'
```

## Project Structure

```text
src/
|-- controllers/   Request handlers and business logic
|-- db/            MongoDB connection setup
|-- middlewares/   Authentication and file-upload middleware
|-- models/        Mongoose schemas
|-- routes/        API route definitions
|-- utils/         Errors, responses, async handlers, and Cloudinary
|-- app.js         Express app and route registration
`-- index.js       Environment loading, database connection, and server startup
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the server with Nodemon |

## Security Notes

- Use strong, unique secrets for access and refresh tokens.
- Do not commit the root `env` file or any credentials.
- Restrict `CORS_ORIGIN` to the trusted frontend origin in production.
- Use HTTPS in production so authentication cookies and API traffic are encrypted.

## License

This project is currently marked as `ISC` in `package.json`.

## Author

Khuzaima Khalid