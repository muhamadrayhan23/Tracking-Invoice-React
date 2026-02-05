import { useState, useEffect } from "react";
import ProjectLayout from "../../components/layout/Project-Layout";
import { useNavigate } from "react-router";
import { X, CheckCircle } from "lucide-react";

const AddProject = () => {
    const [form, setForm] = useState({
        client_id: "",
        project_title: "",
        description: "",
        start_date: "",
        end_date: "",
        status: "Start"
    });
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");


    const navigate = useNavigate();

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/clients");
                if (!res.ok) throw new Error("Failed to load clients");
                const data = await res.json();
                setClients(data || []);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchClients();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showAlert) return;

            if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                handleCloseAlert();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAlert, alertType]);

    const filteredClients = clients.filter(client =>
        client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setShowDropdown(true);

        // Check if the typed value exactly matches a client's company_name
        const matchingClient = clients.find(client => client.company_name.toLowerCase() === value.toLowerCase());
        if (matchingClient) {
            setForm(prev => ({ ...prev, client_id: matchingClient.id }));
        } else {
            setForm(prev => ({ ...prev, client_id: "" }));
        }
    };

    const handleClientSelect = (client) => {
        setForm(prev => ({ ...prev, client_id: client.id }));
        setSearchTerm(client.company_name);
        setShowDropdown(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const handleCloseAlert = () => {
        setShowAlert(false);

        if (alertType === 'success') {
            navigate('/projects');
        }

        setAlertMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!form.client_id || !form.project_title || !form.start_date || !form.status) {
            setError("Please fill required fields marked with *");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                client_id: form.client_id,
                project_title: form.project_title,
                description: form.description || null,
                start_date: form.start_date,
                end_date: form.end_date || null,
                status: form.status
            };

            const res = await fetch("http://localhost:3000/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

            setAlertMessage("Project successfully added!");
            setAlertType("success");
            setShowAlert(true);
            setLoading(false);
        } catch (err) {
            setError(err.message || "Failed to create project");
            setLoading(false);
        }
    };

    return (
        <ProjectLayout>
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-6">Create New Project</h1>
                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded border border-gray-200">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-1 font-semibold">Client <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    onFocus={() => setShowDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                    className="w-full border border-gray-200 rounded px-3 py-2"
                                    placeholder="Search and select client..."
                                />
                                {showDropdown && filteredClients.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 max-h-40 overflow-y-auto">
                                        {filteredClients.map((client) => (
                                            <li
                                                key={client.id}
                                                onMouseDown={() => handleClientSelect(client)}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                            >
                                                {client.company_name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">Project Title <span className="text-red-500">*</span></label>
                            <input
                                name="project_title"
                                value={form.project_title}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                                placeholder="Enter project title..."
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">Start Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                name="start_date"
                                value={form.start_date}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">End Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                name="end_date"
                                value={form.end_date}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">Status <span className="text-red-500">*</span></label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                            >
                                <option value="Start">Start</option>
                                <option value="UAT">UAT</option>
                                <option value="Complete">Complete</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded px-3 py-2 h-28"
                            placeholder="Enter description..."
                        ></textarea>
                    </div>

                    {error && <div className="text-red-600">{error}</div>}
                    {success && <div className="text-green-600">{success}</div>}

                    <div className="flex justify-end items-center gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            {loading ? "Saving..." : "Save"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/projects')}
                            className="border border-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                {/* ALERT MODAL */}
                {showAlert && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center"
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
                                        autoFocus
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

export default AddProject;
