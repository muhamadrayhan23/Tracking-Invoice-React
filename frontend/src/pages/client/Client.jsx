import { useEffect, useState, useRef } from "react";
import ClientLayout from "../../components/layout/Client-Layout";
import { Link, useNavigate } from "react-router-dom";
import { X, Eye, Edit, Trash2, Mail, MapPin, User, Building, Building2, Search, Phone, Hash, CheckCircle, XCircle } from "lucide-react";

const Client = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");

    const navigate = useNavigate();
    const deleteModalRef = useRef(null);
    const alertModalRef = useRef(null);

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


    const fetchClients = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:3000/api/clients");
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
        fetchClients();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        if (showDeleteConfirm && deleteModalRef.current) {
            deleteModalRef.current.focus();
        }
    }, [showDeleteConfirm]);

    useEffect(() => {
        if (showAlert && alertModalRef.current) {
            alertModalRef.current.focus();
        }
    }, [showAlert]);

    const handleDelete = (id) => {
        setClientToDelete(id);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!clientToDelete) return;

        try {
            const res = await fetch(`http://localhost:3000/api/clients/${clientToDelete}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to delete");

            setAlertMessage("The client has been moved to the trash!");
            setAlertType("success");
            setShowAlert(true);

            fetchClients();
        } catch (err) {
            setAlertMessage(err.message);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setShowDeleteConfirm(false);
            setClientToDelete(null);
        }
    };

    const handleCloseAlert = () => {
        setShowAlert(false);
        setAlertMessage("");
    };

    return (
        <ClientLayout>
            <div className="m-3 flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2.5 ">
                    <h1 className="text-2xl font-semibold pb-4">Client</h1>
                    <div className="flex gap-2">
                        <Link
                            to="/clients/trash"
                            className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded hover:bg-red-100 "
                        >
                            <Trash2 size={16} />
                            Trash
                        </Link>
                        <Link
                            to="/clients/new"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            + Create New Client
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded border border-gray-200 p-4">
                    <div className="flex justify-between items-center mb-4 relative">
                        <h2 className="font-semibold">Client List</h2>
                        <input
                            type="search"
                            placeholder="Search clients..."
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
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedClients.map((c) => (
                                        <tr key={c.id} className="border-b border-gray-200">
                                            <td className="py-4">
                                                {c.is_deleted ? "Client Not Available" : c.company_name}
                                            </td>
                                            <td>{c.is_deleted ? "-" : c.pic_name}</td>
                                            <td>{c.is_deleted ? "-" : c.email}</td>
                                            <td>
                                                {c.is_deleted ? (
                                                    <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded-full text-xs">
                                                        Deleted
                                                    </span>
                                                ) : c.user_id ? (
                                                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                                                        With Account
                                                    </span>
                                                ) : (
                                                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
                                                        No Account
                                                    </span>
                                                )}
                                            </td>
                                            <td className=" gap-2 items-center p-1">
                                                {c.is_deleted ? (
                                                    <span className="text-gray-500 text-sm">No actions available</span>
                                                ) : (
                                                    <>
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
                                                            onClick={() =>
                                                                navigate(`/clients/edit/${c.id}`)
                                                            }
                                                            className="p-1 hover:bg-gray-100 rounded text-indigo-600"
                                                        >
                                                            <Edit size={16} />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDelete(c.id)}
                                                            className="p-1 hover:bg-gray-100 rounded text-red-600"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
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
                            {
                                filteredClients.length === 0 && (
                                    <div className="text-center text-gray-500 mt-4 w-full">
                                        Client Not Available
                                    </div>
                                )
                            }
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
                        <div className="relative bg-white rounded-2xl  w-full max-w-md mx-4 z-50">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                        <Building2 size={20} />
                                    </div>
                                    <h3 className="text-lg font-semibold">Client Details</h3>
                                </div>

                                <button
                                    onClick={() => setShowDetail(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="px-4 py-3 space-y-2">
                                {/* Company */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm mb-2">
                                        <Building size={16} />
                                        <span>Company Name</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                                        {selectedClient.company_name}
                                    </div>
                                </div>

                                {/* Company Code */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm mb-2">
                                        <Hash size={16} />
                                        <span>Company Code</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                                        {selectedClient.company_code || "-"}
                                    </div>
                                </div>

                                {/* Company */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm mb-2">
                                        <Building2 size={16} />
                                        <span>Sub Company</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                                        {selectedClient.sub_company || "-"}
                                    </div>
                                </div>

                                {/* Subcompany Code */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm mb-2">
                                        <Hash size={16} />
                                        <span>Subcompany Code</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                                        {selectedClient.subcompany_code || "-"}
                                    </div>
                                </div>

                                {/* PIC */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm mb-2">
                                        <User size={16} />
                                        <span>Person in Charge (PIC)</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                                        {selectedClient.pic_name || "-"}
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm mb-2">
                                        <Mail size={16} />
                                        <span>Email Address</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                                        {selectedClient.email}
                                    </div>
                                </div>

                                {/* Contact */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm mb-2">
                                        <Phone size={16} />
                                        <span>Contact</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                                        {selectedClient.contact || "-"}
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm mb-2">
                                        <MapPin size={16} />
                                        <span>Address</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 whitespace-pre-line">
                                        {selectedClient.address}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION MODAL */}
                {showDeleteConfirm && (
                    <div
                        ref={deleteModalRef}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleConfirmDelete();
                            } else if (e.key === 'Escape') {
                                setShowDeleteConfirm(false);
                            }
                        }}
                        tabIndex={-1}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setShowDeleteConfirm(false)}
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
                                <p className="text-gray-700">Are you sure want to delete this client?</p>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={handleConfirmDelete}
                                        className=" px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className=" px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
                    <div
                        ref={alertModalRef}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                                handleCloseAlert();
                            }
                        }}
                        tabIndex={-1}
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
            </div>
        </ClientLayout>
    );
};

export default Client;
