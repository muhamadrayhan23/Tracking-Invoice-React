import { useEffect, useState, useRef } from "react";
import ClientLayout from "../../components/layout/Client-Layout";
import { Link } from "react-router";
import { ArrowLeft, X, Eye, RotateCcw, Building, Building2, Search, Calendar, Trash2, Mail, MapPin, User, Phone, Hash, CheckCircle, XCircle } from "lucide-react";

const TrashClient = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [actionId, setActionId] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");

    const restoreModalRef = useRef(null);
    const deleteModalRef = useRef(null);
    const restoreConfirmRef = useRef(null);
    const deleteConfirmRef = useRef(null);

    const filteredClients = clients.filter((c) =>
        c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.pic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);

    const paginatedClients = filteredClients.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const fetchDeletedClients = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:3000/api/clients/trash");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setClients(data || []);
        } catch (err) {
            setError(err.message || "Failed to load");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeletedClients();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        if (showRestoreModal && restoreModalRef.current) {
            restoreModalRef.current.focus();
        }
    }, [showRestoreModal]);

    useEffect(() => {
        if (showDeleteModal && deleteModalRef.current) {
            deleteModalRef.current.focus();
        }
    }, [showDeleteModal]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showAlert) {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    handleCloseAlert();
                }
            }
            else if (showRestoreModal && e.key === 'Escape') {
                handleCloseRestoreModal();
            }
            else if (showDeleteModal && e.key === 'Escape') {
                handleCloseDeleteModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAlert, showRestoreModal, showDeleteModal]);

    const handleRestore = (id) => {
        setActionId(id);
        setShowRestoreModal(true);
    };

    const handleConfirmRestore = async () => {
        if (!actionId) return;

        try {
            const res = await fetch(`http://localhost:3000/api/clients/restore/${actionId}`, {
                method: "PUT",
            });

            if (!res.ok) throw new Error("Failed to restore");

            setAlertMessage("Client successfully restored!");
            setAlertType("success");
            setShowAlert(true);
            fetchDeletedClients();
        } catch (err) {
            setAlertMessage(err.message);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setShowRestoreModal(false);
            setActionId(null);
        }
    };

    const handleCloseRestoreModal = () => {
        setShowRestoreModal(false);
        setActionId(null);
    };

    const handlePermanentDelete = (id) => {
        setActionId(id);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!actionId) return;

        try {
            const res = await fetch(`http://localhost:3000/api/clients/permanent/${actionId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Gagal menghapus permanen");

            setAlertMessage("Client successfully deleted permanently!");
            setAlertType("success");
            setShowAlert(true);
            fetchDeletedClients();
        } catch (err) {
            setAlertMessage(err.message);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setShowDeleteModal(false);
            setActionId(null);
        }
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setActionId(null);
    };

    const handleCloseAlert = () => {
        setShowAlert(false);
        setAlertMessage("");
    }

    return (
        <ClientLayout>
            <div className="m-3 flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2.5">
                    <Link
                        to="/clients"
                        className="flex items-center px-4 py-2 gap-2 rounded text-gray-500 hover:text-gray-600 "
                    >
                        <ArrowLeft size={16} />
                        Back to Clients
                    </Link>
                </div>

                <div className="bg-white rounded border border-gray-200 p-4">
                    <div className="flex justify-between items-center mb-4 relative">
                        <h2 className="font-medium">Deleted Client List</h2>
                        <input
                            type="search"
                            placeholder="Search client..."
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
                                        <th className="py-3">Company</th>
                                        <th>PIC</th>
                                        <th>Email</th>
                                        <th>Deleted At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedClients.map((c) => (
                                        <tr key={c.id} className="border-b border-gray-200">
                                            <td className="py-4">{c.company_name}</td>
                                            <td>{c.pic_name}</td>
                                            <td>{c.email}</td>
                                            <td>{formatDate(c.deleted_at)}</td>
                                            <td className=" gap-2 items-center p-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedClient(c);
                                                        setShowDetail(true);
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleRestore(c.id)}
                                                    className="p-1 hover:bg-gray-100 rounded text-green-600"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handlePermanentDelete(c.id)}
                                                    className="p-1 hover:bg-gray-100 rounded text-red-600"
                                                >
                                                    <Trash2 size={16} />
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
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => p - 1)}
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                    >
                                        Prev
                                    </button>

                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => p + 1)}
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>

                            {filteredClients.length === 0 && (
                                <div className="text-center text-gray-500 mt-4 w-full">
                                    No deleted clients
                                </div>
                            )}
                        </div>

                    )}
                </div>

                {/* MODAL DETAIL */}

                {showDetail && selectedClient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setShowDetail(false)}
                        />

                        {/* Modal */}
                        <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 z-50 shadow-xl">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                                        <Trash2 size={16} />
                                    </div>
                                    <h3 className="text-lg font-semibold">Deleted Client Details</h3>
                                </div>

                                <button
                                    onClick={() => setShowDetail(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-5">
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <Building size={16} />
                                        <span>Company Name</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {selectedClient.company_name}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <Hash size={16} />
                                        <span>Company Code</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {selectedClient.company_code || "No code"}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <Building2 size={16} />
                                        <span>Sub Company</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {selectedClient.sub_company || "No sub company"}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <Hash size={16} />
                                        <span>Subcompany Code</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {selectedClient.subcompany_code || "No code"}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <User size={16} />
                                        <span>Person in Charge (PIC)</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {selectedClient.pic_name}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <Mail size={16} />
                                        <span>Email Address</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {selectedClient.email}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <Phone size={16} />
                                        <span>Contact</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {selectedClient.contact}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <MapPin size={16} />
                                        <span>Address</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 whitespace-pre-line">
                                        {selectedClient.address}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <Calendar size={16} />
                                        <span>Deleted At</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {formatDate(selectedClient.deleted_at)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* RESTORE CONFIRMATION MODAL */}
                {showRestoreModal && (
                    <div
                        ref={restoreModalRef}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleConfirmRestore();
                            } else if (e.key === 'Escape') {
                                handleCloseRestoreModal();
                            }
                        }}
                        tabIndex={-1}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={handleCloseRestoreModal}
                        />

                        {/* Modal */}
                        <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                                        <RotateCcw size={16} />
                                    </div>
                                    <h3 className="text-lg font-semibold">Restore Client</h3>
                                </div>

                            </div>

                            <div className="px-6 py-5 space-y-5">
                                <p className="text-gray-700">
                                    Restore this client?
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 px-6 py-4 "
                                onKeyDown={(e) => {
                                    if (e.key === 'Tab') {
                                        e.preventDefault();
                                        if (e.shiftKey) {
                                            restoreModalRef.current.focus();
                                        } else {
                                            restoreConfirmRef.current.focus();
                                        }
                                    }
                                }}
                            >
                                <button
                                    onClick={handleConfirmRestore}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    ref={restoreConfirmRef}
                                >
                                    Restore
                                </button>
                                <button
                                    autoFocus
                                    onClick={handleCloseRestoreModal}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    ref={restoreModalRef}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION MODAL */}
                {showDeleteModal && (
                    <div
                        ref={deleteModalRef}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleConfirmDelete();
                            } else if (e.key === 'Escape') {
                                handleCloseDeleteModal();
                            }
                        }}
                        tabIndex={-1}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={handleCloseDeleteModal}
                        />

                        {/* Modal */}
                        <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                                        <Trash2 size={16} />
                                    </div>
                                    <h3 className="text-lg font-semibold">Permanent Delete</h3>
                                </div>
                            </div>

                            <div className="px-6 py-5 space-y-5">
                                <p className="text-gray-700">
                                    Permanently delete this client?
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 px-6 py-4 "
                                onKeyDown={(e) => {
                                    if (e.key === 'Tab') {
                                        e.preventDefault();
                                        if (e.shiftKey) {
                                            deleteModalRef.current.focus();
                                        } else {
                                            deleteConfirmRef.current.focus();
                                        }
                                    }
                                }}
                            >
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    ref={deleteConfirmRef}
                                >
                                    Delete
                                </button>
                                <button
                                    autoFocus
                                    onClick={handleCloseDeleteModal}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    ref={deleteModalRef}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ALERT MODAL */}
                {showAlert && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                                handleCloseAlert();
                            }
                        }}
                    >
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
                                        tabIndex={0}
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
        </ClientLayout>
    );
};

export default TrashClient;
