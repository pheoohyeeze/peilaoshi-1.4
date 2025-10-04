# HSK Vocabulary Backend Service

A Node.js backend service built with Express.js and MySQL for managing HSK (Hanyu Shuiping Kaoshi) vocabulary learning application.

## Features

- **Vocabulary Management**: CRUD operations for HSK vocabulary
- **Progress Tracking**: User progress and mastery level tracking
- **Lesson Organization**: Organize vocabulary by lessons and HSK levels
- **Search Functionality**: Search vocabulary by Chinese, Pinyin, or English
- **Statistics**: Detailed progress and learning statistics
- **RESTful API**: Clean and well-documented API endpoints

## Project Structure

```
node-functions/
├── [[default]].js          # Main Express application entry point
├── package.json            # Dependencies and scripts
├── config/
│   └── database.js         # MySQL database configuration
├── api/
│   ├── vocabulary/
│   │   ├── index.js        # Vocabulary CRUD operations
│   │   ├── list.js         # Vocabulary listing with pagination
│   │   └── [id].js         # Individual vocabulary operations
│   ├── progress/
│   │   └── index.js        # User progress tracking
│   └── lessons/
│       └── index.js        # Lesson management
├── database/
│   └── schema.sql          # Database schema and sample data
└── README.md              # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd node-functions
npm install
```

### 2. Database Setup

1. Create a MySQL database:

```sql
CREATE DATABASE hsk_vocabulary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Run the schema file to create tables:

```bash
mysql -u your_username -p hsk_vocabulary < database/schema.sql
```

### 3. Environment Configuration

Create a `.env` file in the `node-functions` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hsk_vocabulary

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# JWT Secret (if needed for authentication)
JWT_SECRET=your_jwt_secret_key
```

### 4. Run the Application

```bash
npm start
# or for development with auto-reload
npm run dev
```

## API Endpoints

### Health Check

- `GET /health` - Check application and database health

### Vocabulary

- `GET /api/vocabulary/list` - Get vocabulary list with pagination
- `GET /api/vocabulary/list/stats` - Get vocabulary statistics
- `POST /api/vocabulary` - Create new vocabulary
- `POST /api/vocabulary/batch` - Create multiple vocabulary items
- `GET /api/vocabulary/search` - Search vocabulary
- `GET /api/vocabulary/[id]` - Get specific vocabulary
- `PUT /api/vocabulary/[id]` - Update vocabulary
- `DELETE /api/vocabulary/[id]` - Delete vocabulary

### Progress

- `GET /api/progress` - Get user progress
- `POST /api/progress` - Update user progress
- `GET /api/progress/statistics` - Get detailed progress statistics

### Lessons

- `GET /api/lessons` - Get lessons list
- `GET /api/lessons/[lessonId]/vocabulary` - Get vocabulary for specific lesson
- `GET /api/lessons/statistics` - Get lesson statistics

## Database Schema

### Tables

1. **vocabulary** - Stores HSK vocabulary items
2. **progress** - Tracks user learning progress
3. **study_sessions** - Records study sessions
4. **activity_log** - Logs user activities

### Views

1. **vocabulary_with_progress** - Combines vocabulary and progress data
2. **user_progress_summary** - Aggregated user progress statistics

## Deployment on Edge One

This application is designed to work with Edge One's Node Functions. The structure follows Edge One's requirements:

- Main application in `[[default]].js`
- API routes organized in the `api/` directory
- Each route file exports an Express router
- Database configuration in `config/database.js`

### Edge One Configuration

1. Upload the entire `node-functions` directory to your Edge One project
2. Ensure your MySQL database is accessible from Edge One
3. Set environment variables in Edge One dashboard
4. Deploy the function

## Error Handling

The application includes comprehensive error handling:

- Database connection errors
- Validation errors
- Not found errors (404)
- Server errors (500)
- Detailed error logging

## Security Features

- Helmet.js for security headers
- CORS configuration
- Input validation
- SQL injection prevention with parameterized queries
- Request logging

## Development

### Adding New Endpoints

1. Create a new file in the `api/` directory
2. Export an Express router
3. Add route handlers with proper error handling
4. Test the endpoints

### Database Migrations

For schema changes, create new SQL files in the `database/` directory and apply them manually to your database.

## License

MIT License
