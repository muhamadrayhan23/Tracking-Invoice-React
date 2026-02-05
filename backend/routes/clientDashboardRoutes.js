// routes/dashboardClientRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/:id", async (req, res) => {
    const userId = req.params.id;

    try {
        /* =============================
           GET CLIENT ID FROM USER
        ============================== */
        const [[client]] = await db.query(
            "SELECT id FROM client WHERE user_id = ?",
            [userId]
        );

        if (!client) {
            // Return empty data if no client record found
            return res.json({
                quotations: [],
                invoices: [],
                paymentStatus: [],
                overdueInvoices: [],
                quotationSummary: [],
                invoiceSummary: []
            });
        }

        const clientId = client.id;

        /* =============================
           QUOTATIONS CLIENT
        ============================== */
        const [quotations] = await db.query(`
            SELECT
                q.id,
                p.project_title,
                q.estimate_date,
                q.expiry_date,
                q.subtotal,
                q.discount,
                q.tax,
                q.total,
                q.status,
                q.created_at
            FROM quotation q
            LEFT JOIN project p ON q.project_id = p.id
            WHERE q.client_id = ? AND q.status != 'draft'
            ORDER BY q.created_at DESC
        `, [clientId]);

        /* =============================
           INVOICES CLIENT
        ============================== */
        const [invoices] = await db.query(`
            SELECT
                i.id,
                i.invoice_number,
                i.issue_date,
                i.due_date,
                i.subtotal,
                i.discount,
                i.tax,
                i.total,
                i.status,
                p.project_title
            FROM invoice i
            LEFT JOIN quotation q ON i.quotation_id = q.id
            LEFT JOIN project p ON q.project_id = p.id
            WHERE i.client_id = ? AND i.status != 'Draft'
            ORDER BY i.created_at DESC
        `, [clientId]);

        /* =============================
           PAYMENT STATUS (TERMS) - FROM PAYMENT HISTORY
        ============================== */
        const [paymentStatus] = await db.query(`
    SELECT DISTINCT
        p.id,
        i.invoice_number,
        qt.term_number,
        p.amount_paid AS nominal,
        p.payment_status,
        p.payment_date
    FROM payment p
    JOIN invoice i ON p.invoice_id = i.id
    
    LEFT JOIN quotation_terms qt ON i.quotation_term_id = qt.id 
    WHERE i.client_id = ?
    ORDER BY p.payment_date DESC
    LIMIT 3
`, [clientId]);

        /* =============================
           QUOTATION SUMMARY
        ============================== */
        const [quotationSummary] = await db.query(`
            SELECT status, COUNT(*) as count FROM quotation WHERE client_id = ? AND status != 'Draft' GROUP BY status
        `, [clientId]);

        /* =============================
           INVOICE SUMMARY
        ============================== */
        const [invoiceSummary] = await db.query(`
            SELECT status, COUNT(*) as count FROM invoice WHERE client_id = ? AND status != 'Draft' GROUP BY status
        `, [clientId]);

        /* =============================
           OVERDUE INVOICES
        ============================== */
        const [overdueInvoices] = await db.query(`
            SELECT
                invoice_number,
                total,
                due_date
            FROM invoice
            WHERE client_id = ?
            AND status = 'Overdue'
        `, [clientId]);

        return res.json({
            quotations,
            invoices,
            paymentStatus,
            overdueInvoices,
            quotationSummary,
            invoiceSummary
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
