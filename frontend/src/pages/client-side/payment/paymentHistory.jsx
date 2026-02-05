import { useEffect, useState } from "react";
import { Search, Eye, X } from "lucide-react";
import ClientPaymentLayout from "../../../components/client-layout/Payment-Layout";
import Timeline from "../../../components/Timeline";
import { getClientPaymentHistory } from "../../../services/clientPaymentHistoryService";

const ClientPaymentHistory = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [showDetail, setShowDetail] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);

    useEffect(() => {
        fetchPaymentHistory();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleFetchError = (err) => {
        console.error("Error fetching payment history:", err);
        setError(err.message || "Failed to load payment history");
    };

    const filteredQuotations = quotations.filter((quotation) =>
        (quotation.quotation.quotation_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quotation.client.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quotation.project.project_title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredQuotations.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedQuotations = filteredQuotations.slice(startIndex, endIndex);

    const fetchPaymentHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getClientPaymentHistory();

            const quotationList = Array.isArray(data) ? data : [];
            setQuotations(quotationList);
        } catch (err) {
            handleFetchError(err);
            setQuotations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleShowDetail = (quotation) => {
        setSelectedQuotation(quotation);
        setShowDetail(true);
    };

    const handleCloseDetail = () => {
        setShowDetail(false);
        setSelectedQuotation(null);
    };

    return (
        <ClientPaymentLayout>
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
                                    {paginatedQuotations.map((quotation, index) => (
                                        <tr key={quotation.quotation.id} className="border-b border-gray-200">
                                            <td className="py-4">{quotation.quotation.quotation_number}</td>
                                            <td className="py-4">{quotation.client.company_name}</td>
                                            <td className="py-4">
                                                <button
                                                    onClick={() => handleShowDetail(quotation)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredQuotations.length === 0 && (
                                <div className="text-center text-gray-500 mt-4 w-full">
                                    No payment history available
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

                    {showDetail && selectedQuotation && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">

                                {/* Header: Sticky Section */}
                                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold pr-4">
                                        History Detail: {selectedQuotation.quotation.quotation_number} - {selectedQuotation.client.company_name}
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
                                    <Timeline events={selectedQuotation.timeline} />
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ClientPaymentLayout>
    );
};

export default ClientPaymentHistory;
