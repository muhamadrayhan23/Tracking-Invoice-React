import ClientLayout from "../../components/layout/Client-Layout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Plus, ChevronDown, X, CheckCircle } from "lucide-react";

const AddClient = () => {
    const [form, setForm] = useState({
        company_name: "",
        sub_company: "",
        company_code: "",
        subcompany_code: "",
        pic_name: "",
        email: "",
        contact: "",
        address: "",
        username: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [showNewCompanyInput, setShowNewCompanyInput] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/clients/companies");
                const data = await res.json();
                if (res.ok) {
                    setCompanies(data);
                }
            } catch (err) {
                console.error("Failed to fetch companies:", err);
            }
        };

        fetchCompanies();
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
    }, [showAlert]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const handleCompanySelect = (e) => {
        const selectedCompanyName = e.target.value;
        const selectedCompany = companies.find(company => company.company_name === selectedCompanyName);
        setForm((prev) => ({
            ...prev,
            company_name: selectedCompanyName,
            company_code: selectedCompany ? selectedCompany.company_code : ""
        }));
    };

    const handleNewCompanySubmit = () => {
        if (newCompanyName.trim()) {
            setForm((prev) => ({ ...prev, company_name: newCompanyName.trim(), company_code: "" }));
            setCompanies((prev) => [...prev, { company_name: newCompanyName.trim(), company_code: null }]);
            setShowNewCompanyInput(false);
            setNewCompanyName("");
        }
    };

    const navigate = useNavigate();

    const handleCloseAlert = () => {
        setShowAlert(false);

        if (alertType === 'success') {
            navigate('/clients');
        }

        setAlertMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!form.company_name || !form.company_code || !form.email || !form.address) {
            setError("Please fill required fields marked with *");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                company_name: form.company_name,
                sub_company: form.sub_company || null,
                company_code: form.company_code || null,
                subcompany_code: form.subcompany_code || null,
                pic_name: form.pic_name,
                email: form.email,
                address: form.address,
                contact: form.contact,
                username: form.username || null,
                password: form.password || null
            };

            const res = await fetch("http://localhost:3000/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

            setAlertMessage("Client successfully added!");
            setAlertType("success");
            setShowAlert(true);
            setLoading(false);
        } catch (err) {
            setError(err.message || "Failed to create client");
            setLoading(false);
        }
    };

    return (
        <ClientLayout>
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-6">Create New Client</h1>
                {/* Basic Info */}
                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded border border-gray-200 ">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-1 font-semibold">Company Name <span className="text-red-500">*</span></label>
                            {showNewCompanyInput ? (
                                <div className="flex gap-2">
                                    <input
                                        value={newCompanyName}
                                        onChange={(e) => setNewCompanyName(e.target.value)}
                                        className="flex-1 border-gray-200 border rounded px-3 py-2"
                                        placeholder="Enter new company name..."
                                        onKeyPress={(e) => e.key === 'Enter' && handleNewCompanySubmit()}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleNewCompanySubmit}
                                        className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-700"
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNewCompanyInput(false);
                                            setNewCompanyName("");
                                        }}
                                        className=" px-3 py-2 rounded border border-gray-200 hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <select
                                            value={form.company_name}
                                            onChange={handleCompanySelect}
                                            className="w-full border-gray-200 border rounded px-3 py-2 appearance-none bg-white pr-10"
                                        >
                                            <option value="">Select Company</option>
                                            {companies.map((company, index) => (
                                                <option key={company.company_name || index} value={company.company_name}>
                                                    {company.company_name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewCompanyInput(true)}
                                        className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center gap-1"
                                        title="Add new company"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">Company Code <span className="text-red-500">*</span></label>
                            <input name="company_code" value={form.company_code} onChange={handleChange} type="number" className="w-full border-gray-200 border rounded px-3 py-2" placeholder="Enter company code..." />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">Sub Company (Optional)</label>
                            <input name="sub_company" value={form.sub_company} onChange={handleChange} className="w-full border-gray-200 border rounded px-3 py-2" placeholder="Enter company name..." />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">Subcompany Code (Optional)</label>
                            <input name="subcompany_code" value={form.subcompany_code} onChange={handleChange} type="number" className="w-full border-gray-200 border rounded px-3 py-2" placeholder="Enter subcompany code..." />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">PIC Name (Optional)</label>
                            <input name="pic_name" value={form.pic_name} onChange={handleChange} className="w-full border-gray-200 border rounded px-3 py-2" placeholder="Enter PIC name..." />
                        </div>

                        <div>
                            <label className="block mb-1 font-semibold">Email <span className="text-red-500">*</span></label>
                            <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full border-gray-200 border rounded px-3 py-2" placeholder="Enter email address..." />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">Contact (Optional)</label>
                            <input name="contact" value={form.contact} onChange={handleChange} className="w-full border-gray-200 border rounded px-3 py-2" placeholder="Enter contact..." />
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-semibold">Address <span className="text-red-500">*</span></label>
                        <textarea name="address" value={form.address} onChange={handleChange} className="w-full border-gray-200 border rounded px-3 py-2 h-28" placeholder="Enter Address..."></textarea>
                    </div>

                    {/* Username and Password Optional  */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-1 font-semibold">Username (Optional)</label>
                            <input name="username" value={form.username} onChange={handleChange} className="w-full border-gray-200 border rounded px-3 py-2" placeholder="Enter username..." />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">Password (Optional)</label>

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="w-full border-gray-200 border rounded px-3 py-2 pr-10"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && <div className="text-red-600">{error}</div>}
                    {success && <div className="text-green-600">{success}</div>}

                    <div className="flex justify-end items-center gap-3">
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">{loading ? "Saving..." : "Save"}</button>
                        <button type="button" onClick={() => navigate('/clients')} className="border-gray-200 border px-4 py-2 rounded hover:bg-gray-300">Cancel</button>
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
        </ClientLayout>
    );
}

export default AddClient;
