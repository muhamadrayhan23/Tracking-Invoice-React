import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuotationLayout from "../../components/layout/Quotation-Layout";
import SlateRenderer from "../../components/SlateRenderer";
import { ArrowLeft, FileText, Building2, User, Phone, MapPin, Download, CheckCircle, X } from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import QuotationPDF from './quotationPDF';

const QuotationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState(null);
    const [items, setItems] = useState([]);
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [showConvertConfirm, setShowConvertConfirm] = useState(false);
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

    useEffect(() => {
        const fetchQuotationDetail = async () => {
            try {
                setLoading(true);
                const res = await fetch(`http://localhost:3000/api/quotations/${id}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setQuotation(data.quotation);
                setItems(data.items);
                setTerms(data.terms);
            } catch (err) {
                setError(err.message || "Failed to load quotation details");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchQuotationDetail();
        }
    }, [id]);

    const handleDownloadPDF = async () => {
        try {
            const blob = await pdf(<QuotationPDF quotation={quotation} items={items} terms={terms} />).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quotation-${quotation.quotation_number || quotation.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleConvertToInvoice = () => {
        setShowConvertConfirm(true);
    };

    const handleConfirmConvert = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/quotations/${id}/convert-to-invoice`, {
                method: "POST",
            });

            if (!res.ok) throw new Error("Failed to convert");

            const data = await res.json();
            setAlertMessage("The quotation has been successfully converted to an invoice!");
            setAlertType("success");
            setShowAlert(true);
            setTimeout(() => {
                navigate('/invoices');
            }, 1500);
        } catch (err) {
            setAlertMessage(err.message);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setShowConvertConfirm(false);
        }
    };

    const handleCloseAlert = () => {
        setShowAlert(false);
        setAlertMessage("");
    };

    // Keyboard event handlers for modals
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showConvertConfirm) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmConvert();
                } else if (e.key === "Escape") {
                    setShowConvertConfirm(false);
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
    }, [showConvertConfirm, showAlert]);

    if (loading) {
        return (
            <QuotationLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </QuotationLayout>
        );
    }

    if (error || !quotation) {
        return (
            <QuotationLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-red-500">{error || "Quotation not found"}</div>
                </div>
            </QuotationLayout>
        );
    }

    return (
        <QuotationLayout>
            <div className="m-3 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/quotations')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                    >
                        <ArrowLeft size={20} />
                        Back to Quotations
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownloadPDF}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Download size={16} />
                            Download PDF
                        </button>
                        {quotation.status === 'Approved' && (
                            <button
                                onClick={handleConvertToInvoice}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                                <FileText size={16} />
                                Convert to Invoice
                            </button>
                        )}
                    </div>
                </div>

                {/* Quotation Document */}
                <div className="bg-white border border-gray-200 rounded-lg">
                    {/* Header Section */}
                    <div className="border-b border-gray-200 p-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">QUOTATION</h1>
                                <p className="text-gray-600">#{quotation.quotation_number || quotation.id}</p>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${quotation.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                                    quotation.status === 'Sent' ? 'bg-blue-50 text-blue-500' :
                                        quotation.status === 'Approved' ? 'bg-green-50 text-green-500' :
                                            quotation.status === 'Rejected' ? 'bg-red-50 text-red-500' :
                                                quotation.status === 'Revised' ? 'bg-yellow-50 text-yellow-500' :
                                                    'bg-gray-50 text-gray-500'
                                    }`}>
                                    {quotation.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sender & Client Info */}
                    <div className="p-8 border-b border-gray-200 gap-8">
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
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation To</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Building2 size={16} className="text-gray-400" />
                                        <span className="font-medium">{quotation.company_name}</span>
                                    </div>
                                    {/* <div className="flex items-center gap-3">
                                        <User size={16} className="text-gray-400" />
                                        <span>{quotation.pic_name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone size={16} className="text-gray-400" />
                                        <span>{quotation.contact}</span>
                                    </div> */}
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} className="text-gray-400" />
                                        <span>{quotation.address}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="grid grid-cols-3 gap-6">
                                {quotation.project_title && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Project</div>
                                        <div className="font-medium">{quotation.project_title}</div>
                                    </div>
                                )}
                                {/* {quotation.start_date && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Start Date</div>
                                        <div className="font-medium">{formatDate(quotation.start_date)}</div>
                                    </div>
                                )}
                                {quotation.deadline && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Deadline</div>
                                        <div className="font-medium">{formatDate(quotation.deadline)}</div>
                                    </div>
                                )} */}
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Quotation Date</div>
                                    <div className="font-medium">{formatDate(quotation.estimate_date)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Expiry Date</div>
                                    <div className="font-medium">{formatDate(quotation.expiry_date)}</div>
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
                                                {item.item_name}
                                                {item.description && item.description.trim() !== "" && item.description !== "-" && (
                                                    <div className="text-sm text-gray-600 mt-1">{item.description}</div>
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

                    {/* Terms */}
                    {terms.length > 0 && (
                        <div className="p-8 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Terms</h3>
                            <div className="space-y-4">
                                {terms.map((term, index) => (
                                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium">Term {term.term_number}</div>
                                            <div className="text-sm text-gray-600">Due: {formatDate(term.term_estimate)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">{formatCurrency(term.nominal)}</div>
                                            <div className="text-sm text-gray-600">{term.term_percentage}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="p-8">
                        <div className="flex justify-end">
                            <div className="w-64 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span>{formatCurrency(quotation.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Discount:</span>
                                    <span>
                                        {quotation.discount_type === 'percent'
                                            ? `${(Number(quotation.discount) / Number(quotation.subtotal) * 100).toFixed(0)}% (${formatCurrency(quotation.discount)})`
                                            : formatCurrency(quotation.discount)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax:</span>
                                    <span>
                                        {quotation.tax_type === 'percent'
                                            ? `${(Number(quotation.tax) / (Number(quotation.subtotal) - Number(quotation.discount)) * 100).toFixed(0)}% (${formatCurrency(quotation.tax)})`
                                            : formatCurrency(quotation.tax)}
                                    </span>
                                </div>
                                {terms.length > 0 && terms.map((term, index) => (
                                    <div key={index} className="flex justify-between">
                                        <span className="text-gray-600">Term {term.term_number}:</span>
                                        <span>{formatCurrency(term.nominal)}</span>
                                    </div>
                                ))}
                                <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span>{formatCurrency(quotation.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Signature */}
                    <div className="p-8">
                        <div className="flex justify-end items-center">
                            <div className="w-64 space-y-3">
                                <p className="font-bold text-sm text-center">Sincerely,</p>
                                <img src="/image/signature.jpeg" alt="signature" className="mx-auto w-32 h-18" />
                                <p className="font-medium text-center">Lizuardi Danar Pratisna</p>
                            </div>
                        </div>
                    </div>

                    {/* Terms & Conditions */}
                    {quotation.term_condition && (
                        <div className="p-8 border-t border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
                            <SlateRenderer value={quotation.term_condition} />
                        </div>
                    )}
                </div>
            </div>

            {/* CONVERT CONFIRMATION MODAL */}
            {showConvertConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowConvertConfirm(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                                    <FileText size={16} />
                                </div>
                                <h3 className="text-lg font-semibold">Confirm Convert</h3>
                            </div>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-gray-700">Are you sure you want to convert this quotation to an invoice?</p>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={handleConfirmConvert}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Convert
                                </button>
                                <button
                                    onClick={() => setShowConvertConfirm(false)}
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
        </QuotationLayout>
    );
};

export default QuotationDetail;
