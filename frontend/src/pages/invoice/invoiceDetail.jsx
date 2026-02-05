import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import InvoiceLayout from "../../components/layout/Invoice-Layout";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from "./invoicePdf";
import SlateRenderer from "../../components/SlateRenderer";
import { ArrowLeft, Building2, User, Phone, MapPin, Download, Send, CheckCircle, X } from "lucide-react";

const InvoiceDetail = () => {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [items, setItems] = useState([]);
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return Number(amount).toLocaleString("id-ID", { style: "currency", currency: "IDR" });
    };

    const fetchInvoice = async () => {
        const res = await fetch(`http://localhost:3000/api/invoices/${id}`);
        const data = await res.json();
        setInvoice(data.invoice);
        setItems(data.items || []);
        setTerms(data.terms || []);
        setLoading(false);
    }

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const handlePublishInvoice = () => {
        setShowPublishConfirm(true);
    };

    const handleConfirmPublish = async () => {
        // Ambil user dari localStorage (sesuaikan dengan cara Anda menyimpan session)
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = storedUser.id;

        if (!userId) {
            setAlertMessage("Sesi berakhir, silakan login kembali.");
            setAlertType("error");
            setShowAlert(true);
            setShowPublishConfirm(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/invoices/${id}/publish`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    issued_by: userId
                }),
            });

            if (!res.ok) throw new Error("Failed to publish invoice!");

            setAlertMessage("Invoice succesfully published!");
            setAlertType("success");
            setShowAlert(true);
            fetchInvoice();
        } catch (err) {
            setAlertMessage(err.message);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setShowPublishConfirm(false);
        }
    };

    const handleCloseAlert = () => {
        setShowAlert(false);
        setAlertMessage("");
    };

    // Keyboard event handlers for modals
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showPublishConfirm) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmPublish();
                } else if (e.key === "Escape") {
                    setShowPublishConfirm(false);
                }
            } else if (showAlert) {
                if (e.key === "Enter" || e.key === "Escape") {
                    e.preventDefault();
                    handleCloseAlert();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showPublishConfirm, showAlert]);

    if (loading) return <p>Loading...</p>;
    if (!invoice) return <p>Invoice tidak ditemukan</p>;

    return (
        <InvoiceLayout>
            <div className="m-3 flex flex-col gap-3">
                { /* BUTTON PUBLISH & DOWNLOAD PDF */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                    >
                        <ArrowLeft size={16} />
                        Back to Invoices
                    </button>
                    <div className="flex justify-end gap-2">
                        <PDFDownloadLink
                            document={<InvoicePDF invoice={invoice} items={items} terms={terms} />}
                            fileName={`${invoice.invoice_number}.pdf`}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                            <Download size={16} />
                            Download PDF
                        </PDFDownloadLink>
                        {invoice.status === "Draft" && (
                            <button
                                onClick={handlePublishInvoice}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg  hover:bg-green-700"
                            >
                                <Send size={16} />
                                Publish Invoice
                            </button>
                        )}
                    </div>
                </div>
                {/* Invoice Document */}
                <div className="bg-white border border-gray-200 rounded-lg ">
                    {/* Header Section */}
                    <div className="border-b border-gray-200 p-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                                <p className="text-gray-600">#{invoice.invoice_number}</p>
                                {terms.length > 0 && (
                                    <p className="text-gray-600">Term {terms[0].term_number}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                                    invoice.status === 'Issued' ? 'bg-yellow-50 text-yellow-500' :
                                        invoice.status === 'Partially Paid' ? 'bg-blue-50 text-blue-500' :
                                            invoice.status === 'Paid' ? 'bg-green-50 text-green-500' :
                                                invoice.status === 'Overdue' ? 'bg-red-50 text-red-500' :
                                                    'bg-gray-50 text-gray-500'
                                    }`}>
                                    {invoice.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sender & Client Info */}
                    <div className="p-8 border-b border-gray-200">
                        <div className="flex justify-between items-start">

                            {/* Sender Information */}
                            <div className="max-w-xs">
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">From</h3>
                                    <div className="flex items-center gap-3">
                                        <Building2 size={16} className="text-gray-400" />
                                        <span className="font-medium text-blue-500">PT Bandung Teknologi Semesta</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin size={35} className="text-gray-400" />
                                        <span>Jl. Nata Kusumah VII, No.J66, RT.01/RW.07, Bandung Regency, West Java 40225</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone size={16} className="text-gray-400" />
                                        <span>Phone: 083821868088</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <User size={16} className="text-gray-400" />
                                        <span>Prepared by: Lizuardi Danar Pratisna</span>
                                    </div>
                                </div>
                            </div>

                            {/* Client Information */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice To</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Building2 size={16} className="text-gray-400" />
                                        <span className="font-medium">{invoice.company_name}</span>
                                    </div>
                                    {/* <div className="flex items-center gap-3">
                                        <User size={16} className="text-gray-400" />
                                        <span>{invoice.pic_name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone size={16} className="text-gray-400" />
                                        <span>{invoice.contact}</span>
                                    </div> */}
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} className="text-gray-400" />
                                        <span>{invoice.address}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="grid grid-cols-3 gap-6">
                                {invoice.project_title && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Project</div>
                                        <div className="font-medium">{invoice.project_title}</div>
                                    </div>
                                )}
                                {/* {invoice.start_date && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Start Date</div>
                                        <div className="font-medium">{formatDate(invoice.start_date)}</div>
                                    </div>
                                )}
                                {invoice.end_date && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">End Date</div>
                                        <div className="font-medium">{formatDate(invoice.end_date)}</div>
                                    </div>
                                )} */}
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Invoice Date</div>
                                    <div className="font-medium">{formatDate(invoice.issue_date)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Overdue Date</div>
                                    <div className="font-medium">{formatDate(invoice.due_date)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="p-8 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Items</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead className="bg-black text-white">
                                    <tr>
                                        <th className="border border-gray-300 text-left py-3 px-4 font-medium">Item</th>
                                        <th className="border border-gray-300 text-center py-3 px-4 font-medium">Unit</th>
                                        <th className="border border-gray-300 text-center py-3 px-4 font-medium">Qty</th>
                                        <th className="border border-gray-300 text-right py-3 px-4 font-medium">Price</th>
                                        <th className="border border-gray-300 text-right py-3 px-4 font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-black">
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="border border-gray-300 py-4 px-4">
                                                {item.description && item.description.trim() && item.description !== "-" ? (
                                                    <div>
                                                        <div>{item.item_name}</div>
                                                        <div className="text-sm text-gray-500">{item.description}</div>
                                                    </div>
                                                ) : (
                                                    item.item_name
                                                )}
                                            </td>
                                            <td className="border border-gray-300 py-4 px-4 text-center">{item.unit}</td>
                                            <td className="border border-gray-300 py-4 px-4 text-center">{item.qty}</td>
                                            <td className="border border-gray-300 py-4 px-4 text-right">{formatCurrency(item.price)}</td>
                                            <td className="border border-gray-300 py-4 px-4 text-right font-medium">{formatCurrency(item.qty * item.price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="p-8">
                        <div className="flex justify-end">
                            <div className="w-64 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span>{formatCurrency(invoice.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Discount:</span>
                                    <span>
                                        {invoice.discount_type === 'percent'
                                            ? `${(Number(invoice.discount) / Number(invoice.subtotal) * 100).toFixed(0)}% (${formatCurrency(invoice.discount)})`
                                            : formatCurrency(invoice.discount)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax:</span>
                                    <span>
                                        {invoice.tax_type === 'percent'
                                            ? `${(Number(invoice.tax) / (Number(invoice.subtotal) - Number(invoice.discount)) * 100).toFixed(0)}% (${formatCurrency(invoice.tax)})`
                                            : formatCurrency(invoice.tax)}
                                    </span>
                                </div>
                                {terms.length > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Term {terms[0].term_number}:</span>
                                        <span>- {formatCurrency(terms[0].nominal)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span>{formatCurrency(invoice.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Signature */}
                        <div className="p-8">
                            <div className="flex justify-end items-center">
                                <div className="w-54 space-y-3">
                                    <p className="font-semibold text-sm text-center">Sincerely,</p>
                                    <img src="/image/signature.jpeg" alt="signature" className="mx-auto w-32 h-18" />
                                    <p className="font-semibold text-sm text-center">Lizuardi Danar Pratisna</p>
                                </div>
                            </div>
                        </div>

                        {/* Terms & Conditions below summary */}
                        {invoice.term_condition && (
                            <div className="mt-6 pt-6 border-t border-gray-200 bg-gray-50 p-4 rounded">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
                                <SlateRenderer value={invoice.term_condition} />
                            </div>
                        )}
                    </div>

                    {/* Terms & Conditions
                    {invoice.term_condition && (
                        <div className="p-8 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
                            <SlateRenderer value={invoice.term_condition} />
                        </div>
                    )} */}
                </div>
            </div >

            {/* PUBLISH CONFIRMATION MODAL */}
            {showPublishConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowPublishConfirm(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                                    <Send size={16} />
                                </div>
                                <h3 className="text-lg font-semibold">Confirm Publish</h3>
                            </div>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-gray-700">Are you sure you want to publish this invoice?</p>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={handleConfirmPublish}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Publish
                                </button>
                                <button
                                    onClick={() => setShowPublishConfirm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ALERT MODAL */}
            {showAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={handleCloseAlert}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
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
                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={handleCloseAlert}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </InvoiceLayout >
    );
};

export default InvoiceDetail;