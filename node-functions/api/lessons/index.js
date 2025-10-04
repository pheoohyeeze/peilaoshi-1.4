import express from "express";
import { query } from "../../config/database.js";

const router = express.Router();

// GET /api/lessons - Get lessons list
router.get("/", async (req, res) => {
  try {
    const { level = null } = req.query;

    let sql = `
      SELECT 
        lesson_id,
        hsk_level,
        COUNT(*) as vocabulary_count,
        MIN(id) as first_vocabulary_id,
        MAX(id) as last_vocabulary_id
      FROM vocabulary 
      WHERE 1=1
    `;

    const params = [];

    if (level) {
      sql += " AND hsk_level = ?";
      params.push(level);
    }

    sql += " GROUP BY lesson_id, hsk_level ORDER BY hsk_level, lesson_id";

    const lessons = await query(sql, params);

    res.json({
      success: true,
      data: lessons
    });

  } catch (error) {
    console.error("Error fetching lessons:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch lessons",
      message: error.message
    });
  }
});

// GET /api/lessons/:lessonId/vocabulary - Get vocabulary for specific lesson
router.get("/:lessonId/vocabulary", async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { user_id = "default_user" } = req.query;

    const vocabulary = await query(`
      SELECT 
        v.*,
        p.mastery_level,
        p.study_time,
        p.correct_count,
        p.incorrect_count,
        p.last_studied
      FROM vocabulary v
      LEFT JOIN progress p ON v.id = p.vocabulary_id AND p.user_id = ?
      WHERE v.lesson_id = ?
      ORDER BY v.id
    `, [user_id, lessonId]);

    res.json({
      success: true,
      data: vocabulary
    });

  } catch (error) {
    console.error("Error fetching lesson vocabulary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch lesson vocabulary",
      message: error.message
    });
  }
});

// GET /api/lessons/statistics - Get lesson statistics
router.get("/statistics", async (req, res) => {
  try {
    const { user_id = "default_user" } = req.query;

    const stats = await query(`
      SELECT 
        v.lesson_id,
        v.hsk_level,
        COUNT(v.id) as total_vocabulary,
        COUNT(p.vocabulary_id) as studied_count,
        COUNT(CASE WHEN p.mastery_level >= 3 THEN 1 END) as mastered_count,
        ROUND(AVG(p.mastery_level), 2) as avg_mastery_level
      FROM vocabulary v
      LEFT JOIN progress p ON v.id = p.vocabulary_id AND p.user_id = ?
      GROUP BY v.lesson_id, v.hsk_level
      ORDER BY v.hsk_level, v.lesson_id
    `, [user_id]);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error fetching lesson statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch lesson statistics",
      message: error.message
    });
  }
});

export default router;
