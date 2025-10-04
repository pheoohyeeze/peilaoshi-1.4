import express from "express";
import { query, transaction } from "../../config/database.js";

const router = express.Router();

// GET /api/progress - Get user progress
router.get("/", async (req, res) => {
  try {
    const { user_id = "default_user", level = null } = req.query;

    let sql = `
      SELECT 
        v.hsk_level,
        v.lesson_id,
        COUNT(v.id) as total_vocabulary,
        COUNT(p.vocabulary_id) as studied_count,
        COUNT(CASE WHEN p.mastery_level >= 3 THEN 1 END) as mastered_count
      FROM vocabulary v
      LEFT JOIN progress p ON v.id = p.vocabulary_id AND p.user_id = ?
    `;

    const params = [user_id];

    if (level) {
      sql += " WHERE v.hsk_level = ?";
      params.push(level);
    }

    sql += " GROUP BY v.hsk_level, v.lesson_id ORDER BY v.hsk_level, v.lesson_id";

    const progress = await query(sql, params);

    // Calculate overall statistics
    const overallStats = await query(`
      SELECT 
        COUNT(DISTINCT v.id) as total_vocabulary,
        COUNT(DISTINCT p.vocabulary_id) as studied_count,
        COUNT(CASE WHEN p.mastery_level >= 3 THEN 1 END) as mastered_count
      FROM vocabulary v
      LEFT JOIN progress p ON v.id = p.vocabulary_id AND p.user_id = ?
    `, [user_id]);

    res.json({
      success: true,
      data: {
        user_id,
        overall: overallStats[0],
        by_lesson: progress
      }
    });

  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch progress",
      message: error.message
    });
  }
});

// POST /api/progress - Update user progress
router.post("/", async (req, res) => {
  try {
    const { 
      user_id = "default_user",
      vocabulary_id,
      mastery_level,
      study_time,
      correct_count,
      incorrect_count,
      last_studied
    } = req.body;

    // Validate required fields
    if (!vocabulary_id || mastery_level === undefined) {
      return res.status(400).json({
        success: false,
        error: "vocabulary_id and mastery_level are required"
      });
    }

    // Validate mastery level
    if (mastery_level < 0 || mastery_level > 5) {
      return res.status(400).json({
        success: false,
        error: "mastery_level must be between 0 and 5"
      });
    }

    // Check if vocabulary exists
    const vocabulary = await query(
      "SELECT id FROM vocabulary WHERE id = ?",
      [vocabulary_id]
    );

    if (vocabulary.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Vocabulary not found"
      });
    }

    // Insert or update progress
    await query(`
      INSERT INTO progress 
      (user_id, vocabulary_id, mastery_level, study_time, correct_count, incorrect_count, last_studied, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        mastery_level = VALUES(mastery_level),
        study_time = COALESCE(VALUES(study_time), study_time),
        correct_count = COALESCE(VALUES(correct_count), correct_count) + correct_count,
        incorrect_count = COALESCE(VALUES(incorrect_count), incorrect_count) + incorrect_count,
        last_studied = VALUES(last_studied),
        updated_at = NOW()
    `, [user_id, vocabulary_id, mastery_level, study_time, correct_count, incorrect_count, last_studied]);

    // Fetch updated progress
    const progress = await query(
      "SELECT * FROM progress WHERE user_id = ? AND vocabulary_id = ?",
      [user_id, vocabulary_id]
    );

    res.json({
      success: true,
      data: progress[0],
      message: "Progress updated successfully"
    });

  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update progress",
      message: error.message
    });
  }
});

// GET /api/progress/statistics - Get detailed progress statistics
router.get("/statistics", async (req, res) => {
  try {
    const { user_id = "default_user" } = req.query;

    const stats = await query(`
      SELECT 
        p.mastery_level,
        COUNT(*) as count,
        AVG(p.study_time) as avg_study_time,
        SUM(p.correct_count) as total_correct,
        SUM(p.incorrect_count) as total_incorrect
      FROM progress p
      WHERE p.user_id = ?
      GROUP BY p.mastery_level
      ORDER BY p.mastery_level
    `, [user_id]);

    const recentActivity = await query(`
      SELECT 
        v.chinese,
        v.pinyin,
        v.english,
        p.mastery_level,
        p.last_studied
      FROM progress p
      JOIN vocabulary v ON p.vocabulary_id = v.id
      WHERE p.user_id = ?
      ORDER BY p.last_studied DESC
      LIMIT 10
    `, [user_id]);

    res.json({
      success: true,
      data: {
        by_mastery_level: stats,
        recent_activity: recentActivity
      }
    });

  } catch (error) {
    console.error("Error fetching progress statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch progress statistics",
      message: error.message
    });
  }
});

export default router;
