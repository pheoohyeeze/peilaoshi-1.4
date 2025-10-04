import express from "express";
import { query } from "../../config/database.js";

const router = express.Router();

// GET /api/vocabulary/[id] - Get specific vocabulary by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const vocabulary = await query(
      "SELECT * FROM vocabulary WHERE id = ?",
      [id]
    );

    if (vocabulary.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Vocabulary not found"
      });
    }

    res.json({
      success: true,
      data: vocabulary[0]
    });

  } catch (error) {
    console.error("Error fetching vocabulary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch vocabulary",
      message: error.message
    });
  }
});

// PUT /api/vocabulary/[id] - Update specific vocabulary
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      chinese, 
      pinyin, 
      english, 
      hsk_level, 
      lesson_id,
      difficulty,
      notes 
    } = req.body;

    // Check if vocabulary exists
    const existing = await query(
      "SELECT id FROM vocabulary WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Vocabulary not found"
      });
    }

    // Update vocabulary
    await query(`
      UPDATE vocabulary 
      SET 
        chinese = COALESCE(?, chinese),
        pinyin = COALESCE(?, pinyin),
        english = COALESCE(?, english),
        hsk_level = COALESCE(?, hsk_level),
        lesson_id = COALESCE(?, lesson_id),
        difficulty = COALESCE(?, difficulty),
        notes = COALESCE(?, notes),
        updated_at = NOW()
      WHERE id = ?
    `, [chinese, pinyin, english, hsk_level, lesson_id, difficulty, notes, id]);

    // Fetch updated vocabulary
    const updated = await query(
      "SELECT * FROM vocabulary WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      data: updated[0],
      message: "Vocabulary updated successfully"
    });

  } catch (error) {
    console.error("Error updating vocabulary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update vocabulary",
      message: error.message
    });
  }
});

// DELETE /api/vocabulary/[id] - Delete specific vocabulary
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vocabulary exists
    const existing = await query(
      "SELECT id FROM vocabulary WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Vocabulary not found"
      });
    }

    // Delete vocabulary
    await query("DELETE FROM vocabulary WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Vocabulary deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting vocabulary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete vocabulary",
      message: error.message
    });
  }
});

export default router;
