const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Validation function
const validateItemData = (data) => {
    const { item_name, description, category, default_price, unit } = data;
    const errors = [];

    if (!item_name || typeof item_name !== 'string' || item_name.trim().length === 0) {
        errors.push("item_name is required and must be a non-empty string.");
    }
    if (description && typeof description !== 'string') {
        errors.push("description must be a string.");
    }
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
        errors.push("category is required and must be a non-empty string.");
    }
    if (default_price === undefined || default_price === null || isNaN(parseFloat(default_price))) {
        errors.push("default_price is required and must be a valid number.");
    }
    const validUnits = ['day', 'month', 'year', 'unit'];
    if (!unit || !validUnits.includes(unit)) {
        errors.push(`unit is required and must be one of: ${validUnits.join(', ')}.`);
    }

    return errors;
};

// GET Deleted Items
router.get("/trash", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM item WHERE deleted_at IS NOT NULL");
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Restore Items
router.put("/restore/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query("UPDATE item SET deleted_at = NULL WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Item tidak ditemukan" });
        res.json({ message: "Item berhasil dipulihkan!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET All Active Items
router.get("/", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM item WHERE deleted_at IS NULL");
        res.json(results);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Permanent Delete Items
router.delete("/permanent/:id", async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Check if item exists and is soft deleted
        const [itemRows] = await conn.query("SELECT * FROM item WHERE id = ? AND deleted_at IS NOT NULL", [id]);
        if (itemRows.length === 0) throw new Error("Item tidak ditemukan atau belum dihapus");

        await conn.query("DELETE FROM item WHERE id = ?", [id]);

        await conn.commit();
        res.json({ message: "Item dihapus permanen dari database" });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        conn.release();
    }
});

// Soft Delete Items
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query("UPDATE item SET deleted_at = NOW() WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Item tidak ditemukan" });

        res.json({ message: "Item dipindahkan ke sampah" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET Item by ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [results] = await db.query("SELECT * FROM item WHERE id = ?", [id]);
        if (results.length === 0) {
            return res.status(404).json({ message: "Item not found" });
        }
        res.json(results[0]);
    } catch (err) {
        res.status(500).json(err);
    }
});

// CREATE New Item
router.post("/", async (req, res) => {
    const { item_name, description, category, default_price, unit } = req.body;

    const validationErrors = validateItemData({ item_name, description, category, default_price, unit });
    if (validationErrors.length > 0) {
        return res.status(400).json({ message: "Validation errors", errors: validationErrors });
    }

    const insertItemSql = "INSERT INTO item (item_name, description, default_price, unit, category) VALUES (?, ?, ?, ?, ?)";

    try {
        await db.query(insertItemSql, [item_name, description || null, parseFloat(default_price), unit, category]);
        res.json({ message: "Item berhasil di tambahkan!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error", detail: err.sqlMessage });
    }
});

// UPDATE Item
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { item_name, description, category, default_price, unit } = req.body;

    const validationErrors = validateItemData({ item_name, description, category, default_price, unit });
    if (validationErrors.length > 0) {
        return res.status(400).json({ message: "Validation errors", errors: validationErrors });
    }

    const updateItemSql = "UPDATE item SET item_name = ?, description = ?, category = ?, default_price = ?, unit = ? WHERE id = ?";

    try {
        const [result] = await db.query(updateItemSql, [item_name, description || null, category, parseFloat(default_price), unit, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Item not found" });
        }
        res.json({ message: "Item berhasil diperbarui!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error", detail: err.sqlMessage });
    }
});

module.exports = router;

// Cara Test di POSTMAN
// GET http://localhost:3000/api/items/
// GET http://localhost:3000/api/items/1
// POST http://localhost:3000/api/items/
// PUT http://localhost:3000/api/items/1
// DELETE http://localhost:3000/api/items/1
