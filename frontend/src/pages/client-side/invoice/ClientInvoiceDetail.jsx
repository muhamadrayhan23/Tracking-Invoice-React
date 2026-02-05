import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ClientInvoiceLayout from "../../../components/client-layout/Invoice-Layout";
import ClientInvoicePDF from "./ClientInvoicePDF";
import SlateRenderer from "../../../components/SlateRenderer";
import { getClientInvoiceDetail } from "../../../services/clientInvoiceService";
import { ArrowLeft, Building2, User, Phone, MapPin, Download } from "lucide-react";

const ClientInvoiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        fetchInvoiceDetail();
    }, [id]);

    const fetchInvoiceDetail = async () => {
        try {
            setLoading(true);
            const data = await getClientInvoiceDetail(id);
            // Restructure data to match expected format
            const structuredData = {
                ...data.invoice,
                client: data.client,
                items: data.items,
                summary: data.summary,
                terms: data.terms,
                payments: data.payments
            };
            setInvoice(structuredData);
        } catch (err) {
            setError(err.message || "Failed to load invoice detail");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ClientInvoiceLayout>
                <div className="p-6 bg-gray-50 min-h-screen">
                    <p>Loading...</p>
                </div>
            </ClientInvoiceLayout>
        );
    }

    if (error) {
        return (
            <ClientInvoiceLayout>
                <div className="p-6 bg-gray-50 min-h-screen">
                    <p className="text-red-500">{error}</p>
                </div>
            </ClientInvoiceLayout>
        );
    }

    if (!invoice) {
        return (
            <ClientInvoiceLayout>
                <div className="p-6 bg-gray-50 min-h-screen">
                    <p>Invoice tidak ditemukan</p>
                </div>
            </ClientInvoiceLayout>
        );
    }

    return (
        <ClientInvoiceLayout>
            <div className="p-2.5">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => navigate('/client-invoice')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                    >
                        <ArrowLeft size={20} />
                        Back to Invoices
                    </button>
                    <PDFDownloadLink
                        document={<ClientInvoicePDF invoice={invoice} />}
                        fileName={`Invoice-${invoice.invoice_number}.pdf`}
                        className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-lg items-center gap-2 flex"
                    >
                        <Download size={16} />
                        Dowload PDF
                    </PDFDownloadLink>
                </div>
                {/* INVOICE  */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 w-full">
                    {/* HEADER */}
                    <div className="border-b border-gray-200 p-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                                <p className="text-gray-600">#{invoice.invoice_number}</p>
                                {invoice.terms && invoice.terms.length > 0 && (
                                    <p className="text-gray-600">Term {invoice.terms[0].term_number}</p>
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

                    {/* ITEMS TABLE */}
                    <div className="p-8 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Items</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead className="bg-black text-white">
                                    <tr>
                                        <th className="border border-gray-300 text-left py-3 px-4 font-medium">Item</th>
                                        {invoice.items.some(item => item.description && item.description.trim() !== "" && item.description !== "-")}
                                        <th className="border border-gray-300 text-center py-3 px-4 font-medium">Unit</th>
                                        <th className="border border-gray-300 text-center py-3 px-4 font-medium">Qty</th>
                                        <th className="border border-gray-300 text-right py-3 px-4 font-medium">Price</th>
                                        <th className="border border-gray-300 text-right py-3 px-4 font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-black">
                                    {invoice.items.map((item, index) => (
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

                    {/* SUMMARY */}
                    <div className="p-8">
                        <div className="flex justify-end">
                            <div className="w-64 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span>{formatCurrency(invoice.summary.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Discount:</span>
                                    <span>
                                        {invoice.summary.discount_type === 'percent'
                                            ? `${((Number(invoice.summary.discount) / Number(invoice.summary.subtotal)) * 100).toFixed(0)}% (${formatCurrency(invoice.summary.discount)})`
                                            : formatCurrency(invoice.summary.discount)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax:</span>
                                    <span>
                                        {invoice.summary.tax_type === 'percent'
                                            ? `${((Number(invoice.summary.tax) / (Number(invoice.summary.subtotal) - Number(invoice.summary.discount))) * 100).toFixed(0)}% (${formatCurrency(invoice.summary.tax)})`
                                            : formatCurrency(invoice.summary.tax)}
                                    </span>
                                </div>

                                {invoice.terms && invoice.terms.length > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Term {invoice.terms[0].term_number}:</span>
                                        <span>- {formatCurrency(invoice.terms[0].nominal)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span>{formatCurrency(invoice.summary.total)}</span>
                                </div>
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

                    {/* TERMS & CONDITIONS */}
                    {invoice.term_condition && (
                        <div className="p-8 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
                            <SlateRenderer value={invoice.term_condition} />
                        </div>
                    )}
                </div>
            </div>
        </ClientInvoiceLayout>
    );
};

export default ClientInvoiceDetail;
