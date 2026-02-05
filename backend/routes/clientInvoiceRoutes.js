// routes/invoiceClientRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [[client]] = await db.query(
            "SELECT id FROM client WHERE user_id = ?",
            [id]
        );

        if (!client) {
            return res.json({ data: [] });
        }

        const [rows] = await db.query(`
            SELECT i.*, c.company_name, q.quotation_number
            FROM invoice i
            JOIN client c ON i.client_id = c.id
            LEFT JOIN quotation q ON i.quotation_id = q.id
            WHERE i.client_id = ? AND i.status != 'Draft'
            ORDER BY i.created_at DESC
        `, [client.id]);

        res.json({ data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Get specific invoice detail for client
router.get("/:userId/:invoiceId", async (req, res) => {
    const { userId, invoiceId } = req.params;

    try {
        const [[client]] = await db.query(
            "SELECT id, company_name, address, pic_name, contact FROM client WHERE user_id = ?",
            [userId]
        );

        if (!client) {
            return res.status(404).json({ message: "Client tidak ditemukan" });
        }

        const [[invoice]] = await db.query(`
            SELECT i.*, i.term_condition, c.company_name, c.address, c.pic_name, c.contact, p.project_title, p.start_date, p.end_date
            FROM invoice i
            JOIN client c ON i.client_id = c.id
            JOIN quotation q ON i.quotation_id = q.id
            LEFT JOIN project p ON q.project_id = p.id
            WHERE i.id = ? AND i.client_id = ? AND i.status != 'Draft'
        `, [invoiceId, client.id]);

        if (!invoice) {
            return res.status(404).json({ message: "Invoice tidak ditemukan" });
        }

        const [items] = await db.query(
            "SELECT * FROM invoice_items WHERE invoice_id = ?",
            [invoiceId]
        );

        const [terms] = await db.query(
            "SELECT * FROM quotation_terms WHERE id = ?",
            [invoice.quotation_term_id]
        );

        const [payments] = await db.query(
            "SELECT * FROM payment WHERE invoice_id = ? ORDER BY payment_date",
            [invoiceId]
        );

        // Add payment_date and payment_status to each term
        const termsWithPayments = terms.map(term => {
            const termPayments = payments.filter(p => p.quotation_term_id === term.id);
            if (termPayments.length > 0) {
                term.payment_date = termPayments[0].payment_date;
                term.payment_status = termPayments[0].payment_status;
            } else {
                term.payment_date = null;
                term.payment_status = 'unpaid';
            }
            return term;
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

        const total = Number(termsWithPayments[0].nominal);

        // Convert back to percent for display if they are percent type (matching admin side)
        if (invoice.discount_type === 'percent' && subtotal > 0) {
            discount = (discount / subtotal) * 100;
        }
        if (invoice.tax_type === 'percent' && subtotal > 0) {
            tax = (tax / subtotal) * 100;
        }

        const paidAmount = payments
            .filter(p => p.payment_status === 'paid')
            .reduce((sum, p) => sum + Number(p.amount_paid), 0);
        const remainingAmount = total - paidAmount;

        res.json({
            client: {
                id: client.id,
                company_name: client.company_name,
                address: client.address,
                phone: client.phone,
                email: client.email
            },
            invoice,
            items,
            summary: {
                subtotal,
                discount,
                discount_type: invoice.discount_type,
                tax,
                tax_type: invoice.tax_type,
                total,
                paid_amount: paidAmount,
                remaining_amount: remainingAmount
            },
            terms: termsWithPayments,
            payments
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
