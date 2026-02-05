import { useEffect, useState } from "react";
import { getPaymentHistory } from "../../services/historyService";
import { getQuotationStatusLogs } from "../../services/quotationStatusLogService";
import PaymentHistoryLayout from "../../components/layout/Payment-Layout";
import Timeline from "../../components/Timeline";
import { Eye, Search, X } from "lucide-react";

const PaymentHistory = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [showDetail, setShowDetail] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [quotationLogs, setQuotationLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatCurrency = (value) => {
        return `Rp ${Number(value).toLocaleString("id-ID")}`;
    };

    useEffect(() => {
        fetchPaymentHistory();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredPayments = payments.filter(payment =>
        payment.quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

    const fetchPaymentHistory = async () => {
        try {
            setLoading(true);
            const data = await getPaymentHistory();
            setPayments(data);
        } catch (err) {
            setError(err.message || "Failed to load payment history");
        } finally {
            setLoading(false);
        }
    };

    const handleShowDetail = async (payment) => {
        setSelectedPayment(payment);
        setShowDetail(true);
        setLogsLoading(true);
        try {
            const logs = await getQuotationStatusLogs(payment.quotation.id);
            setQuotationLogs(logs);
        } catch (err) {
            console.error("Failed to load quotation logs:", err);
            setQuotationLogs([]);
        } finally {
            setLogsLoading(false);
        }
    };

    const handleCloseDetail = () => {
        setShowDetail(false);
        setSelectedPayment(null);
    };

    if (loading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <PaymentHistoryLayout>
            <div className="m-3 flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2.5 ">
                    <h1 className="text-2xl font-semibold pb-4">History</h1>
                </div>

                <div className="bg-white rounded border border-gray-200 p-4">
                    <div className="flex justify-between items-center mb-4 relative">
                        <h2 className="font-medium">History List</h2>
                        <input
                            type="search"
                            placeholder="Search quotations..."
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
                                        <th className="py-3">Quotation Number</th>
                                        <th>Company</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedPayments.map((payment, index) => (
                                        <tr key={index} className="border-b border-gray-200">
                                            <td className="py-4">{payment.quotation.quotation_number}</td>
                                            <td className="py-4">{payment.client.company_name}</td>
                                            <td className="py-4">
                                                <button
                                                    onClick={() => handleShowDetail(payment)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredPayments.length === 0 && (
                                <div className="text-center text-gray-500 mt-4 w-full">
                                    Quotation & Invoice History Not Available
                                </div>
                            )}

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

                    {showDetail && selectedPayment && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">

                                {/* Header: Sticky Section */}
                                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold pr-4">
                                        History Detail: {selectedPayment.quotation.quotation_number} - {selectedPayment.client.company_name}
                                    </h3>
                                    <button
                                        onClick={handleCloseDetail}
                                        className="text-gray-400 hover:text-gray-700 transition-colors"
                                    >
                                        <span className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><X size={18} /></span>
                                    </button>
                                </div>

                                {/* Content: Scrollable Section */}
                                <div className="p-6 overflow-y-auto custom-scrollbar">
                                    <Timeline events={selectedPayment.timeline} />
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PaymentHistoryLayout>
    );
};

export default PaymentHistory;
