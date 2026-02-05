import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PaymentLayout from "../../components/layout/Payment-Layout";
import { getAllInvoices, getInvoiceDetail, payInvoiceTerm } from "../../services/paymentService";

const Payment = () => {
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState([]);
    const [publishedInvoices, setPublishedInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredInvoices, setFilteredInvoices] = useState([]);

    const [nominal, setNominal] = useState("");
    const [formattedNominal, setFormattedNominal] = useState("");
    const [paymentDate, setPaymentDate] = useState("");

    const [paidAmount, setPaidAmount] = useState(0);
    const [remainingAmount, setRemainingAmount] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);

    /* =========================
       FETCH INVOICE LIST
    ========================= */
    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const data = await getAllInvoices();
                setInvoices(data || []);
                // Filter published invoices (status Issued, Partially Paid, Overdue)
                const published = data.filter(inv => ['Issued', 'Partially Paid', 'Overdue'].includes(inv.status));
                setPublishedInvoices(published);
                setFilteredInvoices(published);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchInvoices();
    }, []);

    /* =========================
       HANDLE INVOICE NUMBER CHANGE
    ========================= */
    const handleInvoiceNumberChange = (value) => {
        setInvoiceNumber(value);
        setShowDropdown(true);

        // Filter published invoices based on input
        const filtered = publishedInvoices.filter(inv =>
            inv.invoice_number.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredInvoices(filtered);

        if (!value) {
            setSelectedInvoice(null);
            return;
        }

        // If exact match, select it
        const exactInvoice = publishedInvoices.find(inv => inv.invoice_number === value);
        if (exactInvoice) {
            setSelectedInvoice(exactInvoice);
            setNominal("");
            setFormattedNominal("");
        } else {
            setSelectedInvoice(null);
        }
    };

    /* =========================
       HANDLE INVOICE SELECTION
    ========================= */
    const handleInvoiceSelect = async (invoice) => {
        setInvoiceNumber(invoice.invoice_number);
        setSelectedInvoice(invoice);
        setShowDropdown(false);
        setNominal("");
        setFormattedNominal("");

        // Fetch detailed invoice information to get paid amount
        try {
            const invoiceDetail = await getInvoiceDetail(invoice.id);
            const paid = invoiceDetail.payments.reduce((sum, payment) => sum + Number(payment.amount_paid), 0);
            const remaining = Number(invoiceDetail.invoice.total) - paid;

            setPaidAmount(paid);
            setRemainingAmount(remaining);
        } catch (err) {
            console.error("Failed to fetch invoice details:", err);
            setPaidAmount(0);
            setRemainingAmount(Number(invoice.total));
        }
    };

    /* =========================
       HANDLE NOMINAL CHANGE
    ========================= */
    const handleNominalChange = (value) => {
        const rawValue = value.replace(/\D/g, '');

        const num = parseInt(rawValue, 10) || 0;
        setNominal(num.toString());

        setFormattedNominal(num > 0 ? `Rp ${num.toLocaleString("id-ID")}` : "");
    };

    /* =========================
    SUBMIT PAYMENT
 ========================= */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Pastikan invoice sudah terpilih
        if (!selectedInvoice || !nominal || !paymentDate) {
            setError("All fields are required");
            setShowErrorModal(true);
            return;
        }

        const inputAmount = parseFloat(nominal);
        const invoiceTotal = parseFloat(selectedInvoice.total);

        // 1. Validasi: Nominal harus lebih dari 0
        if (inputAmount <= 0) {
            setError("Payment amount must be greater than 0");
            setShowErrorModal(true);
            return;
        }

        // 2. Validasi: Nominal tidak boleh melebihi total tagihan
        if (inputAmount > invoiceTotal) {
            setError("The payment amount cannot exceed the total invoice amount");
            setShowErrorModal(true);
            return;
        }


        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await payInvoiceTerm(
                selectedInvoice.id,
                inputAmount,
                paymentDate
            );

            setSuccess("Payment successful");
            setShowSuccessModal(true);
        } catch (err) {
            setError(err.message);
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        navigate(`/invoices/${selectedInvoice.id}`);
    };

    const handleCloseErrorModal = () => {
        setShowErrorModal(false);
    };

    /* =========================
       KEYBOARD ACCESSIBILITY FOR MODALS
    ========================= */
    useEffect(() => {
        if (!showSuccessModal) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                handleCloseSuccessModal();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showSuccessModal]);

    useEffect(() => {
        if (!showErrorModal) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                handleCloseErrorModal();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showErrorModal]);

    return (
        <PaymentLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Payment</h1>

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded border border-gray-200">

                    {/* INPUT INVOICE NUMBER */}
                    <div className="mb-4 relative">
                        <label className="block mb-2 text-sm font-medium">
                            Invoice Number
                        </label>
                        <input
                            type="text"
                            value={invoiceNumber}
                            onChange={(e) => handleInvoiceNumberChange(e.target.value)}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                            placeholder="Enter invoice number..."
                            required
                        />
                        {showDropdown && filteredInvoices.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 max-h-40 overflow-y-auto">
                                {filteredInvoices.map((inv) => (
                                    <li
                                        key={inv.id}
                                        onMouseDown={() => handleInvoiceSelect(inv)}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        <div className="flex justify-between">
                                            <span>{inv.invoice_number}</span>
                                            <span className="text-sm text-gray-500">{inv.company_name}</span>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Quotation: {inv.quotation_number || 'N/A'} | Total: Rp {Number(inv.total).toLocaleString("id-ID")}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* INVOICE SUMMARY */}
                    {selectedInvoice && (
                        <>
                            <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
                                <h3 className="text-sm font-medium mb-2">Invoice Summary</h3>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Total:</span>
                                        <div className="font-medium">Rp {Number(selectedInvoice.total).toLocaleString("id-ID")}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Paid:</span>
                                        <div className="font-medium">Rp {paidAmount.toLocaleString("id-ID")}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Remaining:</span>
                                        <div className="font-medium text-blue-600">Rp {remainingAmount.toLocaleString("id-ID")}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-medium">
                                    Payment Amount
                                </label>
                                <input
                                    type="text"
                                    value={formattedNominal}
                                    onChange={(e) => handleNominalChange(e.target.value)}
                                    className="w-full border border-gray-200 rounded px-3 py-2"
                                    placeholder="Rp 0"
                                    required
                                />
                            </div>

                            {/* PAYMENT DATE */}
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-medium">
                                    Payment Date
                                </label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="w-full border border-gray-200 rounded px-3 py-2"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                            >
                                {loading ? "Submitting..." : "Submit Payment"}
                            </button>
                        </>
                    )}
                </form>

                {/* SUCCESS MODAL */}
                {showSuccessModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/40" onClick={handleCloseSuccessModal} />
                        <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold">Success</h3>
                                </div>
                            </div>
                            <div className="px-6 py-5">
                                <p className="text-gray-700">{success}</p>
                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={handleCloseSuccessModal}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ERROR MODAL */}
                {showErrorModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/40" onClick={handleCloseErrorModal} />
                        <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold">Error</h3>
                                </div>
                            </div>
                            <div className="px-6 py-5">
                                <p className="text-gray-700">{error}</p>
                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={handleCloseErrorModal}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PaymentLayout>
    );
};

export default Payment;
