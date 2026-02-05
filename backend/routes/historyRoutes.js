const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
      (
        /* 1. AMBIL HISTORI QUOTATION */
        SELECT
          q.id AS quotation_id,
          q.quotation_number,
          NULL AS invoice_number, -- Quotation belum punya invoice number
          c.company_name,
          pr.project_title,
          'quotation' AS source,
          qsl.status AS event_status,
          qsl.description AS event_description,
          qsl.created_at AS event_time,
          NULL AS amount_paid,
          NULL AS term_number,
          u.username AS user,
          1 AS priority
        FROM quotation q
        JOIN quotation_status_logs qsl ON q.id = qsl.quotation_id
        LEFT JOIN users u ON qsl.created_by = u.id
        LEFT JOIN client c ON q.client_id = c.id
        LEFT JOIN project pr ON q.project_id = pr.id
      )

      UNION ALL

      (
        /* 2. AMBIL HISTORI INVOICE DENGAN DATA PAYMENT & TERMIN */
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
            WHEN isl.description LIKE 'Invoice created%' THEN 2
            WHEN isl.description LIKE 'Status changed%' THEN 3
            ELSE 4
          END AS priority
        FROM invoice i
        JOIN invoice_status_logs isl ON i.id = isl.invoice_id
        JOIN quotation q ON i.quotation_id = q.id
        LEFT JOIN quotation_terms qt ON i.quotation_term_id = qt.id
        /* Join ke payment untuk data pembayaran */
        LEFT JOIN payment p ON i.id = p.invoice_id AND isl.status = 'Paid' AND isl.description LIKE 'Payment received%'
        LEFT JOIN users u ON isl.created_by = u.id
        LEFT JOIN client c ON q.client_id = c.id
        LEFT JOIN project pr ON q.project_id = pr.id
      )

      ORDER BY event_time ASC, priority ASC
    `);

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


            let finalDescription = row.event_description;

            if (row.source === 'invoice') {
                if (row.event_description.includes('Invoice created')) {
                    finalDescription = `Invoice created `;
                } else if (row.event_description.includes('Payment received')) {
                    finalDescription = `Payment received`;
                }
            }

            result[row.quotation_id].timeline.push({
                source: row.source,
                type: row.source,
                status: row.event_status,
                description: finalDescription,
                time: row.event_time,
                amount: row.amount_paid,
                term_number: row.term_number,
                invoice_number: row.invoice_number,

                quotation_number: row.quotation_number,
                user: row.user
            });
        });

        res.json(Object.values(result));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load history", detail: err.message });
    }
});
module.exports = router;
