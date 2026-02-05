
import { useEffect, useState, useRef } from "react";
import QuotationLayout from "../../components/layout/Quotation-Layout";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Edit, Trash2, Search, Send, CheckCircle, XCircle, X } from "lucide-react";

const Quotation = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");

    // Confirm popup states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSendConfirm, setShowSendConfirm] = useState(false);
    const [quotationToDelete, setQuotationToDelete] = useState(null);
    const [quotationToSend, setQuotationToSend] = useState(null);

    const navigate = useNavigate();

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const filteredQuotations = quotations.filter((q) =>
        q.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.estimate_date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.expiry_date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredQuotations.length / ITEMS_PER_PAGE);

    const paginatedQuotations = filteredQuotations.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );


    const fetchQuotations = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:3000/api/quotations");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setQuotations(data || []);
        } catch (err) {
            setError(err.message || "Failed to load");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showDeleteConfirm) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmDelete();
                } else if (e.key === "Escape") {
                    setShowDeleteConfirm(false);
                    setQuotationToDelete(null);
                }
            } else if (showSendConfirm) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmSend();
                } else if (e.key === "Escape") {
                    setShowSendConfirm(false);
                    setQuotationToSend(null);
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
    }, [showDeleteConfirm, showSendConfirm, showAlert]);

    const handleCloseAlert = () => {
        setShowAlert(false);
        setAlertMessage("");
    };

    const handleConfirmDelete = async () => {
        if (!quotationToDelete) return;

        try {
            const res = await fetch(`http://localhost:3000/api/quotations/${quotationToDelete}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to Delete Quotation");

            setAlertMessage("Quotation successfully deleted!");
            setAlertType("success");
            setShowAlert(true);
            fetchQuotations();
        } catch (err) {
            setAlertMessage(err.message);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setShowDeleteConfirm(false);
            setQuotationToDelete(null);
        }
    };

    const handleConfirmSend = async () => {
        if (!quotationToSend) return;

        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = storedUser.id;

        if (!userId) {
            setAlertMessage("Sesi berakhir, silakan login kembali.");
            setAlertType("error");
            setShowAlert(true);
            setShowSendConfirm(false);
            setQuotationToSend(null);
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/quotations/${quotationToSend}/publish`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sent_by: userId }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to send");

            setAlertMessage("Quotation successfully sent!");
            setAlertType("success");
            setShowAlert(true);
            fetchQuotations();
        } catch (err) {
            setAlertMessage(err.message);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setShowSendConfirm(false);
            setQuotationToSend(null);
        }
    };

    const handleDelete = (id) => {
        setQuotationToDelete(id);
        setShowDeleteConfirm(true);
    };

    const handleSend = (id) => {
        setQuotationToSend(id);
        setShowSendConfirm(true);
    };

    return (
        <QuotationLayout>
            <div className="m-3 flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2.5">
                    <h1 className="text-2xl font-semibold pb-4">Quotation</h1>
                    <Link
                        to="/quotations/new"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        + Create New Quotation
                    </Link>
                </div>

                <div className="bg-white rounded border border-gray-200 p-4">
                    <div className="flex justify-between items-center mb-4 relative">
                        <h2 className="font-medium">Quotation List</h2>
                        <input
                            type="search"
                            placeholder="Search quotations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-200 rounded px-3 pr-9 py-1"></input>
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
                                        <th>Quotation Number</th>
                                        <th className="py-3">Client</th>
                                        <th>Project</th>
                                        <th>Quotation Date</th>
                                        <th>Expiry Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedQuotations.map((q) => (
                                        <tr key={q.id} className="border-b border-gray-200">
                                            <td>{q.quotation_number}</td>
                                            <td className="py-4">{q.company_name}</td>
                                            <td>{q.project_title}</td>
                                            <td>{formatDate(q.estimate_date)}</td>
                                            <td>{formatDate(q.expiry_date)}</td>
                                            <td>
                                                <span className={`px-2 py-1 rounded-full text-xs ${q.status === 'Draft' ? 'text-gray-500 bg-gray-50' :
                                                    q.status === 'Sent' ? 'text-blue-500 bg-blue-50' :
                                                        q.status === 'Revised' ? 'text-yellow-500 bg-yellow-50' :
                                                            q.status === 'Rejected' ? 'text-red-500 bg-red-50' :
                                                                q.status === 'Approved' ? 'text-green-500 bg-green-50' :
                                                                    q.status === 'Expired' ? 'text-red-600 bg-red-50' :
                                                                        'text-gray-600 bg-gray-50'
                                                    }`}>
                                                    {q.status}
                                                </span>
                                            </td>
                                            <td className=" gap-2 items-center p-1">
                                                <button
                                                    onClick={() => navigate(`/quotations/${q.id}`)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        navigate(`/quotations/edit/${q.id}`)
                                                    }
                                                    disabled={q.status === 'Sent' || q.status === 'Approved' || q.status === 'Revised'}
                                                    className={`p-1 rounded text-indigo-600 ${q.status === 'Sent' || q.status === 'Approved' || q.status === 'Revised'
                                                        ? 'opacity-50 cursor-not-allowed'
                                                        : 'hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <Edit size={16} />
                                                </button>

                                                {/* Button Edit Quotation (Draft or Revised Only) */}
                                                <button
                                                    onClick={() => handleDelete(q.id)}
                                                    disabled={q.status === 'Sent' || q.status === 'Approved' || q.status === 'Revised'}
                                                    className={`p-1 rounded text-red-600 ${q.status === 'Sent' || q.status === 'Approved' || q.status === 'Revised'
                                                        ? 'opacity-50 cursor-not-allowed'
                                                        : 'hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                {/* Button Send Quotation (Draft or Revised Only) */}
                                                {(q.status === 'Draft' || q.status === 'Revised') && (
                                                    <button
                                                        onClick={() => handleSend(q.id)}
                                                        className="p-1 hover:bg-gray-100 rounded text-blue-600"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                )}
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
                                        {alertType === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
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

                {/* DELETE CONFIRMATION MODAL */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => {
                                setShowDeleteConfirm(false);
                                setQuotationToDelete(null);
                            }}
                        />

                        {/* Modal */}
                        <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                                        <Trash2 size={16} />
                                    </div>
                                    <h3 className="text-lg font-semibold">Confirm Delete</h3>
                                </div>
                            </div>

                            <div className="px-6 py-5">
                                <p className="text-gray-700">Are you sure want to delete this quotation?</p>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={handleConfirmDelete}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setQuotationToDelete(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SEND CONFIRMATION MODAL */}
                {showSendConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => {
                                setShowSendConfirm(false);
                                setQuotationToSend(null);
                            }}
                        />

                        {/* Modal */}
                        <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                        <Send size={16} />
                                    </div>
                                    <h3 className="text-lg font-semibold">Confirm Send</h3>
                                </div>
                            </div>

                            <div className="px-6 py-5">
                                <p className="text-gray-700">Are you sure want to send this quotation?</p>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={handleConfirmSend}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Send
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowSendConfirm(false);
                                            setQuotationToSend(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </QuotationLayout>
    );
};

export default Quotation;
