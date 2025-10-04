import express from "express";
import { query } from "../../config/database.js";

const router = express.Router();

// GET /api/vocabulary/list - Get vocabulary list with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      level = null, 
      lesson = null, 
      search = null 
    } = req.query;

    const offset = (page - 1) * limit;
    let sql = "SELECT * FROM vocabulary WHERE 1=1";
    const params = [];

    // Add filters
    if (level) {
      sql += " AND hsk_level = ?";
      params.push(level);
    }

    if (lesson) {
      sql += " AND lesson_id = ?";
      params.push(lesson);
    }

    if (search) {
      sql += " AND (chinese LIKE ? OR pinyin LIKE ? OR english LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add pagination
    sql += " ORDER BY id LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    // Get total count for pagination
    let countSql = "SELECT COUNT(*) as total FROM vocabulary WHERE 1=1";
    const countParams = [];

    if (level) {
      countSql += " AND hsk_level = ?";
      countParams.push(level);
    }

    if (lesson) {
      countSql += " AND lesson_id = ?";
      countParams.push(lesson);
    }

    if (search) {
      countSql += " AND (chinese LIKE ? OR pinyin LIKE ? OR english LIKE ?)";
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [vocabulary, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, countParams)
    ]);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        vocabulary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error fetching vocabulary list:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch vocabulary list",
      message: error.message
    });
  }
});

// GET /api/vocabulary/list/stats - Get vocabulary statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        hsk_level,
        COUNT(*) as count
      FROM vocabulary 
      GROUP BY hsk_level 
      ORDER BY hsk_level
    `);

    const total = await query("SELECT COUNT(*) as total FROM vocabulary");
    const lessons = await query("SELECT DISTINCT lesson_id FROM vocabulary ORDER BY lesson_id");

    res.json({
      success: true,
      data: {
        total: total[0].total,
        byLevel: stats,
        lessons: lessons.map(l => l.lesson_id)
      }
    });

  } catch (error) {
    console.error("Error fetching vocabulary stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch vocabulary statistics",
      message: error.message
    });
  }
});

export default router;
