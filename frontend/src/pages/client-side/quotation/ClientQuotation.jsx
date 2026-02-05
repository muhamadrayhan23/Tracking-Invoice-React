import { useEffect, useState } from "react";
import { Eye, Search } from "lucide-react";
import { useNavigate } from "react-router";
import ClientQuotationLayout from "../../../components/client-layout/Quotation-Layout";
import { getClientQuotations } from "../../../services/clientQuotationService";

const ClientQuotation = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const ITEMS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = useState(1);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const navigate = useNavigate();

    useEffect(() => {
        fetchQuotations();
    }, []);

    const filteredQuotations = quotations.filter((quo) =>
        (quo.quotation_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quo.status || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredQuotations.length / ITEMS_PER_PAGE);

    const paginatedQuotations = filteredQuotations.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchQuotations = async () => {
        try {
            setLoading(true);
            const data = await getClientQuotations();
            setQuotations(data || []);
        } catch (err) {
            setError(err.message || "Failed to load quotations");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ClientQuotationLayout>
            <div className="m-3 flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2.5 border-b border-gray-200">
                    <h1 className="text-2xl font-semibold pb-4">Quotation</h1>
                </div>

                <div className="bg-white rounded border border-gray-200 p-4">
                    <div className="flex justify-between items-center mb-4 relative">
                        <h2 className="font-medium">Quotation List</h2>
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
                                        <th className="py-3">Project Title</th>
                                        <th>Estimate Date</th>
                                        <th>Expiry Date</th>
                                        <th>Total Quotation</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedQuotations.map((quo) => (
                                        <tr key={quo.id} className="border-b border-gray-200">
                                            <td>{quo.project_title}</td>
                                            <td>{formatDate(quo.estimate_date)}</td>
                                            <td>{formatDate(quo.expiry_date)}</td>
                                            <td>Rp {Number(quo.total).toLocaleString("id-ID")}</td>
                                            <td>
                                                <span className={`px-2 py-1 rounded-full text-xs ${quo.status === 'Sent' ? 'text-blue-500 bg-blue-50' :
                                                        quo.status === 'Revised' ? 'text-yellow-500 bg-yellow-50' :
                                                            quo.status === 'Approved' ? 'text-green-500 bg-green-50' :
                                                                quo.status === 'Rejected' ? 'text-red-500 bg-red-50' :
                                                                    'text-gray-500 bg-gray-50'
                                                    }`}>
                                                    {quo.status}
                                                </span>
                                            </td>
                                            <td className="gap-2 items-center p-1">
                                                <button
                                                    onClick={() => {
                                                        navigate(`/client-quotation/${quo.id}`)
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
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

                            {filteredQuotations.length === 0 && (
                                <div className="text-center text-gray-500 mt-4 w-full">
                                    Quotations Not Available
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ClientQuotationLayout>
    );
};

export default ClientQuotation;
