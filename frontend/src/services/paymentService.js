export const getAllInvoices = async () => {
    const res = await fetch("http://localhost:3000/api/invoices");

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch invoices");
    }

    return data;
};

export const getPaymentHistory = async () => {
    const res = await fetch("http://localhost:3000/api/payment-history");

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch payment history");
    }

    return data;
};

export const getInvoiceDetail = async (invoiceId) => {
    const res = await fetch(`http://localhost:3000/api/invoices/${invoiceId}`);

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch invoice details");
    }

    return data;
};

export const payInvoiceTerm = async (invoiceId, amountPaid, paymentDate) => {
    const res = await fetch(
        `http://localhost:3000/api/invoices/${invoiceId}/pay`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount_paid: amountPaid,
                payment_date: paymentDate
            })
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Payment failed");
    }

    return data;
};
