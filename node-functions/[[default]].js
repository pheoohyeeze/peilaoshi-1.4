import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { testConnection } from "./config/database.js";

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Logging middleware
app.use(morgan("combined"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: dbStatus ? "connected" : "disconnected",
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "HSK Vocabulary Backend Service",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      api: "/api"
    }
  });
});

// API routes
app.use("/api", (req, res, next) => {
  res.json({
    message: "API endpoints",
    availableRoutes: [
      "GET /api/vocabulary - Get vocabulary list",
      "GET /api/vocabulary/:id - Get specific vocabulary",
      "POST /api/vocabulary - Create new vocabulary",
      "PUT /api/vocabulary/:id - Update vocabulary",
      "DELETE /api/vocabulary/:id - Delete vocabulary",
      "GET /api/lessons - Get lessons list",
      "GET /api/progress - Get user progress",
      "POST /api/progress - Update user progress"
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      status: err.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: {
      message: "Route not found",
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    }
  });
});

// Test database connection on startup
testConnection().then(connected => {
  if (connected) {
    console.log("🚀 Server ready with database connection");
  } else {
    console.log("⚠️  Server ready but database connection failed");
  }
});

// Must export express instance for Node Functions
export default app;
