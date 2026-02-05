import { useEffect, useState, useRef } from "react";
import ProjectLayout from "../../components/layout/Project-Layout";
import { Link } from "react-router";
import { X, Eye, RotateCcw, Building, ReceiptText, Search, Calendar, CheckCircle, Trash2, ArrowLeft } from "lucide-react";

const TrashProject = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [projectToRestore, setProjectToRestore] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");

    const restoreModalRef = useRef(null);
    const deleteModalRef = useRef(null);
    const alertModalRef = useRef(null);

    const filteredProjects = projects.filter((p) =>
        p.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

    const paginatedProjects = filteredProjects.slice(
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

    const fetchDeletedProjects = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:3000/api/projects/trash");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setProjects(data || []);
        } catch (err) {
            setError(err.message || "Failed to load");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeletedProjects();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        if (showRestoreConfirm && restoreModalRef.current) {
            restoreModalRef.current.focus();
        }
    }, [showRestoreConfirm]);

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

    const handleRestoreClick = (id) => {
        setProjectToRestore(id);
        setShowRestoreConfirm(true);
    };

    const handleDeleteClick = (id) => {
        setProjectToDelete(id);
        setShowDeleteConfirm(true);
    };

    const handleConfirmRestore = async () => {
        if (!projectToRestore) return;

        try {
            const res = await fetch(`http://localhost:3000/api/projects/restore/${projectToRestore}`, {
                method: "PUT",
            });

            if (!res.ok) throw new Error("Failed to restore");

            setAlertMessage("Project successfully restored!");
            setAlertType("success");
            setShowAlert(true);
            fetchDeletedProjects();
        } catch (err) {
            setAlertMessage(err.message);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setShowRestoreConfirm(false);
            setProjectToRestore(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;

        try {
            const res = await fetch(`http://localhost:3000/api/projects/permanent/${projectToDelete}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Gagal menghapus permanen");

            setAlertMessage("Project successfully deleted permanently!");
            setAlertType("success");
            setShowAlert(true);
            fetchDeletedProjects();
        } catch (err) {
            setAlertMessage(err.message);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setShowDeleteConfirm(false);
            setProjectToDelete(null);
        }
    };

    const handleCloseAlert = () => {
        setShowAlert(false);
        setAlertMessage("");
    };

    return (
        <ProjectLayout>
            <div className="m-3 flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2.5">
                    <Link
                        to="/projects"
                        className="flex items-center px-4 py-2 gap-2 rounded text-gray-500 hover:text-gray-700 "
                    >
                        <ArrowLeft size={16} className="" />
                        Back to Projects
                    </Link>
                </div>

                <div className="bg-white rounded border border-gray-200 p-4">
                    <div className="flex justify-between items-center mb-4 relative">
                        <h2 className="font-medium">Deleted Project List</h2>
                        <input
                            type="search"
                            placeholder="Search project..."
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
                                        <th className="py-3">Project</th>
                                        <th>Company</th>
                                        <th>Status</th>
                                        <th>Deleted At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedProjects.map((p) => (
                                        <tr key={p.id} className="border-b border-gray-200">
                                            <td className="py-4">{p.project_title}</td>
                                            <td>{p.company_name}</td>
                                            <td>{p.status}</td>
                                            <td>{formatDate(p.deleted_at)}</td>
                                            <td className=" gap-2 items-center p-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedProject(p);
                                                        setShowDetail(true);
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleRestoreClick(p.id)}
                                                    className="p-1 hover:bg-gray-100 rounded text-green-600"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteClick(p.id)}
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

                            {filteredProjects.length === 0 && (
                                <div className="text-center text-gray-500 mt-4 w-full">
                                    No deleted projects
                                </div>
                            )}
                        </div>

                    )}
                </div>

                {/* MODAL DETAIL */}

                {showDetail && selectedProject && (
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
                                    <h3 className="text-lg font-semibold">Deleted Project Details</h3>
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
                                        <Trash2 size={16} />
                                        <span>Project Title</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {selectedProject.project_title}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <ReceiptText size={16} />
                                        <span>Description</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {selectedProject.description || "No description"}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <Building size={16} />
                                        <span>Company</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {selectedProject.company_name || "No Client"}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <Calendar size={16} />
                                        <span>Start Date</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {formatDate(selectedProject.start_date)}
                                    </div>
                                </div>



                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <Calendar size={16} />
                                        <span>End Date</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {selectedProject.end_date ? formatDate(selectedProject.end_date) : "Not set"}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <CheckCircle size={16} />
                                        <span>Status</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {selectedProject.status}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-black mb-2">
                                        <Calendar size={16} />
                                        <span>Deleted At</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                                        {formatDate(selectedProject.deleted_at)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* RESTORE CONFIRMATION MODAL */}
                {showRestoreConfirm && (
                    <div
                        ref={restoreModalRef}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleConfirmRestore();
                            } else if (e.key === 'Escape') {
                                setShowRestoreConfirm(false);
                                setProjectToRestore(null);
                            }
                        }}
                        tabIndex={-1}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => {
                                setShowRestoreConfirm(false);
                                setProjectToRestore(null);
                            }}
                        />

                        {/* Modal */}
                        <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                                        <RotateCcw size={16} />
                                    </div>
                                    <h3 className="text-lg font-semibold">Restore Project</h3>
                                </div>
                            </div>

                            <div className="px-6 py-5">
                                <p className="text-gray-700">Restore this project?</p>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={handleConfirmRestore}
                                        className=" px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Restore
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowRestoreConfirm(false);
                                            setProjectToRestore(null);
                                        }}
                                        className=" px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
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
                                setProjectToDelete(null);
                            }
                        }}
                        tabIndex={-1}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => {
                                setShowDeleteConfirm(false);
                                setProjectToDelete(null);
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
                                    <h3 className="text-lg font-semibold">Delete Permanently</h3>
                                </div>
                            </div>

                            <div className="px-6 py-5">
                                <p className="text-gray-700">Permanently delete this project?</p>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={handleConfirmDelete}
                                        className=" px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setProjectToDelete(null);
                                        }}
                                        className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
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
        </ProjectLayout>
    );
};

export default TrashProject;
