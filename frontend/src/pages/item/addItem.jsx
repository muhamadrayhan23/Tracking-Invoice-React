import { useState, useEffect } from "react";
import ItemLayout from "../../components/layout/Item-Layout";
import { useNavigate } from "react-router";
import { ChevronDown as ChevronDownIcon, X, CheckCircle } from "lucide-react";

const AddItem = () => {
    const [form, setForm] = useState({
        item_name: "",
        description: "",
        unit: "",
        category: "",
        default_price: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "default_price") {
            const parsedValue = value.replace(/Rp\s?/g, '').replace(/,/g, '');
            setForm((s) => ({ ...s, [name]: parseFloat(parsedValue) || 0 }));
        } else {
            setForm((s) => ({ ...s, [name]: value }));
        }
    };

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

    const navigate = useNavigate();

    const handleCloseAlert = () => {
        setShowAlert(false);

        if (alertType === 'success') {
            navigate('/items');
        }

        setAlertMessage("");
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!form.item_name || !form.category || !form.unit || form.default_price <= 0) {
            setError("Please fill required fields marked with *");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                item_name: form.item_name,
                unit: form.unit,
                description: form.description,
                category: form.category,
                default_price: form.default_price
            };

            const res = await fetch("http://localhost:3000/api/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

            setAlertMessage("Item successfully added!");
            setAlertType("success");
            setShowAlert(true);
        } catch (err) {
            setError(err.message || "Failed to create item");
            setLoading(false);
        }
    };

    return (
        <ItemLayout>
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-6">Create New Item</h1>
                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded border border-gray-200">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-1 font-semibold">Item Name <span className="text-red-500">*</span></label>
                            <input name="item_name" value={form.item_name} onChange={handleChange} className="w-full border-gray-200 border rounded px-3 py-2" placeholder="Enter item..." />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">Category <span className="text-red-500">*</span></label>
                            <input type="text" name="category" value={form.category} onChange={handleChange} className="w-full border-gray-200 border rounded px-3 py-2" placeholder="Enter category..." />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">Unit <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    name="unit"
                                    value={form.unit}
                                    onChange={handleChange}
                                    className="w-full border-gray-200 border rounded px-3 py-2 appearance-none"
                                >
                                    <option value="">Select Unit</option>
                                    <option value="day">day</option>
                                    <option value="month">month</option>
                                    <option value="year">year</option>
                                    <option value="unit">unit</option>
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-2.5 w-5 h-5 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold">Default Price<span className="text-red-500">*</span></label>
                            <input type="text" name="default_price" value={"Rp " + form.default_price.toLocaleString()} onChange={handleChange} className="w-full border border-gray-200 rounded p-2 text-left" />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Description (Optional)</label>
                        <textarea name="description" value={form.description} onChange={handleChange} className="w-full border-gray-200 border rounded px-3 py-2 h-28" placeholder="Enter Description..."></textarea>
                    </div>

                    {error && <div className="text-red-600">{error}</div>}
                    {success && <div className="text-green-600">{success}</div>}

                    <div className="flex justify-end items-center gap-3">
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">{loading ? "Saving..." : "Save"}</button>
                        <button type="button" onClick={() => navigate('/items')} className="border border-gray-200 px-4 py-2 rounded hover:bg-gray-300">Cancel</button>
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
        </ItemLayout>
    );
}

export default AddItem;