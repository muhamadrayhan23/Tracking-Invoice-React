import ItemLayout from "../../components/layout/Item-Layout";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronDown, X, CheckCircle } from "lucide-react";

const EditItem = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const handleCloseAlert = () => {
        setShowAlert(false);
        if (alertType === "success") {
            navigate("/items");
        }
        setAlertMessage("");
    };

    const [form, setForm] = useState({
        item_name: "",
        description: "",
        unit: "",
        category: "",
        default_price: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "default_price") {
            const parsedValue = value.replace(/Rp\s?/g, '').replace(/,/g, '');
            setForm(prev => ({ ...prev, [name]: parseFloat(parsedValue) || 0 }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const res = await fetch(`http://localhost:3000/api/items/${id}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.message || "Failed to load item");

                setForm({
                    item_name: data.item_name || "",
                    description: data.description || "",
                    unit: data.unit || "",
                    category: data.category || "",
                    default_price: data.default_price || ""
                });
            } catch (err) {
                setError(err.message);
            }
        };

        fetchItem();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.item_name || !form.unit || !form.category || !form.default_price) {
            setError("Please fill required fields marked with *");
            return;
        }

        setLoading(true);
        try {
            const payload = { ...form, default_price: Number(form.default_price) };

            const res = await fetch(`http://localhost:3000/api/items/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update item");

            setAlertMessage("Item successfully updated!");
            setAlertType("success");
            setShowAlert(true);
        } catch (err) {

            setAlertMessage(err.message);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setLoading(false);
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

    return (
        <ItemLayout>
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-6">Edit Item</h1>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded border border-gray-200">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-1 font-semibold">
                                Item Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="item_name"
                                value={form.item_name}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-semibold">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-semibold">Unit <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    name="unit"
                                    value={form.unit}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded px-3 py-2 appearance-none"
                                >
                                    <option value="">Select Unit</option>
                                    <option value="day">day</option>
                                    <option value="month">month</option>
                                    <option value="year">year</option>
                                    <option value="unit">unit</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-semibold">
                                Default Price <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="default_price"
                                value={"Rp " + form.default_price.toLocaleString()}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded p-2 text-left"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-semibold">
                            Description (Optional)
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded px-3 py-2 h-28"
                        />
                    </div>

                    {error && <div className="text-red-600">{error}</div>}

                    <div className="flex justify-end gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            {loading ? "Saving..." : "Update"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/items")}
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
        </ItemLayout>
    );
};

export default EditItem;
