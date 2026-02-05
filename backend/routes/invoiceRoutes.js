const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* ======================================================
   GET USERNAME BY USER ID
====================================================== */
const getUsername = async (conn, userId) => {
    if (!userId) return 'Unknown';
    try {
        const [[user]] = await conn.query("SELECT username FROM users WHERE id = ?", [userId]);
        return user ? user.username : 'Unknown';
    } catch (err) {
        return 'Unknown';
    }
};



/* ======================================================
 Evaluate Invoice Status
====================================================== */
const evaluateInvoiceStatus = async (invoice_id, issued_by = null, conn = db) => {
    /* GET INVOICE */
    const [[invoice]] = await conn.query(
        "SELECT total, status, due_date FROM invoice WHERE id = ?",
        [invoice_id]
    );
    if (!invoice) return;

    /* GET PAID AMOUNT */
    const [[{ paid_amount }]] = await conn.query(`
        SELECT COALESCE(SUM(amount_paid), 0) AS paid_amount
        FROM payment
        WHERE invoice_id = ? AND payment_status = 'paid'
    `, [invoice_id]);

    let newStatus = "Issued";

    /* TOTAL PAID SAMA DENGAN TOTAL INVOICE */
    if (paid_amount == invoice.total) {
        newStatus = "Paid";
    }
    /* SEBAGIAN SUDAH DIBAYAR */
    else if (paid_amount > 0) {
        newStatus = "Partially Paid";
    }

    /* PRIORITAS OVERDUE */
    if (paid_amount < invoice.total && invoice.due_date < new Date().toISOString().split('T')[0]) {
        newStatus = "Overdue";
    }

    /* UPDATE STATUS JIKA BERUBAH */
    if (newStatus !== invoice.status) {
        await conn.query(
            "UPDATE invoice SET status = ? WHERE id = ?",
            [newStatus, invoice_id]
        );

        // Insert log for status change
        await conn.query(`
            INSERT INTO invoice_status_logs
            (invoice_id, status, description, created_by, issued_at)
            VALUES (?, ?, ?, ?, NOW())
        `, [invoice_id, newStatus, `Status changed to ${newStatus}`, issued_by]);
    }
};

/* ======================================================
   GENERATE INVOICE NUMBER (Otomatis)
====================================================== */
const generateInvoiceNumber = async (conn, client_id, invoice_id, created_at) => {
    const [[client]] = await conn.query(
        "SELECT company_code, subcompany_code FROM client WHERE id = ?",
        [client_id]
    );
    if (!client || !client.company_code) {
        throw new Error("Client company_code not found");
    }
    const date = new Date(created_at).toISOString().slice(0, 10).replace(/-/g, '');
    const code = client.subcompany_code ? `${client.company_code}-${client.subcompany_code}` : client.company_code;
    return `${date}-${code}-${invoice_id}`;
};

/* ======================================================
   GET ALL INVOICES
====================================================== */
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT i.*, i.term_condition, c.company_name, q.quotation_number
            FROM invoice i
            JOIN client c ON i.client_id = c.id
            LEFT JOIN quotation q ON i.quotation_id = q.id
            ORDER BY i.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ======================================================
    GET INVOICE DETAIL
====================================================== */
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [[invoice]] = await db.query(`
                SELECT i.*, i.term_condition, c.company_name, c.address, c.pic_name, c.contact, p.project_title, p.start_date, p.end_date
                FROM invoice i
                JOIN client c ON i.client_id = c.id
                LEFT JOIN quotation q ON i.quotation_id = q.id
                LEFT JOIN project p ON q.project_id = p.id
                WHERE i.id = ?
          `, [id]);
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const [items] = await db.query(
            "SELECT * FROM invoice_items WHERE invoice_id = ?",
            [id]
        );

        const [terms] = await db.query(
            "SELECT * FROM quotation_terms WHERE id = ?",
            [invoice.quotation_term_id]
        );

        const [payments] = await db.query(
            "SELECT * FROM payment WHERE invoice_id = ? ORDER BY payment_date",
            [id]
        );

        // Add payment_date and payment_status to terms
        terms.forEach(term => {
            if (payments.length > 0) {
                term.payment_date = payments[0].payment_date;
                term.payment_status = payments[0].payment_status;
            } else {
                term.payment_date = null;
                term.payment_status = 'unpaid';
            }
        });

        // Calculate subtotal as sum of item totals
        const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);
        let discount = Number(invoice.discount) || 0;
        let tax = Number(invoice.tax) || 0;

        // Convert discount and tax to absolute values for display if they are percent
        if (invoice.discount_type === 'percent' && subtotal > 0) {
            discount = (subtotal * discount) / 100;
        }
        if (invoice.tax_type === 'percent' && subtotal > 0) {
            tax = (subtotal * tax) / 100;
        }

        const total = terms[0].nominal;

        if (invoice.discount_type === 'percent' && subtotal > 0) {
            discount = (discount / subtotal) * 100;
        }
        if (invoice.tax_type === 'percent' && subtotal > 0) {
            tax = (tax / subtotal) * 100;
        }

        res.json({
            invoice: {
                ...invoice,
                subtotal,
                discount,
                tax,
                total
            },
            items,
            terms,
            payments
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ======================================================
   CREATE INVOICE FROM APPROVED QUOTATION
   STATUS DEFAULT: Draft
   ONE INVOICE PER TERM
====================================================== */
router.post("/from-quotation/:quotation_id", async (req, res) => {
    const { quotation_id } = req.params;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [[quotation]] = await conn.query(
            "SELECT *, term_condition FROM quotation WHERE id = ? AND status = 'Approved'",
            [quotation_id]
        );

        if (!quotation) {
            return res.status(400).json({
                message: "Quotation belum approved"
            });
        }

        /* GET TERMS */
        const [qTerms] = await conn.query(
            "SELECT * FROM quotation_terms WHERE quotation_id = ? ORDER BY term_number",
            [quotation.id]
        );

        if (qTerms.length === 0) {
            return res.status(400).json({
                message: "Quotation tidak memiliki terms"
            });
        }

        /* GET ITEMS */
        const [qItems] = await conn.query(
            "SELECT qi.*, i.name AS item_name, i.unit FROM quotation_items qi JOIN items i ON qi.item_id = i.id WHERE qi.quotation_id = ?",
            [quotation.id]
        );

        const createdInvoices = [];

        for (const term of qTerms) {
            const [result] = await conn.query(`
                INSERT INTO invoice
            (invoice_number, quotation_id, quotation_term_id, client_id, issue_date, due_date,
                subtotal, discount, tax, total, status, term_condition, created_by)
        VALUES(NULL, ?, ?, ?, NULL, ?, ?, 0, 0, ?, 'Draft', ?, ?)
            `, [
                quotation.id,
                term.id,
                quotation.client_id,
                term.term_estimate,
                term.nominal,
                term.nominal,
                quotation.term_condition,
                quotation.created_by
            ]);

            const invoiceId = result.insertId;

            // Get created_at from the inserted invoice
            const [[invoice]] = await conn.query(
                "SELECT created_at FROM invoice WHERE id = ?",
                [invoiceId]
            );

            // Generate invoice number automatically using created_at
            const invoiceNumber = await generateInvoiceNumber(conn, quotation.client_id, invoiceId, invoice.created_at);

            // Update invoice with generated number
            await conn.query(
                "UPDATE invoice SET invoice_number = ? WHERE id = ?",
                [invoiceNumber, invoiceId]
            );

            createdInvoices.push(invoiceId);

            // Insert log for invoice creation
            const username = await getUsername(conn, quotation.created_by);
            await conn.query(`
                INSERT INTO invoice_status_logs
                (invoice_id, status, description, created_by, issued_at)
                VALUES (?, 'Draft', ?, ?, NOW())
            `, [invoiceId, `Invoice created\nBy: ${username}`, quotation.created_by]); // Use quotation's created_by

            /* COPY ITEMS */
            let subtotal = 0;
            for (const item of qItems) {
                const total = item.qty * item.price;
                subtotal += total;
                await conn.query(`
                    INSERT INTO invoice_items
            (invoice_id, item_name, description, qty, unit, price, total)
        VALUES(?, ?, ?, ?, ?, ?, ?)
            `, [
                    invoiceId,
                    item.item_name,
                    item.description,
                    item.qty,
                    item.unit,
                    item.price,
                    total
                ]);
            }

            // Update invoice with calculated subtotal (total remains as term.nominal)
            await conn.query(`
                UPDATE invoice
                SET subtotal = ?
            WHERE id = ?
                `, [subtotal, invoiceId]);
        }

        await conn.commit();
        res.status(201).json({
            message: `${createdInvoices.length} invoice draft berhasil dibuat`,
            invoice_ids: createdInvoices
        });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        conn.release();
    }
});

/* ======================================================
   PUBLISH INVOICE (ADMIN)
====================================================== */
router.put("/:id/publish", async (req, res) => {
    const { id } = req.params;
    const { issued_by } = req.body || {};
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [[invoice]] = await conn.query(
            "SELECT status FROM invoice WHERE id = ?",
            [id]
        );

        if (!invoice || invoice.status !== "Draft") {
            return res.status(400).json({
                message: "Invoice tidak bisa dipublish"
            });
        }

        await conn.query(`
            UPDATE invoice
            SET status = 'Issued',
            issued_at = NOW(),
            issue_date = CURDATE(),
            due_date = DATE_ADD(CURDATE(), INTERVAL 1 MONTH)
            WHERE id = ?
            `, [id]);

        // Regenerate invoice number with issue_date
        const [[invoiceDetails]] = await conn.query(
            "SELECT client_id FROM invoice WHERE id = ?",
            [id]
        );
        const newInvoiceNumber = await generateInvoiceNumber(conn, invoiceDetails.client_id, id, new Date().toISOString().split('T')[0]);
        await conn.query(
            "UPDATE invoice SET invoice_number = ? WHERE id = ?",
            [newInvoiceNumber, id]
        );



        // Insert log for publishing invoice untuk pelacakan
        const username = await getUsername(conn, issued_by);

        await conn.query(`
    INSERT INTO invoice_status_logs
    (invoice_id, status, description, created_by, issued_by, issued_at)
    VALUES (?, 'Issued', ?, ?, ?, NOW())
`, [
            id,
            'Invoice published',
            issued_by,
            issued_by
        ]);

        await conn.commit();
        res.json({ message: "Invoice berhasil dipublish" });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        conn.release();
    }
});


/* ======================================
   PAY INVOICE (CLIENT)
====================================== */
router.post("/:invoice_id/pay", async (req, res) => {
    const { invoice_id } = req.params;
    const { amount_paid, payment_date } = req.body;

    if (!amount_paid || amount_paid <= 0) {
        return res.status(400).json({
            message: "amount wajib diisi dan harus lebih dari 0"
        });
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        /* CEK INVOICE */
        const [[invoice]] = await conn.query(
            "SELECT id, status, total, client_id FROM invoice WHERE id = ?",
            [invoice_id]
        );

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice tidak ditemukan"
            });
        }

        /* GET CLIENT USER_ID */
        const [[{ user_id }]] = await conn.query(
            "SELECT user_id FROM client WHERE id = ?",
            [invoice.client_id]
        );

        /* CEK STATUS INVOICE */
        if (!["Issued", "Partially Paid", "Overdue"].includes(invoice.status)) {
            return res.status(400).json({
                message: "Invoice tidak bisa menerima pembayaran"
            });
        }

        /* CEK TOTAL PEMBAYARAN TIDAK MELEBIHI TOTAL INVOICE */
        const [[{ paid_amount }]] = await conn.query(`
            SELECT COALESCE(SUM(amount_paid), 0) AS paid_amount
            FROM payment
            WHERE invoice_id = ? AND payment_status = 'paid'
            `, [invoice_id]);

        // Use rounding to handle floating point precision issues
        const totalPaid = Math.round((paid_amount + Number(amount_paid)) * 100) / 100;
        const invoiceTotal = Math.round(invoice.total * 100) / 100;

        if (totalPaid > invoiceTotal) {
            return res.status(400).json({
                message: "Total pembayaran melebihi jumlah tagihan"
            });
        }

        /* INSERT PAYMENT */
        await conn.query(`
            INSERT INTO payment
            (invoice_id, payment_date, amount_paid, payment_status, paid_by, paid_at)
        VALUES(?, ?, ?, 'paid', ?, NOW())
        `, [invoice_id, payment_date || new Date().toISOString().split('T')[0], amount_paid, user_id]);

        // Get username for log
        const username = await getUsername(conn, user_id);

        // Insert log for payment
        await conn.query(`
            INSERT INTO invoice_status_logs
            (invoice_id, status, description, created_by)
            VALUES (?, 'Paid', ?, ?)
        `, [invoice_id, `Payment received`, user_id]);

        await evaluateInvoiceStatus(invoice_id, user_id, conn);

        await conn.commit();
        res.json({
            message: `Pembayaran sebesar ${amount_paid} berhasil`
        });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        conn.release();
    }
});


/* ======================================================
   UPDATE INVOICE NUMBER AND TERM CONDITION (ONLY DRAFT)
====================================================== */
router.put("/:id/update-draft", async (req, res) => {
    const { id } = req.params;
    const { invoice_number, term_condition, updated_by } = req.body;

    if (!invoice_number) {
        return res.status(400).json({ message: "invoice_number wajib diisi" });
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [[invoice]] = await conn.query(
            "SELECT status FROM invoice WHERE id = ?",
            [id]
        );


        if (!invoice) {
            await conn.rollback();
            return res.status(404).json({ message: "Invoice not found" });
        }

        if (invoice.status !== "Draft") {
            return res.status(400).json({
                message: "Hanya invoice draft yang bisa diperbarui!"
            });
        }

        await conn.query(
            "UPDATE invoice SET invoice_number = ?, term_condition = ? WHERE id = ?",
            [invoice_number, term_condition, id]
        );

        const username = await getUsername(conn, updated_by)

        await conn.query(`
            INSERT INTO invoice_status_logs 
            (invoice_id, status, description, created_by) 
            VALUES (?, 'Draft', ?, ?)
        `, [
            id,
            `Invoice updated`,
            updated_by
        ]);

        await conn.commit();
        res.json({ message: "Invoice berhasil diupdate!" });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        if (conn) conn.release();
    }
});

/* ======================================================
   DELETE INVOICE (ONLY DRAFT)
====================================================== */
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [[invoice]] = await conn.query(
            "SELECT status FROM invoice WHERE id = ?",
            [id]
        );

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        if (invoice.status !== "Draft") {
            return res.status(400).json({
                message: "Invoice yang sudah dipublish tidak bisa dihapus"
            });
        }

        await conn.query("DELETE FROM invoice_items WHERE invoice_id = ?", [id]);
        await conn.query("DELETE FROM invoice_status_logs WHERE invoice_id = ?", [id]);
        await conn.query("DELETE FROM invoice WHERE id = ?", [id]);


        await conn.commit();
        res.json({ message: "Invoice draft berhasil dihapus" });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        conn.release();
    }
});

module.exports = router;

/* =========================================================
   TESTING VIA POSTMAN
=========================================================

 GET ALL INVOICES
GET http://localhost:3000/api/invoices

----------------------------------------------------------

 GET INVOICE DETAIL
GET http://localhost:3000/api/invoices/1

----------------------------------------------------------

 CREATE INVOICE FROM QUOTATION (APPROVED ONLY)
POST http://localhost:3000/api/invoices/from-quotation/1

----------------------------------------------------------

 PUBLISH INVOICE (ADMIN)
PUT http://localhost:3000/api/invoices/1/publish

----------------------------------------------------------

 PAY TERMIN (CLIENT)
POST http://localhost:3000/api/invoices/1/pay-term
Body (raw JSON):
{
    "term_number": 1,
    "nominal": 545000
}

----------------------------------------------------------

 DELETE INVOICE (DRAFT ONLY)
DELETE http://localhost:3000/api/invoices/1

========================================================= */
