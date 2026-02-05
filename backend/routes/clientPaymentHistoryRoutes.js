const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const [[client]] = await db.query(
            "SELECT id FROM client WHERE user_id = ?",
            [userId]
        );

        if (!client) {
            return res.status(404).json({ message: "Client tidak ditemukan" });
        }

        const [rows] = await db.query(`
    (
        /* 1. AMBIL HISTORI QUOTATION */
        SELECT
            q.id AS quotation_id,
            q.quotation_number,
            NULL AS invoice_number,
            c.company_name,
            pr.project_title,
            'quotation' AS source,
            qsl.status AS event_status,
            qsl.description AS event_description,
            qsl.created_at AS event_time,
            NULL AS amount_paid,
            NULL AS term_number,
            u.username AS user,
            /* Priority 1 untuk alur quotation */
            CASE 
                WHEN qsl.status = 'Revised' THEN 1.1
                WHEN qsl.status = 'Sent' THEN 1.2
                ELSE 1.3
            END AS priority
        FROM quotation q
        JOIN quotation_status_logs qsl ON q.id = qsl.quotation_id
        LEFT JOIN users u ON qsl.created_by = u.id
        LEFT JOIN client c ON q.client_id = c.id
        LEFT JOIN project pr ON q.project_id = pr.id
        WHERE q.client_id = ?
          /* TAMBAHKAN 'Revised' DI SINI */
          AND qsl.status IN ('Sent', 'Approved', 'Rejected', 'Revised') 
    )

    UNION ALL

    (
        /* 2. AMBIL HISTORI INVOICE + TERM NUMBER */
        SELECT
            q.id AS quotation_id,
            q.quotation_number,
            i.invoice_number,
            c.company_name,
            pr.project_title,
            'invoice' AS source,
            isl.status AS event_status,
            isl.description AS event_description,
            isl.created_at AS event_time,
            p.amount_paid AS amount_paid,
            qt.term_number AS term_number,
            u.username AS user,
            CASE
                WHEN isl.description LIKE 'Invoice published%' THEN 2
                WHEN isl.description LIKE 'Payment received%' THEN 3
                ELSE 4
            END AS priority
        FROM invoice i
        JOIN invoice_status_logs isl ON i.id = isl.invoice_id
        JOIN quotation q ON i.quotation_id = q.id
        LEFT JOIN quotation_terms qt ON i.quotation_term_id = qt.id
        LEFT JOIN payment p ON i.id = p.invoice_id AND isl.status = 'Paid' AND isl.description LIKE 'Payment received%'
        LEFT JOIN users u ON isl.created_by = u.id
        LEFT JOIN client c ON q.client_id = c.id
        LEFT JOIN project pr ON q.project_id = pr.id
        WHERE q.client_id = ?
          AND (
            isl.description LIKE 'Invoice published%' OR 
            isl.description LIKE 'Payment received%'
          )
    )

    ORDER BY event_time ASC, priority ASC
`, [client.id, client.id]);

        const result = {};

        rows.forEach(row => {
            if (!result[row.quotation_id]) {
                result[row.quotation_id] = {
                    quotation: {
                        id: row.quotation_id,
                        quotation_number: row.quotation_number
                    },
                    client: { company_name: row.company_name },
                    project: { project_title: row.project_title },
                    timeline: []
                };
            }

            let displayDescription = row.event_description;

            if (row.event_status === 'Revised') {
                displayDescription = 'Quotation revised';
            } else if (row.event_status === 'Sent') {
                displayDescription = 'Quotation sent';
            } else if (row.event_description && row.event_description.includes('Payment received')) {
                displayDescription = 'Payment has been completed';
            }

            result[row.quotation_id].timeline.push({
                source: row.source,
                type: row.source,
                status: row.event_status,
                description: displayDescription,
                time: row.event_time,
                amount: row.amount_paid,
                user: row.user,
                invoice_number: row.invoice_number,
                term_number: row.term_number
            });
        });

        res.json(Object.values(result));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error", detail: err.message });
    }
});

module.exports = router;