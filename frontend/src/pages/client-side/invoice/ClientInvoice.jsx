import { useEffect, useState } from "react";
import { Eye, Search } from "lucide-react";
import { useNavigate } from "react-router";
import ClientInvoiceLayout from "../../../components/client-layout/Invoice-Layout";
import { getClientInvoices } from "../../../services/clientInvoiceService";

const ClientInvoice = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const ITEMS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = useState(1);

    const navigate = useNavigate();

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleFetchError = (err) => {
        console.error("Error fetching invoices:", err);
        setError(err.message || "Failed to load invoices");
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const filteredInvoices = invoices.filter((inv) =>
        (inv.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.total || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.status || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);

    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getClientInvoices();
            // Handle both direct array and nested response object
            const invoiceList = Array.isArray(data) ? data : data?.data || data?.invoices || [];
            setInvoices(invoiceList);
        } catch (err) {
            handleFetchError(err);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const statusBadge = (status) => {
        const base = "px-3 py-1 rounded-full text-xs font-medium";
        switch (status) {
            case "Issued":
                return `${base} bg-yellow-50 text-yellow-500`;
            case "Partially Paid":
                return `${base} bg-blue-50 text-blue-500`;
            case "Paid":
                return `${base} bg-green-50 text-green-500`;
            case "Overdue":
                return `${base} bg-red-50 text-red-500`;
            default:
                return base;
        }
    };

    return (
        <ClientInvoiceLayout>
            <div className="m-3 flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2.5 border-b border-gray-200">
                    <h1 className="text-2xl font-semibold pb-4">Invoice</h1>
                </div>

                <div className="bg-white rounded border border-gray-200 p-4">
                    <div className="flex justify-between items-center mb-4 relative">
                        <h2 className="font-medium">Invoice List</h2>
                        <input
                            type="search"
                            placeholder="Search invoices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-200 rounded px-3 pr-9 py-1"
                        />
                        <Search
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                    </div>

                    {loading ? (
                        <div>Loading...</div>
                    ) : error ? (
                        <div className="text-red-500">{error}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-center">
                                <thead>
                                    <tr className="text-sm border-b border-gray-200 bg-[#FAFAFA]">
                                        <th className="py-3">Invoice Number</th>
                                        <th>Quotation</th>
                                        <th>Issue Date</th>
                                        <th>Due Date</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedInvoices && paginatedInvoices.length > 0 ? paginatedInvoices.map((inv) => (
                                        <tr key={inv.id} className="border-b border-gray-200">
                                            <td>{inv.invoice_number}</td>
                                            <td>{inv.quotation_number || '-'}</td>
                                            <td>{formatDate(inv.issue_date)}</td>
                                            <td>{formatDate(inv.due_date)}</td>
                                            <td>Rp {Number(inv.total).toLocaleString("id-ID")}</td>
                                            <td>
                                                <span className={statusBadge(inv.status)}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="gap-2 items-center p-1">
                                                <button
                                                    onClick={() => {
                                                        navigate(`/client-invoice/${inv.id}`)
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" className="text-center text-gray-500 py-4">No invoices available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <div className="flex justify-between items-center mt-4">
                                <p className="text-sm text-gray-500">
                                    Page {currentPage} of {totalPages}
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        disabled={currentPage === 1 || totalPages === 0}
                                        onClick={() => setCurrentPage((p) => p - 1)}
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                    >
                                        Prev
                                    </button>

                                    <button
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        onClick={() => setCurrentPage((p) => p + 1)}
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ClientInvoiceLayout>
    );
};

export default ClientInvoice;
