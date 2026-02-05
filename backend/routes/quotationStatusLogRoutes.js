const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* ======================================================
   GET ALL QUOTATION STATUS LOGS
====================================================== */
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT qsl.*, q.quotation_number, c.company_name
            FROM quotation_status_logs qsl
            JOIN quotation q ON qsl.quotation_id = q.id
            JOIN client c ON q.client_id = c.id
            ORDER BY qsl.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ======================================================
   GET STATUS LOGS FOR A SPECIFIC QUOTATION
====================================================== */
router.get("/quotation/:quotation_id", async (req, res) => {
    const { quotation_id } = req.params;

    try {
        // Get status logs with user names
        const [logs] = await db.query(`
            SELECT qsl.*, u.username as created_by_name,
                   ua.username as approved_by_name, ur.username as rejected_by_name,
                   us.username as sent_by_name, urev.username as revised_by_name
            FROM quotation_status_logs qsl
            LEFT JOIN users u ON qsl.created_by = u.id
            LEFT JOIN users ua ON qsl.approved_by = ua.id
            LEFT JOIN users ur ON qsl.rejected_by = ur.id
            LEFT JOIN users us ON qsl.sent_by = us.id
            LEFT JOIN users urev ON qsl.revised_by = urev.id
            WHERE quotation_id = ?
            ORDER BY created_at ASC
        `, [quotation_id]);

        // Format logs for Timeline component
        const timelineEvents = logs.map(log => {
            let user = '';
            if (log.created_by_name) user = log.created_by_name;
            else if (log.approved_by_name) user = log.approved_by_name;
            else if (log.rejected_by_name) user = log.rejected_by_name;
            else if (log.sent_by_name) user = log.sent_by_name;
            else if (log.revised_by_name) user = log.revised_by_name;

            return {
                type: 'quotation',
                description: log.description,
                user: user,
                time: log.created_at,
                status: log.status,
                amount: null // No amount for quotation logs
            };
        });

        res.json(timelineEvents);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ======================================================
   CREATE QUOTATION STATUS LOG
====================================================== */
router.post("/", async (req, res) => {
    const { quotation_id, old_status, new_status, created_by, notes } = req.body;

    // Validation
    if (!quotation_id || !new_status) {
        return res.status(400).json({ message: "quotation_id and new_status are required" });
    }

    try {
        const [result] = await db.query(`
            INSERT INTO quotation_status_logs
            (quotation_id, old_status, new_status, created_by, notes)
            VALUES (?, ?, ?, ?, ?)
        `, [quotation_id, old_status || null, new_status, created_by || null, notes || null]);

        res.status(201).json({
            message: "Status log created",
            log_id: result.insertId
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ======================================================
   UPDATE QUOTATION STATUS LOG
====================================================== */
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { old_status, new_status, created_by, notes } = req.body;

    try {
        await db.query(`
            UPDATE quotation_status_logs SET
            old_status=?, new_status=?, created_by=?, notes=?
            WHERE id=?
        `, [old_status || null, new_status, created_by || null, notes || null, id]);

        res.json({ message: "Status log updated" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ======================================================
   DELETE QUOTATION STATUS LOG
====================================================== */
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM quotation_status_logs WHERE id = ?", [id]);
        res.json({ message: "Status log deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
