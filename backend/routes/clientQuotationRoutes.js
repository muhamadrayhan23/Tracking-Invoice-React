
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
            return res.json([]);
        }

        const [quotationRows] = await db.query(`
            SELECT
                q.id,
                q.quotation_number,
                q.project_id,
                p.project_title,
                p.start_date,
                p.end_date,
                q.estimate_date,
                q.expiry_date,
                q.subtotal,
                q.discount,
                q.discount_type,
                q.tax,
                q.tax_type,
                q.total,
                q.term_condition,
                q.status,
                q.created_at,
                qi.id as quotation_item_id,
                qi.item_id,
                qi.item_name,
                qi.description,
                qi.qty,
                qi.unit,
                qi.price,
                qi.total as item_total,
                qt.id as term_id,
                qt.term_number,
                qt.nominal,
                qt.term_percentage,
                qt.term_estimate
            FROM quotation q
            LEFT JOIN project p ON q.project_id = p.id
            LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
            LEFT JOIN quotation_terms qt ON q.id = qt.quotation_id
            WHERE q.client_id = ? AND q.status != 'Draft'
            ORDER BY q.created_at DESC, qi.id, qt.term_number
        `, [client.id]);

        // Group the data by quotation
        const quotations = {};
        quotationRows.forEach(row => {
            const quotationId = row.id;
            if (!quotations[quotationId]) {
                quotations[quotationId] = {
                    id: row.id,
                    quotation_number: row.quotation_number,
                    project_id: row.project_id,
                    project_title: row.project_title,
                    estimate_date: row.estimate_date,
                    expiry_date: row.expiry_date,
                    subtotal: row.subtotal,
                    discount: row.discount,
                    discount_type: row.discount_type,
                    tax: row.tax,
                    tax_type: row.tax_type,
                    total: row.total,
                    terms_conditions: row.terms_conditions,
                    status: row.status,
                    created_at: row.created_at,
                    items: [],
                    terms: []
                };
            }
            if (row.quotation_item_id && !quotations[quotationId].items.find(item => item.quotation_item_id === row.quotation_item_id)) {
                quotations[quotationId].items.push({
                    quotation_item_id: row.quotation_item_id,
                    item_id: row.item_id,
                    item_name: row.item_name,
                    description: row.description,
                    qty: row.qty,
                    unit: row.unit,
                    price: row.price,
                    total: row.item_total
                });
            }
            if (row.term_id && !quotations[quotationId].terms.find(term => term.id === row.term_id)) {
                quotations[quotationId].terms.push({
                    id: row.term_id,
                    term_number: row.term_number,
                    nominal: row.nominal,
                    percentage: row.percentage,
                    term_estimate: row.term_estimate
                });
            }
        });

        res.json(Object.values(quotations));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/:user_id/:quotation_id", async (req, res) => {
    const { user_id, quotation_id } = req.params;

    try {
        const [[client]] = await db.query(
            "SELECT id FROM client WHERE user_id = ?",
            [user_id]
        );

        if (!client) {
            return res.status(404).json({ message: "Client tidak ditemukan" });
        }

        const [quotationRows] = await db.query(`
            SELECT
                q.id,
                q.quotation_number,
                q.project_id,
                p.project_title,
                p.start_date,
                p.end_date as deadline,
                q.estimate_date,
                q.expiry_date,
                q.subtotal,
                q.discount,
                q.discount_type,
                q.tax,
                q.tax_type,
                q.total,
                q.term_condition,
                q.status,
                q.created_at,
                c.company_name,
                c.pic_name,
                c.email,
                c.contact,
                c.address,
                qi.id as quotation_item_id,
                qi.item_id,
                qi.item_name,
                qi.description,
                qi.qty,
                qi.unit,
                qi.price,
                qi.total as item_total,
                qt.id as term_id,
                qt.term_number,
                qt.nominal,
                qt.term_percentage,
                qt.term_estimate
            FROM quotation q
            LEFT JOIN project p ON q.project_id = p.id
            LEFT JOIN client c ON q.client_id = c.id
            LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
            LEFT JOIN quotation_terms qt ON q.id = qt.quotation_id
            WHERE q.client_id = ? AND q.id = ?
            ORDER BY qi.id, qt.term_number
        `, [client.id, quotation_id]);

        if (quotationRows.length === 0 || quotationRows[0].status === 'Draft') {
            return res.status(404).json({ message: "Quotation tidak ditemukan" });
        }

        // Structure the response
        const quotation = {
            id: quotationRows[0].id,
            quotation_number: quotationRows[0].quotation_number,
            project_id: quotationRows[0].project_id,
            project_title: quotationRows[0].project_title,
            start_date: quotationRows[0].start_date,
            deadline: quotationRows[0].deadline,
            estimate_date: quotationRows[0].estimate_date,
            expiry_date: quotationRows[0].expiry_date,
            subtotal: quotationRows[0].subtotal,
            discount: quotationRows[0].discount,
            discount_type: quotationRows[0].discount_type, // MASUKKAN KE RESPONSE
            tax: quotationRows[0].tax,
            tax_type: quotationRows[0].tax_type,
            total: quotationRows[0].total,
            term_condition: quotationRows[0].term_condition,
            status: quotationRows[0].status,
            created_at: quotationRows[0].created_at,
            company_name: quotationRows[0].company_name,
            pic_name: quotationRows[0].pic_name,
            email: quotationRows[0].email,
            contact: quotationRows[0].contact,
            address: quotationRows[0].address,
        };

        // Convert discount and tax to percentages for frontend display
        if (quotation.discount_type === 'percent' && quotation.subtotal > 0) {
            quotation.discount = (quotation.discount / quotation.subtotal) * 100;
        }
        if (quotation.tax_type === 'percent' && quotation.subtotal > 0) {
            quotation.tax = (quotation.tax / quotation.subtotal) * 100;
        }

        const items = [];
        const terms = [];

        quotationRows.forEach(row => {
            if (row.quotation_item_id && !items.find(item => item.quotation_item_id === row.quotation_item_id)) {
                items.push({
                    quotation_item_id: row.quotation_item_id,
                    item_id: row.item_id,
                    item_name: row.item_name,
                    description: row.description,
                    qty: row.qty,
                    unit: row.unit,
                    price: row.price,
                    total: row.item_total
                });
            }
            if (row.term_id && !terms.find(term => term.id === row.term_id)) {
                terms.push({
                    id: row.term_id,
                    term_number: row.term_number,
                    nominal: row.nominal,
                    term_percentage: row.term_percentage,
                    term_estimate: row.term_estimate
                });
            }
        });

        res.json({
            quotation,
            items,
            terms
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
