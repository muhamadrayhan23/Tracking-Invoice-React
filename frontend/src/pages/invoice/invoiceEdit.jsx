import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InvoiceLayout from "../../components/layout/Invoice-Layout";
import SlateEditor from "../../components/SlateEditor";

import { CheckCircle, X } from "lucide-react";

const InvoiceEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        invoice_number: "",
        term_condition: ""
    });
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                handleCloseAlert();
            }
        };

        if (showAlert) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showAlert, alertType]);

    const handleCloseAlert = () => {
        setShowAlert(false);
        if (alertType === 'success') {
            navigate("/invoices");
        }
    };

    const fetchInvoice = async () => {
        try {

            const response = await fetch(`http://localhost:3000/api/invoices/${id}`);

            if (!response.ok) {
                throw new Error("Failed to fetch invoice data");
            }

            const data = await response.json();

            const invoiceData = data.invoice || data;

            setInvoice(invoiceData);
            setForm({
                invoice_number: invoiceData.invoice_number || "",
                term_condition: invoiceData.term_condition || ""
            });
        } catch (error) {
            console.error("Error fetching invoice:", error);
            setAlertMessage(error.message || "Failed to load invoice data");
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.invoice_number.trim()) {
            setAlertMessage("Invoice number is required");
            setAlertType("error");
            setShowAlert(true);
            return;
        }

        setSaving(true);

        try {

            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            const userId = storedUser.id;

            if (!userId) {
                throw new Error("User session not found. Please re-login.");
            }

            const res = await fetch(`http://localhost:3000/api/invoices/${id}/update-draft`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    invoice_number: form.invoice_number,
                    term_condition: form.term_condition,
                    updated_by: userId
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to update invoice");
            }

            setInvoice(prev => ({ ...prev, ...form }));
            setAlertMessage("Invoice successfully updated!");
            setAlertType("success");
            setShowAlert(true);



        } catch (err) {
            setAlertMessage(err.message);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <InvoiceLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading...</div>
                </div>
            </InvoiceLayout>
        );
    }

    if (!invoice) {
        return (
            <InvoiceLayout>
                <div className="text-center text-red-500">Invoice not found</div>
            </InvoiceLayout>
        );
    }

    if (invoice.status !== "Draft") {
        return (
            <InvoiceLayout>
                <div className="text-center text-red-500">
                    Only draft invoices can be edited
                </div>
            </InvoiceLayout>
        );
    }

    return (
        <InvoiceLayout>
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Edit Invoice</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Invoice Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.invoice_number}
                            onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter invoice number"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Terms & Conditions
                        </label>
                        <SlateEditor
                            value={form.term_condition}
                            onChange={(value) => setForm({ ...form, term_condition: value })}
                            placeholder="Enter terms and conditions..."
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/invoices")}
                            className="px-6 py-2  border border-gray-200 rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
            {showAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 ">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 flex items-center justify-center rounded-full ${alertType === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {alertType === 'success' ? <CheckCircle size={16} /> : <X size={16} />}
                                </div>
                                <h3 className="text-lg font-semibold">
                                    {alertType === 'success' ? 'Success' : 'Error'}
                                </h3>
                            </div>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-gray-700">{alertMessage}</p>
                        </div>
                        <div className="flex justify-end px-6 py-4">
                            <button
                                onClick={handleCloseAlert}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </InvoiceLayout>
    );
};

export default InvoiceEdit;
