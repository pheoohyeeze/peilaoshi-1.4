import express from "express";
import { query, transaction } from "../../config/database.js";

const router = express.Router();

// POST /api/vocabulary - Create new vocabulary
router.post("/", async (req, res) => {
  try {
    const { 
      chinese, 
      pinyin, 
      english, 
      hsk_level, 
      lesson_id,
      difficulty = 1,
      notes = ""
    } = req.body;

    // Validate required fields
    if (!chinese || !pinyin || !english || !hsk_level) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: chinese, pinyin, english, hsk_level"
      });
    }

    // Check for duplicates
    const existing = await query(
      "SELECT id FROM vocabulary WHERE chinese = ? AND hsk_level = ?",
      [chinese, hsk_level]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Vocabulary already exists for this HSK level"
      });
    }

    // Insert new vocabulary
    const result = await query(`
      INSERT INTO vocabulary 
      (chinese, pinyin, english, hsk_level, lesson_id, difficulty, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [chinese, pinyin, english, hsk_level, lesson_id, difficulty, notes]);

    // Fetch created vocabulary
    const vocabulary = await query(
      "SELECT * FROM vocabulary WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: vocabulary[0],
      message: "Vocabulary created successfully"
    });

  } catch (error) {
    console.error("Error creating vocabulary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create vocabulary",
      message: error.message
    });
  }
});

// POST /api/vocabulary/batch - Create multiple vocabulary items
router.post("/batch", async (req, res) => {
  try {
    const { vocabulary_list } = req.body;

    if (!Array.isArray(vocabulary_list) || vocabulary_list.length === 0) {
      return res.status(400).json({
        success: false,
        error: "vocabulary_list must be a non-empty array"
      });
    }

    const results = await transaction(async (connection) => {
      const created = [];
      
      for (const item of vocabulary_list) {
        const { chinese, pinyin, english, hsk_level, lesson_id, difficulty = 1, notes = "" } = item;
        
        // Validate required fields
        if (!chinese || !pinyin || !english || !hsk_level) {
          throw new Error(`Missing required fields for item: ${chinese || 'unknown'}`);
        }

        // Insert vocabulary
        const [result] = await connection.execute(`
          INSERT INTO vocabulary 
          (chinese, pinyin, english, hsk_level, lesson_id, difficulty, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [chinese, pinyin, english, hsk_level, lesson_id, difficulty, notes]);

        // Fetch created vocabulary
        const [vocabulary] = await connection.execute(
          "SELECT * FROM vocabulary WHERE id = ?",
          [result.insertId]
        );

        created.push(vocabulary[0]);
      }

      return created;
    });

    res.status(201).json({
      success: true,
      data: results,
      message: `${results.length} vocabulary items created successfully`
    });

  } catch (error) {
    console.error("Error creating batch vocabulary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create vocabulary batch",
      message: error.message
    });
  }
});

// GET /api/vocabulary/search - Search vocabulary
router.get("/search", async (req, res) => {
  try {
    const { q, level = null, limit = 10 } = req.query;

    if (!q || q.trim().length < 1) {
      return res.status(400).json({
        success: false,
        error: "Search query is required"
      });
    }

    let sql = `
      SELECT * FROM vocabulary 
      WHERE (chinese LIKE ? OR pinyin LIKE ? OR english LIKE ?)
    `;
    const params = [`%${q}%`, `%${q}%`, `%${q}%`];

    if (level) {
      sql += " AND hsk_level = ?";
      params.push(level);
    }

    sql += " ORDER BY CASE WHEN chinese = ? THEN 1 WHEN chinese LIKE ? THEN 2 ELSE 3 END LIMIT ?";
    params.push(q, `${q}%`, parseInt(limit));

    const results = await query(sql, params);

    res.json({
      success: true,
      data: results,
      query: q
    });

  } catch (error) {
    console.error("Error searching vocabulary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search vocabulary",
      message: error.message
    });
  }
});

export default router;
