const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* ======================================================
   GET DASHBOARD DATA (ADMIN)
   Header: x-user-id
====================================================== */
router.get("/", async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({ message: "User ID required" });
        }

        // Get user role
        const [[user]] = await db.query(
            "SELECT role FROM users WHERE id = ?",
            [userId]
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === 'admin') {
            // Admin dashboard data
            const [quotationSummary] = await db.query(`
                SELECT status, COUNT(*) as count
                FROM quotation
                GROUP BY status
            `);

            const [quotationNotifications] = await db.query(`
                SELECT
                CONCAT('QT-', q.id) AS ref,
                q.status,
                q.created_at AS date
                FROM quotation q
                WHERE q.status IN ('Rejected', 'Approved', 'Sent', 'Revised', 'Rejected', 'Expired')
                ORDER BY q.created_at DESC
                LIMIT 5
            `);

            const [invoiceSummary] = await db.query(`
                SELECT status, COUNT(*) as count
                FROM invoice
                GROUP BY status
            `);

            const [recentInvoices] = await db.query(`
                SELECT i.invoice_number, c.company_name, i.total, i.status, i.due_date
                FROM invoice i
                JOIN client c ON i.client_id = c.id
                ORDER BY i.created_at DESC
                LIMIT 5
            `);

            const [overdueNotifications] = await db.query(`
                SELECT i.invoice_number, c.company_name, i.total, i.status, i.due_date,
                       DATEDIFF(CURDATE(), i.due_date) AS days_overdue
                FROM invoice i
                JOIN client c ON i.client_id = c.id
                WHERE i.status IN ('Issued', 'Partially Paid', 'Overdue')
                ORDER BY DATEDIFF(CURDATE(), i.due_date) DESC
                LIMIT 5
            `);

            return res.json({
                role: "admin",
                quotationSummary,
                invoiceSummary,
                recentInvoices,
                overdueNotifications,
                quotationNotifications
            });
        } else {
            return res.status(403).json({ message: "Invalid role" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;