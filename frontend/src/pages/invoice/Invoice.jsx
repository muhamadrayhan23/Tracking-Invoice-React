import { useEffect, useState } from "react";
import { Eye, Trash2, Search, Download, ChevronDown, Edit, Send, Filter, CheckCircle, X } from "lucide-react";
import { useNavigate } from "react-router";
import InvoiceLayout from "../../components/layout/Invoice-Layout";
import * as XLSX from 'xlsx';

const Invoice = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [periodStart, setPeriodStart] = useState("");
    const [periodEnd, setPeriodEnd] = useState("");
    const [selectedClient, setSelectedClient] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        invoiceNumber: "",
        client: "",
        quotation: "",
        invoiceDate: "",
        dueDate: "",
        total: "",
        status: ""
    });

    // Modal states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [invoiceToPublish, setInvoiceToPublish] = useState(null);

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

    useEffect(() => {
        fetchInvoices();
    }, []);

    const filteredInvoices = invoices.filter((inv) => {
        // Global search
        const matchesSearch = !searchTerm ||
            inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.status.toLowerCase().includes(searchTerm.toLowerCase());

        // Column filters
        const matchesInvoiceNumber = !filters.invoiceNumber || inv.invoice_number.toLowerCase().includes(filters.invoiceNumber.toLowerCase());
        const matchesClient = !filters.client || inv.company_name.toLowerCase().includes(filters.client.toLowerCase());
        const matchesQuotation = !filters.quotation || (inv.quotation_number && inv.quotation_number.toLowerCase().includes(filters.quotation.toLowerCase()));
        const matchesInvoiceDate = !filters.invoiceDate || formatDate(inv.issue_date).includes(filters.invoiceDate);
        const matchesDueDate = !filters.dueDate || formatDate(inv.due_date).includes(filters.dueDate);
        const matchesTotal = !filters.total || inv.total.toString().includes(filters.total);
        const matchesStatus = !filters.status || inv.status.toLowerCase().includes(filters.status.toLowerCase());

        return matchesSearch && matchesInvoiceNumber && matchesClient && matchesQuotation &&
            matchesInvoiceDate && matchesDueDate && matchesTotal && matchesStatus;
    });

    const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);

    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:3000/api/invoices");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setInvoices(data || []);
        } catch (err) {
            setError(err.message || "Failed to load");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        setInvoiceToDelete(id);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/invoices/${invoiceToDelete}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            setAlertMessage("Invoice succesfully deleted!");
            setAlertType("success");
            setShowAlert(true);
            fetchInvoices();
        } catch (err) {
            setAlertMessage(err.message);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setShowDeleteConfirm(false);
            setInvoiceToDelete(null);
        }
    };

    const handlePublishInvoice = (id) => {
        setInvoiceToPublish(id);
        setShowPublishConfirm(true);
    };

    const handleConfirmPublish = async () => {
        try {

            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            const userId = storedUser.id;

            if (!userId) {
                throw new Error("Sesi berakhir, silakan login kembali.");
            }

            const res = await fetch(`http://localhost:3000/api/invoices/${invoiceToPublish}/publish`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    issued_by: userId // Ini data yang ditunggu oleh backend Anda
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to publish invoice");
            }

            setAlertMessage("Invoice successfully published!");
            setAlertType("success");
            setShowAlert(true);
            fetchInvoices();
        } catch (err) {
            setAlertMessage(err.message);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setShowPublishConfirm(false);
            setInvoiceToPublish(null);
        }
    };

    const handleCloseAlert = () => {
        setShowAlert(false);
        setAlertMessage("");
    };

    // Keyboard event handlers for modals
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showDeleteConfirm) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmDelete();
                } else if (e.key === "Escape") {
                    setShowDeleteConfirm(false);
                }
            } else if (showPublishConfirm) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmPublish();
                } else if (e.key === "Escape") {
                    setShowPublishConfirm(false);
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
    }, [showDeleteConfirm, showPublishConfirm, showAlert]);

    const statusBadge = (status) => {
        const base = "px-3 py-1 rounded-full text-xs font-medium";
        switch (status) {
            case "Draft":
                return `${base} bg-gray-200 text-gray-700`;
            case "Issued":
                return `${base} bg-yellow-100 text-yellow-700`;
            case "Partially Paid":
                return `${base} bg-blue-100 text-blue-700`;
            case "Paid":
                return `${base} bg-green-100 text-green-700`;
            case "Overdue":
                return `${base} bg-red-100 text-red-700`;
            default:
                return base;
        }
    };

    // Filter for Client and Status Invoice
    const uniqueClients = [...new Set(invoices.map(inv => inv.company_name))].sort((a, b) => a.localeCompare(b));
    const statuses = ["Draft", "Issued", "Partially Paid", "Paid", "Overdue"];

    // Unique values for column filters
    const uniqueInvoiceNumbers = [...invoices]
        .sort((a, b) => b.id - a.id)
        .map(inv => inv.invoice_number);
    const uniqueQuotations = [...new Set(invoices.map(inv => inv.quotation_number).filter(q => q))].sort()
    const uniqueInvoiceDates = [...new Set(invoices.map(inv => formatDate(inv.issue_date)))].sort();
    const uniqueDueDates = [...new Set(invoices.map(inv => formatDate(inv.due_date)))].sort();
    const uniqueTotals = [...new Set(invoices.map(inv => inv.total))].sort((a, b) => a - b).map(t => t.toString());

    // Filter invoices for download
    const filteredForDownload = invoices.filter((inv) => {
        const matchesPeriod = (!periodStart || new Date(inv.issue_date) >= new Date(periodStart)) &&
            (!periodEnd || new Date(inv.issue_date) <= new Date(periodEnd));
        const matchesClient = !selectedClient || inv.company_name === selectedClient;
        const matchesStatus = !selectedStatus || inv.status === selectedStatus;
        return matchesPeriod && matchesClient && matchesStatus;
    });


    // Handle download to Excel
    const handleDownload = () => {
        const data = filteredForDownload.map(inv => ({
            'Invoice Number': inv.invoice_number,
            'Client': inv.company_name,
            'Issue Date': new Date(inv.issue_date).toLocaleDateString(), // Format date
            'Due Date': new Date(inv.due_date).toLocaleDateString(), // Format date
            'Total': `Rp ${Number(inv.total).toLocaleString("id-ID")}`, // Format currency
            'Status': inv.status
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Invoices");

        const columnWidths = [
            { wch: 20 }, // Invoice Number
            { wch: 30 }, // Client
            { wch: 15 }, // Issue Date
            { wch: 15 }, // Due Date
            { wch: 15 }, // Total
            { wch: 15 }  // Status
        ];
        ws['!cols'] = columnWidths;

        XLSX.writeFile(wb, "invoices.xlsx");
    };

    return (
        <InvoiceLayout>
            <div className="m-3 flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2.5">
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
                            className="border border-gray-200 rounded px-3 pr-9 py-1"></input>
                        <Search
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                    </div>

                    <div className="mb-4">
                        <h3 className="font-medium mb-2">Download Filters</h3>
                        <div className="flex gap-4 flex-wrap">
                            <div>
                                <label className="block text-sm">Period Start</label>
                                <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="border border-gray-200 rounded px-2 py-1" />
                            </div>
                            <div>
                                <label className="block text-sm">Period End</label>
                                <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="border border-gray-200 rounded px-2 py-1" />
                            </div>
                            <div>
                                <label className="block text-sm">Client</label>
                                <div className="relative">
                                    <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="border border-gray-200 rounded px-2 py-1 appearance-none">
                                        <option value="">All</option>
                                        {uniqueClients.map(client => <option key={client} value={client}>{client}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 p-2 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm">Status</label>
                                <div className="relative">
                                    <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="border border-gray-200 rounded px-2 py-1 appearance-none">
                                        <option value="">All</option>
                                        {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 p-2 pointer-events-none" />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button onClick={handleDownload} className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2">
                                    <Download size={16} />
                                    Download Excel
                                </button>
                            </div>
                        </div>
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
                                        <th className="py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                Invoice Number
                                                <Filter size={14} className="cursor-pointer" onClick={() => setShowFilters(!showFilters)} />
                                            </div>
                                        </th>
                                        <th>
                                            <div className="flex items-center justify-center gap-1">
                                                Client
                                                <Filter size={14} className="cursor-pointer" onClick={() => setShowFilters(!showFilters)} />
                                            </div>
                                        </th>
                                        <th>
                                            <div className="flex items-center justify-center gap-1">
                                                Quotation
                                                <Filter size={14} className="cursor-pointer" onClick={() => setShowFilters(!showFilters)} />
                                            </div>
                                        </th>
                                        <th>
                                            <div className="flex items-center justify-center gap-1">
                                                Invoice Date
                                                <Filter size={14} className="cursor-pointer" onClick={() => setShowFilters(!showFilters)} />
                                            </div>
                                        </th>
                                        <th>
                                            <div className="flex items-center justify-center gap-1">
                                                Due Date
                                                <Filter size={14} className="cursor-pointer" onClick={() => setShowFilters(!showFilters)} />
                                            </div>
                                        </th>
                                        <th>
                                            <div className="flex items-center justify-center gap-1">
                                                Total
                                                <Filter size={14} className="cursor-pointer" onClick={() => setShowFilters(!showFilters)} />
                                            </div>
                                        </th>
                                        <th>
                                            <div className="flex items-center justify-center gap-1">
                                                Status
                                                <Filter size={14} className="cursor-pointer" onClick={() => setShowFilters(!showFilters)} />
                                            </div>
                                        </th>
                                        <th>Actions</th>
                                    </tr>
                                    {showFilters && (
                                        <tr className="text-sm bg-gray-50">
                                            <th className="py-3 px-2">
                                                <select
                                                    value={filters.invoiceNumber}
                                                    onChange={(e) => setFilters({ ...filters, invoiceNumber: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 font-normal"
                                                >
                                                    <option value="">All</option>
                                                    {uniqueInvoiceNumbers.map(num => <option key={num} value={num}>{num}</option>)}
                                                </select>
                                            </th>
                                            <th className="py-3 px-2">
                                                <select
                                                    value={filters.client}
                                                    onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 font-normal"
                                                >
                                                    <option value="">All</option>
                                                    {uniqueClients.map(client => <option key={client} value={client}>{client}</option>)}
                                                </select>
                                            </th>
                                            <th className="py-3 px-2">
                                                <select
                                                    value={filters.quotation}
                                                    onChange={(e) => setFilters({ ...filters, quotation: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 font-normal"
                                                >
                                                    <option value="">All</option>
                                                    {uniqueQuotations.map(quot => <option key={quot} value={quot}>{quot}</option>)}
                                                </select>
                                            </th>
                                            <th className="py-3 px-2">
                                                <div className="flex flex-col gap-1">
                                                    <input
                                                        type="date"
                                                        className="text-[10px] border rounded px-1"
                                                        onChange={(e) => setFilters({ ...filters, periodStart: e.target.value })}
                                                    />
                                                    <input
                                                        type="date"
                                                        className="text-[10px] border rounded px-1"
                                                        onChange={(e) => setFilters({ ...filters, periodEnd: e.target.value })}
                                                    />
                                                </div>
                                            </th>
                                            <th className="py-3 px-2">
                                                <select
                                                    value={filters.dueDate}
                                                    onChange={(e) => setFilters({ ...filters, dueDate: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 font-normal"
                                                >
                                                    <option value="">All</option>
                                                    {uniqueDueDates.map(date => <option key={date} value={date}>{date}</option>)}
                                                </select>
                                            </th>
                                            <th className="py-3 px-2">
                                                <select
                                                    value={filters.total}
                                                    onChange={(e) => setFilters({ ...filters, total: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 font-normal"
                                                >
                                                    <option value="">All</option>
                                                    {uniqueTotals.map(total => <option key={total} value={total}>{total}</option>)}
                                                </select>
                                            </th>
                                            <th className="py-3 px-2">
                                                <select
                                                    value={filters.status}
                                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 font-normal"
                                                >
                                                    <option value="">All</option>
                                                    {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                                                </select>
                                            </th>
                                            <th></th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {paginatedInvoices.map((inv) => (
                                        <tr key={inv.id} className="border-b border-gray-200">
                                            <td className="py-4">{inv.invoice_number}</td>
                                            <td className="py-4">{inv.company_name}</td>
                                            <td className="py-4">{inv.quotation_number || '-'}</td>
                                            <td className="py-4">{formatDate(inv.issue_date)}</td>
                                            <td className="py-4">{formatDate(inv.due_date)}</td>
                                            <td className="py-4">Rp {Number(inv.total).toLocaleString("id-ID")}</td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs ${inv.status === 'Draft' ? 'text-gray-600 bg-gray-50' :
                                                    inv.status === 'Issued' ? 'text-yellow-500 bg-yellow-50' :
                                                        inv.status === 'Partially Paid' ? 'text-blue-500 bg-blue-50' :
                                                            inv.status === 'Paid' ? 'text-green-500 bg-green-50' :
                                                                inv.status === 'Overdue' ? 'text-red-500 bg-red-50' :
                                                                    'text-gray-500 bg-gray-50'
                                                    }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="flex gap-2 items-center justify-center py-4">
                                                <button
                                                    onClick={() => {
                                                        navigate(`/invoices/${inv.id}`)
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {inv.status === "Draft" && (
                                                    <>
                                                        <button
                                                            onClick={() => navigate(`/invoices/edit/${inv.id}`)}
                                                            className="p-1 hover:bg-gray-100 rounded text-indigo-600"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePublishInvoice(inv.id)}
                                                            className="p-1 hover:bg-gray-100 rounded text-green-600"
                                                        >
                                                            <Send size={16} />
                                                        </button>
                                                    </>
                                                )}

                                                <button
                                                    onClick={() => handleDelete(inv.id)}
                                                    disabled={inv.status !== "Draft"}
                                                    className={`p-1 rounded text-red-600 ${inv.status !== "Draft"
                                                        ? 'opacity-50 cursor-not-allowed'
                                                        : 'hover:bg-gray-100'
                                                        }`}
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

                            {filteredInvoices.length === 0 && (
                                <div className="text-center text-gray-500 mt-4 w-full">
                                    Invoices Not Available
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
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
                            <p className="text-gray-700">Are you sure want to delete this invoice?</p>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PUBLISH CONFIRMATION MODAL */}
            {showPublishConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowPublishConfirm(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                                    <Send size={16} />
                                </div>
                                <h3 className="text-lg font-semibold">Confirm Publish</h3>
                            </div>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-gray-700">Are you sure you want to publish this invoice?</p>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={handleConfirmPublish}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Publish
                                </button>
                                <button
                                    onClick={() => setShowPublishConfirm(false)}
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
        </InvoiceLayout>
    );
};

export default Invoice;
