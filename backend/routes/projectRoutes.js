const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Validation function
const validateProjectData = (data) => {
    const { client_id, project_title, description, start_date, end_date, status } = data;
    const errors = [];

    if (!client_id || isNaN(parseInt(client_id))) {
        errors.push("client_id is required and must be a valid integer.");
    }
    if (!project_title || typeof project_title !== 'string' || project_title.trim().length === 0) {
        errors.push("project_title is required and must be a non-empty string.");
    }
    if (description && typeof description !== 'string') {
        errors.push("description must be a string.");
    }
    if (!start_date || isNaN(Date.parse(start_date))) {
        errors.push("start_date is required and must be a valid date.");
    }
    if (end_date && isNaN(Date.parse(end_date))) {
        errors.push("end_date must be a valid date if provided.");
    }
    const validStatuses = ['Start', 'UAT', 'Complete'];
    if (!status || !validStatuses.includes(status)) {
        errors.push(`status is required and must be one of: ${validStatuses.join(', ')}.`);
    }

    return errors;
};

// GET Deleted Projects
router.get("/trash", async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT p.id, p.client_id, p.project_title, p.description,
                   DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
                   DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
                   p.status, c.company_name, DATE_FORMAT(p.deleted_at, '%Y-%m-%d %H:%i:%s') AS deleted_at
            FROM project p
            JOIN client c ON p.client_id = c.id
            WHERE p.deleted_at IS NOT NULL
        `);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// RESTORE Project
router.put("/restore/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE project SET deleted_at = NULL WHERE id = ?", [id]);
        res.json({ message: "Project berhasil dipulihkan!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET All Projects
router.get("/", async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT p.id, p.client_id, p.project_title, p.description,
                   DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
                   DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
                   p.status, c.company_name
            FROM project p
            JOIN client c ON p.client_id = c.id
            WHERE p.deleted_at IS NULL
        `);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET Project by ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [[result]] = await db.query(`
            SELECT p.id, p.client_id, p.project_title, p.description,
                   DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
                   DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
                   p.status, c.company_name
            FROM project p
            LEFT JOIN client c ON p.client_id = c.id
            WHERE p.id = ? AND p.deleted_at IS NULL
        `, [id]);

        if (!result) {
            return res.status(404).json({ message: "Project not found or has been deleted." });
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE New Project
router.post("/", async (req, res) => {
    const { client_id, project_title, description, start_date, end_date, status } = req.body;

    const validationErrors = validateProjectData({ client_id, project_title, description, start_date, end_date, status });
    if (validationErrors.length > 0) {
        return res.status(400).json({ message: "Validation errors", errors: validationErrors });
    }

    const insertProjectSql = `
        INSERT INTO project (client_id, project_title, description, start_date, end_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
        await db.query(insertProjectSql, [
            parseInt(client_id),
            project_title,
            description || null,
            start_date,
            end_date || null,
            status
        ]);
        res.json({ message: "Project berhasil ditambahkan!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error", detail: err.sqlMessage });
    }
});

// UPDATE Project
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { client_id, project_title, description, start_date, end_date, status } = req.body;

    const validationErrors = validateProjectData({ client_id, project_title, description, start_date, end_date, status });
    if (validationErrors.length > 0) {
        return res.status(400).json({ message: "Validation errors", errors: validationErrors });
    }

    const updateProjectSql = `
        UPDATE project
        SET client_id = ?, project_title = ?, description = ?, start_date = ?, end_date = ?, status = ?
        WHERE id = ?
    `;

    try {
        const [result] = await db.query(updateProjectSql, [
            parseInt(client_id),
            project_title,
            description || null,
            start_date,
            end_date || null,
            status,
            id
        ]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Project not found" });
        }
        res.json({ message: "Project berhasil diperbarui!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error", detail: err.sqlMessage });
    }
});

// DELETE Project
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const softDeleteProjectSql = "UPDATE project SET deleted_at = NOW() WHERE id = ?";

    try {
        const [result] = await db.query(softDeleteProjectSql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.json({ message: "Project berhasil dipindahkan ke sampah!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error", detail: err.sqlMessage });
    }
});

// PERMANENT DELETE 
router.delete("/permanent/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query("DELETE FROM project WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Project tidak ditemukan." });
        }

        res.json({ message: "Project telah dihapus secara permanen!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error", detail: err.sqlMessage });
    }
});

module.exports = router;
