const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* ======================================================
   GENERATE INVOICE NUMBER (Otomatis)
====================================================== */
const generateInvoiceNumber = async (conn) => {
    const [[row]] = await conn.query(
        "SELECT COUNT(*) AS total FROM invoice"
    );
    return `INV-${String(row.total + 1).padStart(5, "0")}`;
};

/* ======================================================
   GENERATE QUOTATION NUMBER (Otomatis)
====================================================== */
const generateQuotationNumber = async (conn, client_id, quotation_id, created_at) => {
    const [[client]] = await conn.query(
        "SELECT company_code, subcompany_code FROM client WHERE id = ?",
        [client_id]
    );
    if (!client || !client.company_code) {
        throw new Error("Client company_code not found");
    }
    const date = new Date(created_at).toISOString().slice(0, 10).replace(/-/g, '');
    const code = client.subcompany_code ? `${client.company_code}-${client.subcompany_code}` : client.company_code;
    return `${date}-${code}-${quotation_id}`;
};

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
   GET ALL QUOTATION
====================================================== */
router.get("/", async (req, res) => {
    try {
        // Update status to Expired if past expiry_date
        await db.query(`
            UPDATE quotation SET status = 'Expired'
            WHERE expiry_date < NOW() AND status IN ('Sent', 'Revised')
        `);

        const [rows] = await db.query(`
            SELECT q.*, c.company_name, p.project_title
            FROM quotation q
            JOIN client c ON q.client_id = c.id
            LEFT JOIN project p ON q.project_id = p.id
            ORDER BY q.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ======================================================
   GET QUOTATION DETAIL
====================================================== */
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // Update status to Expired if past expiry_date
        await db.query(`
            UPDATE quotation SET status = 'Expired'
            WHERE id = ? AND expiry_date < NOW() AND status IN ('Sent', 'Revised')
        `, [id]);

        const [[quotation]] = await db.query(`
            SELECT q.*, c.company_name, c.pic_name, c.email, c.contact, c.address,
                   p.project_title, p.description as project_description,
                   p.start_date as project_start_date, p.end_date as project_end_date,
                   p.status as project_status
            FROM quotation q
            JOIN client c ON q.client_id = c.id
            LEFT JOIN project p ON q.project_id = p.id
            WHERE q.id = ?
        `, [id]);

        if (!quotation) {
            return res.status(404).json({ message: "Quotation not found" });
        }

        const [items] = await db.query(`
            SELECT qi.*
            FROM quotation_items qi
            WHERE qi.quotation_id = ?
        `, [id]);

        const [terms] = await db.query(`
            SELECT * FROM quotation_terms
            WHERE quotation_id = ?
            ORDER BY term_number
        `, [id]);

        // Add project dates to quotation object for rendering
        quotation.start_date = quotation.project_start_date;
        quotation.deadline = quotation.project_end_date;

        // Convert discount and tax to percentages for frontend display
        if (quotation.discount_type === 'percent' && quotation.subtotal > 0) {
            quotation.discount = (quotation.discount / quotation.subtotal) * 100;
        }
        if (quotation.tax_type === 'percent' && quotation.subtotal > 0) {
            quotation.tax = (quotation.tax / quotation.subtotal) * 100;
        }

        res.json({ quotation, items, terms });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ======================================================
   CREATE QUOTATION
   - Draft atau Sent
====================================================== */
router.post("/", async (req, res) => {
    const {
        client_id,
        project_id,
        quotation_number,
        estimate_date,
        expiry_date,
        subtotal,
        discount,
        discount_type,
        tax,
        tax_type,
        total,
        term_condition,
        status,
        created_by,
        sent_by,
        items = [],
        terms = []
    } = req.body;

    if (quotation_number && (quotation_number.startsWith('[') || quotation_number.startsWith('{'))) {
        quotation_number = null;
    }

    if (!client_id || !project_id) {
        return res.status(400).json({ message: "client_id and project_id are required" });
    }

    // Calculate expiry_date as estimate_date + 1 month, but allow admin to override
    let finalExpiryDate = null;
    if (expiry_date) {
        // Use provided expiry_date if given
        finalExpiryDate = expiry_date;
    } else if (estimate_date) {
        // Calculate as estimate_date + 1 month if not provided
        const estDate = new Date(estimate_date);
        estDate.setMonth(estDate.getMonth() + 1);
        finalExpiryDate = estDate.toISOString().split('T')[0];
    }

    const finalStatus = ["Draft", "Sent"].includes(status) ? status : "Draft";

    const absoluteDiscount = discount_type === 'percent' ? (subtotal * (discount || 0)) / 100 : (discount || 0);
    const absoluteTax = tax_type === 'percent' ? (subtotal * (tax || 0)) / 100 : (tax || 0);

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [result] = await conn.query(`
            INSERT INTO quotation
            (client_id, project_id, quotation_number, estimate_date, expiry_date,
             subtotal, discount, discount_type, tax, tax_type, total, term_condition, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            client_id, project_id || null, quotation_number || null, estimate_date, finalExpiryDate,
            subtotal, absoluteDiscount, discount_type || 'percent', absoluteTax, tax_type || 'percent', total, term_condition || null, finalStatus, created_by
        ]);

        const quotationId = result.insertId;

        if (!quotation_number || quotation_number.trim() === '') {

            const [[quotation]] = await conn.query(
                "SELECT created_at FROM quotation WHERE id = ?",
                [quotationId]
            );

            const quotationNumber = await generateQuotationNumber(conn, client_id, quotationId, quotation.created_at);

            await conn.query(
                "UPDATE quotation SET quotation_number = ? WHERE id = ?",
                [quotationNumber, quotationId]
            );
        }

        // Insert Logs
        let logStatus = "Draft";
        let logDescription = "Quotation created";

        if (finalStatus === "Sent") {

            logStatus = "Sent";
            logDescription = "Quotation created and sent";
        }


        await conn.query(`
    INSERT INTO quotation_status_logs
    (quotation_id, status, description, created_by, sent_by, sent_at)
    VALUES (?, ?, ?, ?, ?, ?)
`, [
            quotationId,
            logStatus,
            logDescription,
            created_by,
            finalStatus === "Sent" ? created_by : null,
            finalStatus === "Sent" ? new Date() : null
        ]);

        /* INSERT ITEMS */
        for (const item of items) {
            await conn.query(`
                INSERT INTO quotation_items
                (quotation_id, item_id, item_name, description, qty, unit, price, total)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                quotationId,
                item.item_id || null,
                item.item_name,
                item.description,
                item.qty,
                item.unit,
                item.price,
                item.total
            ]);
        }

        /* INSERT TERMS */
        for (const term of terms) {
            await conn.query(`
                INSERT INTO quotation_terms
                (quotation_id, term_number, nominal, term_percentage, term_estimate)
                VALUES (?, ?, ?, ?, ?)
            `, [
                quotationId,
                term.term_number,
                term.nominal,
                term.term_percentage,
                term.term_estimate
            ]);
        }



        await conn.commit();
        res.status(201).json({
            message: "Quotation berhasil dibuat",
            quotation_id: quotationId
        });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        conn.release();
    }
});

/* ======================================================
    UPDATE QUOTATION (DRAFT / REJECTED)
====================================================== */
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const {
        client_id, project_id, quotation_number, estimate_date, expiry_date,
        subtotal, discount, discount_type, tax, tax_type, total,
        term_condition, status, revised_by, updated_by,
        items = [], terms = []
    } = req.body;

    let finalExpiryDate = null;
    if (expiry_date) {

        finalExpiryDate = expiry_date;
    } else if (estimate_date) {
        // Calculate as estimate_date + 1 month if not provided
        const estDate = new Date(estimate_date);
        estDate.setMonth(estDate.getMonth() + 1);
        finalExpiryDate = estDate.toISOString().split('T')[0];
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [[existing]] = await conn.query(
            "SELECT status, client_id, created_at FROM quotation WHERE id = ?",
            [id]
        );

        if (!existing) {
            conn.release();
            return res.status(404).json({ message: "Quotation not found" });
        }


        let newStatus = existing.status;
        const activeUserId = updated_by || revised_by || null;

        if (status === "Sent" && ["Draft", "Revised"].includes(existing.status)) {
            newStatus = "Sent";
        } else if (existing.status === "Rejected") {
            newStatus = "Revised";
        }

        let fixedQuotationNumber = quotation_number;
        if (!fixedQuotationNumber || fixedQuotationNumber.trim() === '' || fixedQuotationNumber.startsWith('[') || fixedQuotationNumber.startsWith('{')) {

            fixedQuotationNumber = await generateQuotationNumber(conn, existing.client_id, id, existing.created_at);
        }

        const absoluteDiscount = discount_type === 'percent' ? (subtotal * (discount || 0)) / 100 : (discount || 0);
        const absoluteTax = tax_type === 'percent' ? (subtotal * (tax || 0)) / 100 : (tax || 0);

        let updateFields = `
            client_id=?, project_id=?, quotation_number=?, estimate_date=?, expiry_date=?,
            subtotal=?, discount=?, discount_type=?, tax=?, tax_type=?, total=?, 
            term_condition=?, status=?, updated_by=?, updated_at=NOW()`;

        let updateValues = [
            client_id, project_id || null, fixedQuotationNumber, estimate_date, finalExpiryDate,
            subtotal, absoluteDiscount, discount_type || 'percent', absoluteTax, tax_type || 'percent', total,
            term_condition || null, newStatus, activeUserId
        ];

        if (newStatus === "Revised") {
            updateFields += `, revised_by=?, revised_at=NOW()`;
            updateValues.push(activeUserId);
        }

        await conn.query(`UPDATE quotation SET ${updateFields} WHERE id=?`, [...updateValues, id]);

        // 2. Tentukan apakah log harus dibuat dan apa deskripsinya
        let shouldInsertLog = false;
        let logDescription = "";

        // Kondisi A: Perubahan status (misal Draft -> Sent atau Rejected -> Revised)
        if (newStatus !== existing.status) {
            shouldInsertLog = true;
            if (newStatus === 'Sent') {
                logDescription = "Quotation sent";
            } else if (newStatus === 'Revised') {
                logDescription = "Quotation revised";
            } else {
                logDescription = `Status updated to ${newStatus}`;
            }
        }
        // Kondisi B: Mendukung Revised berkali-kali
        // Jika status tetap Revised (artinya sedang diperbaiki ulang), tetap buat log baru
        else if (newStatus === "Revised") {
            shouldInsertLog = true;
            logDescription = "Quotation revised (updated)";
        }

        // 3. Eksekusi Insert Log jika memenuhi syarat
        if (shouldInsertLog) {
            await conn.query(`
                INSERT INTO quotation_status_logs 
                (quotation_id, status, description, created_by, updated_by)
                VALUES (?, ?, ?, ?, ?)
            `, [
                id,
                newStatus,
                logDescription,
                activeUserId,
                activeUserId
            ]);
        }

        await conn.query("DELETE FROM quotation_items WHERE quotation_id = ?", [id]);
        await conn.query("DELETE FROM quotation_terms WHERE quotation_id = ?", [id]);

        for (const item of items) {
            await conn.query(`
                INSERT INTO quotation_items (quotation_id, item_id, item_name, description, qty, unit, price, total)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [id, item.item_id || null, item.item_name, item.description, item.qty, item.unit, item.price, item.total]);
        }

        for (const term of terms) {
            await conn.query(`
                INSERT INTO quotation_terms (quotation_id, term_number, nominal, term_percentage, term_estimate)
                VALUES (?, ?, ?, ?, ?)
            `, [id, term.term_number, term.nominal, term.term_percentage, term.term_estimate]);
        }

        await conn.commit();
        res.json({ message: "Quotation berhasil diperbarui", quotation_id: id });

    } catch (err) {
        await conn.rollback();
        console.error("PUT Error:", err);
        res.status(500).json({ message: "Gagal memperbarui quotation", detail: err.message });
    } finally {
        conn.release();
    }
});

/* ======================================================
   DELETE QUOTATION (ONLY DRAFT AND REJECTED)
====================================================== */
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [[q]] = await conn.query(
            "SELECT status FROM quotation WHERE id = ?",
            [id]
        );

        if (!q) return res.status(404).json({ message: "Quotation not found" });
        if (q.status !== "Draft" && q.status !== "Rejected" && q.status !== "Expired") {
            return res.status(400).json({
                message: "Hanya quotation dengan status Draft, Rejected atau Expired yang bisa dihapus"
            });
        }

        await conn.query("DELETE FROM quotation_items WHERE quotation_id = ?", [id]);
        await conn.query("DELETE FROM quotation_terms WHERE quotation_id = ?", [id]);
        await conn.query("DELETE FROM quotation_status_logs WHERE quotation_id = ?", [id]);
        await conn.query("DELETE FROM quotation WHERE id = ?", [id]);

        await conn.commit();
        res.json({ message: "Quotation berhasil dihapus" });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        conn.release();
    }
});

// SEND
router.put("/:id/send", async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [[existing]] = await conn.query(
            "SELECT status, estimate_date FROM quotation WHERE id = ?",
            [id]
        );

        if (!existing) {
            return res.status(404).json({ message: "Quotation not found" });
        }

        // Calculate expiry_date as estimate_date + 1 month
        const estDate = new Date(existing.estimate_date);
        estDate.setMonth(estDate.getMonth() + 1);
        const expiryDate = estDate.toISOString().split('T')[0];

        const [result] = await conn.query(`
            UPDATE quotation SET status = 'Sent', expiry_date = ?
            WHERE id = ? AND status IN ('Draft','Revised')
        `, [expiryDate, id]);

        if (!result.affectedRows) {
            return res.status(400).json({ message: "Quotation tidak bisa dikirim" });
        }

        // Insert log for sending quotation
        await conn.query(`
            INSERT INTO quotation_status_logs
            (quotation_id, status, description, updated_by)
            VALUES (?, 'Sent', 'Quotation sent', ?)
        `, [id, req.body.sent_by || null]);

        await conn.commit();
        res.json({ message: "Quotation sent" });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        conn.release();
    }
});

// PUBLISH (Sent)
router.put("/:id/publish", async (req, res) => {
    const { id } = req.params;
    const { sent_by } = req.body;

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // Get estimate_date first
        const [[existing]] = await conn.query(
            "SELECT estimate_date FROM quotation WHERE id = ?",
            [id]
        );

        if (!existing) {
            await conn.rollback();
            return res.status(404).json({ message: "Quotation not found" });
        }

        // Calculate expiry_date as estimate_date + 1 month
        const estDate = new Date(existing.estimate_date);
        estDate.setMonth(estDate.getMonth() + 1);
        const expiryDate = estDate.toISOString().split('T')[0];

        // 1. Update status quotation and expiry_date
        const [result] = await conn.query(`
            UPDATE quotation SET status = 'Sent', expiry_date = ?
            WHERE id = ? AND status IN ('Draft', 'Revised')
        `, [expiryDate, id]);

        if (!result.affectedRows) {
            await conn.rollback();
            return res.status(400).json({ message: "Quotation tidak bisa dikirim atau sudah terkirim" });
        }

        // 2. Insert log (Pastikan deskripsi bersih agar UI bagus)
        await conn.query(`
            INSERT INTO quotation_status_logs
            (quotation_id, status, description, created_by, updated_by, sent_by, sent_at)
            VALUES (?, 'Sent', 'Quotation sent', ?, ?, ?, NOW())
        `, [id, sent_by, sent_by, sent_by]);

        await conn.commit();
        res.json({ message: "Quotation berhasil dipublish" });
    } catch (err) {
        await conn.rollback();
        console.error("Publish Error:", err);
        res.status(500).json({ message: "Gagal mempublish quotation", error: err.message });
    } finally {
        conn.release();
    }
});

// CONVERT QUOTATION TO INVOICE (DRAFT) - SATU INVOICE PER TERM
router.post("/:id/convert-to-invoice", async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // Validasi Quotation
        const [[quotation]] = await conn.query(
            "SELECT * FROM quotation WHERE id = ? AND status = 'Approved'",
            [id]
        );

        if (!quotation) {
            return res.status(400).json({
                message: "Quotation belum Approved atau tidak ditemukan"
            });
        }

        // Validasi Termin
        const [terms] = await conn.query(
            "SELECT * FROM quotation_terms WHERE quotation_id = ? ORDER BY term_number",
            [id]
        );

        if (terms.length === 0) {
            return res.status(400).json({
                message: "Quotation belum memiliki termin pembayaran"
            });
        }

        // Get Items
        const [items] = await conn.query(
            "SELECT * FROM quotation_items WHERE quotation_id = ?",
            [id]
        );

        const createdInvoices = [];

        // Create one invoice per term
        for (const term of terms) {
            // Calculate amounts for this term
            const termSubtotal = (quotation.subtotal * term.term_percentage) / 100;

            // Calculate discount and tax based on type
            let invoiceDiscount, invoiceTax;
            if (quotation.discount_type === 'percent') {
                invoiceDiscount = quotation.subtotal > 0 ? (quotation.discount / quotation.subtotal) * 100 : 0;
            } else {
                invoiceDiscount = (quotation.discount * term.term_percentage) / 100;
            }

            if (quotation.tax_type === 'percent') {
                invoiceTax = quotation.subtotal > 0 ? (quotation.tax / quotation.subtotal) * 100 : 0;
            } else {
                invoiceTax = (quotation.tax * term.term_percentage) / 100;
            }

            const termTotal = term.nominal;

            // Insert Invoice for this term
            const [invoiceResult] = await conn.query(`
                INSERT INTO invoice
                (invoice_number, quotation_id, quotation_term_id, client_id,
                 issue_date, due_date,
                 subtotal, discount, discount_type, tax, tax_type, total, status, term_condition, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?)
            `, [
                null, // invoice_number will be set after insert
                quotation.id,
                term.id,
                quotation.client_id,
                quotation.estimate_date,
                term.term_estimate,
                termSubtotal,
                invoiceDiscount,
                quotation.discount_type,
                invoiceTax,
                quotation.tax_type,
                termTotal,
                quotation.term_condition,
                quotation.created_by
            ]);

            const invoiceId = invoiceResult.insertId;

            // Parse quotation_number to get date and code
            const [date, code] = quotation.quotation_number.split('-');
            const invoiceNumber = `${date}-${code}-${invoiceId}`;

            // Update invoice with generated number
            await conn.query(
                "UPDATE invoice SET invoice_number = ? WHERE id = ?",
                [invoiceNumber, invoiceId]
            );

            // Insert log for invoice creation
            const username = await getUsername(conn, quotation.created_by);

            await conn.query(`
    INSERT INTO invoice_status_logs
    (invoice_id, status, description, created_by) 
    VALUES (?, 'Draft', ?, ?)
`, [
                invoiceId,
                'Invoice created', // Deskripsi bersih tanpa "By: ..."
                quotation.created_by // Pastikan ini adalah ID user (misal: 1)
            ]);

            // Copy Items ke Invoice Items
            for (const item of items) {

                const itemSubtotal = (item.total * term.term_percentage) / 100;
                const itemQty = item.qty; //

                await conn.query(`
                    INSERT INTO invoice_items
                    (invoice_id, item_name, description, qty, unit, price, total)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    invoiceId,
                    item.item_name,
                    item.description,
                    itemQty,
                    item.unit,
                    item.price,
                    itemSubtotal
                ]);
            }

            createdInvoices.push({
                invoice_id: invoiceId,
                invoice_number: invoiceNumber,
                term_number: term.term_number,
                term_nominal: term.nominal,
                due_date: term.term_estimate
            });
        }

        await conn.commit();

        res.status(201).json({
            message: `Quotation berhasil dikonversi ke ${createdInvoices.length} invoice (Draft)`,
            invoices: createdInvoices,
            total_invoices: createdInvoices.length
        });

    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({
            message: "Failed to convert quotation to invoice",
            error: err.message
        });
    } finally {
        conn.release();
    }
});

// CLIENT ACTION (Approve and Reject)
// APPROVE
router.put("/:id/approve", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(`
            UPDATE quotation q
            JOIN client c ON q.client_id = c.id
            SET q.status = 'Approved', q.approved_by = c.user_id, q.approved_at = NOW()
            WHERE q.id = ? AND q.status IN ('Sent', 'Revised')
        `, [id]);

        if (!result.affectedRows) {
            return res.status(400).json({ message: "Quotation tidak bisa di-approve" });
        }

        const [[existingLog]] = await db.query(
            "SELECT id FROM quotation_status_logs WHERE quotation_id = ? AND status = 'Approved'",
            [id]
        );

        if (!existingLog) {
            const [[client]] = await db.query("SELECT user_id FROM client WHERE id = (SELECT client_id FROM quotation WHERE id = ?)", [id]);
            const approvedBy = client.user_id;

            await db.query(`
                INSERT INTO quotation_status_logs
                (quotation_id, status, description, created_by, approved_by, approved_at)
                VALUES (?, 'Approved', ?, ?, ?, NOW())
            `, [
                id,
                'Quotation approved',
                approvedBy,
                approvedBy
            ]);
        }

        res.json({ message: "Quotation approved" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REJECT
router.put("/:id/reject", async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();


        const [result] = await conn.query(`
            UPDATE quotation q
            JOIN client c ON q.client_id = c.id
            SET q.status = 'Rejected', q.rejected_by = c.user_id, q.rejected_at = NOW()
            WHERE q.id = ? AND q.status IN ('Sent', 'Revised')
        `, [id]);

        if (!result.affectedRows) {
            await conn.rollback();
            return res.status(400).json({ message: "Quotation tidak ditemukan atau status tidak sesuai" });
        }


        const [[client]] = await conn.query(`
            SELECT user_id FROM client 
            WHERE id = (SELECT client_id FROM quotation WHERE id = ?)
        `, [id]);

        const rejectedBy = client.user_id;


        await conn.query(`
            INSERT INTO quotation_status_logs 
            (quotation_id, status, description, created_by, rejected_by, rejected_at)
            VALUES (?, 'Rejected', ?, ?, ?, NOW())
        `, [
            id,
            'Quotation rejected',
            rejectedBy,
            rejectedBy
        ]);

        await conn.commit();
        res.json({ message: "Quotation rejected successfully" });
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

### GET ALL QUOTATION
GET http://localhost:3000/api/quotations

----------------------------------------------------------

### GET QUOTATION DETAIL
GET http://localhost:3000/api/quotations/1

----------------------------------------------------------

### CREATE QUOTATION (MULTI TERMIN)
POST http://localhost:3000/api/quotations
Content-Type: application/json

{
  "client_id": 1,
  "project_id": 1,
  "quotation_number": "QUO-001",
  "estimate_date": "2024-10-01",
  "expiry_date": "2024-10-15",
  "subtotal": 1000000,
  "discount": 0,
  "tax": 90000,
  "total": 1090000,
  "terms_conditions": "Payment terms apply",
  "status": "draft",
  "items": [
    {
      "item_id": 1,
      "item_name": "Website Development",
      "description": "Development",
      "qty": 1,
      "unit": "pcs",
      "price": 1000000,
      "total": 1000000
    }
  ],
  "terms": [
    {
      "term_number": 1,
      "nominal": 545000,
      "percentage": 50,
      "term_estimate": "2024-10-15"
    },
    {
      "term_number": 2,
      "nominal": 545000,
      "percentage": 50,
      "term_estimate": "2024-11-15"
    }
  ]
}

----------------------------------------------------------

### UPDATE QUOTATION
PUT http://localhost:3000/api/quotations/1
Content-Type: application/json

{
  "client_id": 1,
  "project_id": 1,
  "quotation_number": "QUO-001",
  "estimate_date": "2024-10-01",
  "expiry_date": "2024-10-15",
  "subtotal": 1000000,
  "discount": 0,
  "tax": 90000,
  "total": 1090000,
  "terms_conditions": "Updated terms",
  "status": "draft",
  "revised_by": 1,
  "items": [
    {
      "item_id": 1,
      "item_name": "Website Development",
      "description": "Development",
      "qty": 1,
      "unit": "pcs",
      "price": 1000000,
      "total": 1000000
    }
  ],
  "terms": [
    {
      "term_number": 1,
      "nominal": 545000,
      "percentage": 50,
      "term_estimate": "2024-10-15"
    },
    {
      "term_number": 2,
      "nominal": 545000,
      "percentage": 50,
      "term_estimate": "2024-11-15"
    }
  ]
}

RULE:
- status = draft → boleh edit
- status = rejected → boleh edit (status otomatis jadi revised)
- status = revised → boleh edit
- status = sent / approved / expired → TIDAK BOLEH edit
- Jika quotation sudah lewat tanggal expiry_date maka status akan Expired

----------------------------------------------------------

### CLIENT ACTION (STATUS FLOW)

#### SEND QUOTATION
PUT http://localhost:3000/api/quotations/1/send
(draft / revised → sent)

#### APPROVE QUOTATION (CLIENT)
PUT http://localhost:3000/api/quotations/1/approve
(sent / revised → approved)

#### REJECT QUOTATION (CLIENT)
PUT http://localhost:3000/api/quotations/1/reject
(sent → rejected)

----------------------------------------------------------

### CONVERT TO INVOICE
POST http://localhost:3000/api/quotations/1/convert-to-invoice

RULE:
- HANYA quotation dengan status "approved" yang bisa di convert
- Setiap termin akan menjadi 1 invoice terpisah

----------------------------------------------------------

### DELETE QUOTATION
DELETE http://localhost:3000/api/quotations/1

========================================================= */
