import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { Trash2, Plus, X, CheckCircle } from "lucide-react";
import SlateEditor from "../../components/SlateEditor";
import QuotationLayout from "../../components/layout/Quotation-Layout";
import { getMe } from "../../services/authService";

const EditQuotation = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Loading state
    const [loading, setLoading] = useState(true);

    //   Master Data
    const [clients, setClients] = useState([]);
    const [itemsMaster, setItemsMaster] = useState([]);
    const [projects, setProjects] = useState([]);

    // Set Alert State
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const [showUpdatedModal, setShowUpdatedModal] = useState(false);
    const [showSentModal, setShowSentModal] = useState(false);
    const [showLessThanModal, setShowLessThanModal] = useState(false);
    const [showMoreThanModal, setShowMoreThanModal] = useState(false);
    const [showNoProjectModal, setShowNoProjectModal] = useState(false);


    // Form
    const [form, setForm] = useState({
        quotation_number: "",
        client_id: "",
        project_id: "",
        estimate_date: "",
        expiry_date: "",
        project_title: "",
        // start_date: "",
        // deadline: "",
        term_condition: "",
        discount: 0,
        discount_type: "percent",
        tax: 0,
        tax_type: "percent",
    });

    const [quotationItems, setQuotationItems] = useState([
        {
            item_id: "",
            item_name: "",
            description: "",
            unit: "",
            qty: 1,
            price: 0,
        },
    ]);

    const [quotationTerms, setQuotationTerms] = useState([
        {
            term_number: 1,
            nominal: 0,
            term_estimate: "",
            term_percentage: 0,
        },
    ]);

    // Search and dropdown states
    const [searchTermClient, setSearchTermClient] = useState("");
    const [showDropdownClient, setShowDropdownClient] = useState(false);
    const [searchTermProject, setSearchTermProject] = useState("");
    const [showDropdownProject, setShowDropdownProject] = useState(false);
    const [searchTermItems, setSearchTermItems] = useState([]);
    const [showDropdownItems, setShowDropdownItems] = useState([]);

    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        // Mengimbangi pergeseran timezone agar tanggal tidak berkurang 1 hari
        const offset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
        return adjustedDate.toISOString().split("T")[0];
    };

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    quotationRes,
                    clientsRes,
                    itemsRes,
                    projectsRes,
                ] = await Promise.all([
                    fetch(`http://localhost:3000/api/quotations/${id}`),
                    fetch("http://localhost:3000/api/clients"),
                    fetch("http://localhost:3000/api/items"),
                    fetch("http://localhost:3000/api/projects"),
                ]);

                const quotationData = await quotationRes.json();
                const clientsData = await clientsRes.json();
                const itemsData = await itemsRes.json();
                const projectsData = await projectsRes.json();

                setClients(clientsData);
                setItemsMaster(itemsData);
                setProjects(projectsData);

                // Calculate original discount and tax percentages
                const subtotal = quotationData.quotation.subtotal || 0;
                const discountType = quotationData.quotation.discount_type || "percent";
                const taxType = quotationData.quotation.tax_type || "percent";

                let discount = quotationData.quotation.discount || 0;
                if (discountType === "percent" && subtotal > 0) {
                    discount = (discount / subtotal) * 100;
                }

                let tax = quotationData.quotation.tax || 0;
                if (taxType === "percent" && subtotal > 0) {
                    tax = (tax / subtotal) * 100;
                }

                setForm({
                    quotation_number: quotationData.quotation.quotation_number || "",
                    client_id: quotationData.quotation.client_id || "",
                    project_id: quotationData.quotation.project_id || "",

                    // QUOTATION DATE
                    estimate_date: formatDateForInput(quotationData.quotation.estimate_date),
                    expiry_date: formatDateForInput(quotationData.quotation.expiry_date),

                    // PROJECT INFO
                    project_title: quotationData.quotation.project_title || "",
                    // start_date: formatDateForInput(quotationData.quotation.start_date),
                    // deadline: formatDateForInput(quotationData.quotation.deadline),

                    term_condition: quotationData.quotation.term_condition || "",

                    discount: discount,
                    discount_type: quotationData.quotation.discount_type || "percent",
                    tax: tax,
                    tax_type: quotationData.quotation.tax_type || "percent",
                });


                // Item
                setQuotationItems(
                    quotationData.items.map(i => ({
                        item_id: i.item_id,
                        item_name: i.item_name,
                        description: i.description,
                        unit: i.unit,
                        qty: i.qty,
                        price: i.price,
                    }))
                );

                // Terms
                setQuotationTerms(quotationData.terms.map(t => ({
                    term_number: t.term_number,
                    nominal: t.nominal,
                    term_estimate: formatDateForInput(t.term_estimate),
                    term_percentage: Math.floor(t.term_percentage),
                })));

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Initialize search terms when data is loaded
    useEffect(() => {
        if (clients.length > 0 && projects.length > 0 && form.client_id) {
            const client = clients.find(c => c.id === Number(form.client_id));
            if (client) {
                setSearchTermClient(client.company_name);
            }
            if (form.project_title) {
                setSearchTermProject(form.project_title);
            }
        }
    }, [clients, projects, form.client_id, form.project_title]);



    // Filtered lists for dropdowns
    const filteredClients = clients.filter(client =>
        client.company_name.toLowerCase().includes(searchTermClient.toLowerCase())
    );

    const filteredProjects = projects.filter(project =>
        project.project_title.toLowerCase().includes(searchTermProject.toLowerCase()) &&
        (!form.client_id || project.client_id === Number(form.client_id))
    );

    const filteredItems = (index) => itemsMaster.filter(item =>
        item.item_name.toLowerCase().includes((searchTermItems[index] || "").toLowerCase())
    );

    // Handlers for search and selection
    const handleSearchClientChange = (e) => {
        const value = e.target.value;
        setSearchTermClient(value);
        setShowDropdownClient(true);

        // Check if the typed value exactly matches a client's company_name
        const matchingClient = clients.find(client => client.company_name.toLowerCase() === value.toLowerCase());
        if (matchingClient) {
            setForm(prev => ({ ...prev, client_id: matchingClient.id, project_id: "" }));
            setSearchTermProject(""); // Reset project search when client changes
        } else {
            setForm(prev => ({ ...prev, client_id: "", project_id: "" }));
        }
    };

    const handleClientSelect = (client) => {
        setForm(prev => ({ ...prev, client_id: client.id, project_id: "" }));
        setSearchTermClient(client.company_name);
        setShowDropdownClient(false);
        setSearchTermProject(""); // Reset project search
    };

    const handleProjectFocus = () => {
        if (form.client_id) {
            const clientProjects = projects.filter(project => project.client_id === Number(form.client_id));
            if (clientProjects.length === 0) {
                setShowNoProjectModal(true);
            }
        }
    };

    const handleSearchProjectChange = (e) => {
        const value = e.target.value;
        setSearchTermProject(value);
        setShowDropdownProject(true);

        // Check if the typed value exactly matches a project's title
        const matchingProject = projects.find(project => project.project_title.toLowerCase() === value.toLowerCase());
        if (matchingProject) {
            setForm(prev => ({
                ...prev,
                project_id: matchingProject.id,
                project_title: matchingProject.project_title,
                start_date: matchingProject.start_date.split("T")[0],
                deadline: matchingProject.end_date.split("T")[0],
                client_id: matchingProject.client_id
            }));
            // Also set client search term
            const client = clients.find(c => c.id === matchingProject.client_id);
            if (client) {
                setSearchTermClient(client.company_name);
            }
        } else {
            setForm(prev => ({ ...prev, project_id: "", project_title: value }));
        }
    };

    const handleProjectSelect = (project) => {
        setForm(prev => ({
            ...prev,
            project_id: project.id,
            project_title: project.project_title,
            start_date: project.start_date.split("T")[0],
            deadline: project.end_date.split("T")[0],
            client_id: project.client_id
        }));
        setSearchTermProject(project.project_title);
        setShowDropdownProject(false);
        // Also set client search term
        const client = clients.find(c => c.id === project.client_id);
        if (client) {
            setSearchTermClient(client.company_name);
        }
    };

    const handleSearchItemChange = (index, e) => {
        const value = e.target.value;
        setSearchTermItems(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
        setShowDropdownItems(prev => {
            const updated = [...prev];
            updated[index] = true;
            return updated;
        });

        // Check if the typed value exactly matches an item's name
        const matchingItem = itemsMaster.find(item => item.item_name.toLowerCase() === value.toLowerCase());
        if (matchingItem) {
            setQuotationItems(prev => {
                const updated = [...prev];
                updated[index].item_id = matchingItem.id;
                updated[index].item_name = matchingItem.item_name;
                updated[index].description = matchingItem.description || "";
                updated[index].unit = matchingItem.unit || "";
                updated[index].price = matchingItem.default_price || 0;
                return updated;
            });
        } else {
            setQuotationItems(prev => {
                const updated = [...prev];
                updated[index].item_id = "";
                updated[index].item_name = value;
                return updated;
            });
        }
    };

    const handleItemSelect = (index, item) => {
        setQuotationItems(prev => {
            const updated = [...prev];
            updated[index].item_id = item.id;
            updated[index].item_name = item.item_name;
            updated[index].description = item.description || "";
            updated[index].unit = item.unit || "";
            updated[index].price = item.default_price || 0;
            return updated;
        });
        setSearchTermItems(prev => {
            const updated = [...prev];
            updated[index] = item.item_name;
            return updated;
        });
        setShowDropdownItems(prev => {
            const updated = [...prev];
            updated[index] = false;
            return updated;
        });
    };


    // Calculate totals
    const subtotal = useMemo(() => quotationItems.reduce(
        (sum, i) => sum + i.qty * i.price,
        0
    ), [quotationItems]);

    const discountValue = useMemo(() =>
        form.discount_type === "percent"
            ? (subtotal * Number(form.discount)) / 100
            : Number(form.discount),
        [subtotal, form.discount, form.discount_type]
    );

    const taxValue = useMemo(() => {
        const dpp = subtotal - discountValue;
        return form.tax_type === "percent"
            ? (dpp * Number(form.tax)) / 100
            : Number(form.tax);
    }, [subtotal, discountValue, form.tax, form.tax_type]);

    const total = useMemo(() => subtotal - discountValue + taxValue, [subtotal, discountValue, taxValue]);

    // Recalculate nominals when total changes
    useEffect(() => {
        setQuotationTerms(prev => prev.map(term => ({
            ...term,
            nominal: (total * term.term_percentage) / 100
        })));
    }, [total]);



    // Item Handler
    const addLine = () => {
        setQuotationItems(prev => [
            ...prev,
            {
                item_id: "",
                item_name: "",
                description: "",
                unit: "",
                qty: 1,
                price: 0
            },
        ]);
    };

    const removeLine = index => {
        setQuotationItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        setQuotationItems(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const handleSelectItem = (index, itemId) => {
        const selected = itemsMaster.find(i => i.id === Number(itemId));
        setQuotationItems(prev => {
            const updated = [...prev];
            updated[index].item_id = itemId;
            updated[index].item_name = selected?.item_name || "";
            updated[index].description = selected?.description || "";
            updated[index].unit = selected?.unit || "";
            updated[index].price = selected?.default_price || 0;
            return updated;
        });
    };

    // Term Handler
    const addTerm = () => {
        setQuotationTerms(prev => [
            ...prev,
            {
                term_number: prev.length + 1,
                nominal: 0,
                term_estimate: "",
                term_percentage: 0,
            },
        ]);
    };

    const removeTerm = index => {
        setQuotationTerms(prev => prev.filter((_, i) => i !== index));
    };

    const updateTerm = (index, field, value) => {
        setQuotationTerms(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            if (field === "term_percentage") {
                updated[index].nominal = (total * value) / 100;
            }
            return updated;
        });
    };

    // Submit
    const submit = async status => {
        // Validation
        if (!form.client_id || !form.estimate_date || !form.expiry_date || !form.project_title) {
            alert("Data quotation wajib diisi!");
            return;
        }

        const totalPercentage = quotationTerms.reduce((sum, term) => sum + term.term_percentage, 0);
        if (totalPercentage < 100) {
            setShowLessThanModal(true);
            return;
        } else if (totalPercentage > 100) {
            setShowMoreThanModal(true);
            return;
        }

        // Fix quotation_number if it's JSON (likely copied from term_condition)
        let fixedForm = { ...form };
        if (fixedForm.quotation_number && (fixedForm.quotation_number.startsWith('[') || fixedForm.quotation_number.startsWith('{'))) {
            fixedForm.quotation_number = "";
        }

        // Get current user for revised_by
        const currentUser = getMe();

        const payload = {
            ...fixedForm,
            status,
            subtotal,
            discount: discountValue,
            tax: taxValue,
            total,
            items: quotationItems,
            terms: quotationTerms,
            revised_by: currentUser.id,
        };

        try {
            const response = await fetch(`http://localhost:3000/api/quotations/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update quotation");
            }

            if (status === "Draft") {
                setShowUpdatedModal(true);
            } else {
                setShowSentModal(true);
            }
        } catch (error) {
            console.error("Error updating quotation:", error);
            alert("Error updating quotation: " + error.message);
        }
    };

    // Handle modal close
    const handleCloseUpdatedModal = () => {
        setShowUpdatedModal(false);
        navigate("/quotations");
    };

    const handleCloseSentModal = () => {
        setShowSentModal(false);
        navigate("/quotations");
    };

    // Keyboard event for modals
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showUpdatedModal || showSentModal || showLessThanModal || showMoreThanModal || showNoProjectModal) {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    if (showUpdatedModal) {
                        handleCloseUpdatedModal();
                    } else if (showSentModal) {
                        handleCloseSentModal();
                    } else if (showLessThanModal) {
                        setShowLessThanModal(false);
                    } else if (showMoreThanModal) {
                        setShowMoreThanModal(false);
                    } else if (showNoProjectModal) {
                        setShowNoProjectModal(false);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showUpdatedModal, showSentModal, showLessThanModal, showMoreThanModal, showNoProjectModal]);

    if (loading) {
        return (
            <QuotationLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </QuotationLayout>
        );
    }

    return (
        <QuotationLayout>
            <div className="p-6">
                <h1 className="text-xl font-semibold mb-6">Edit Quotation</h1>
                <div className="space-y-6 p-6 bg-white rounded border border-gray-200">
                    {/* QUOTATION NUMBER */}
                    <div>
                        <label className="block mb-1 font-semibold">Quotation Number</label>
                        <input
                            value={form.quotation_number}
                            onChange={e => setForm({ ...form, quotation_number: e.target.value })}
                            className="w-full border border-gray-200 px-3 py-2 rounded"
                            placeholder="Leave blank for auto-generate..."
                        />
                    </div>

                    {/* CLIENT */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                        <div className="flex-1 w-full relative">
                            <label className="block mb-1 text-sm font-semibold">Client <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={searchTermClient}
                                onChange={handleSearchClientChange}
                                onFocus={() => setShowDropdownClient(true)}
                                onBlur={() => setTimeout(() => setShowDropdownClient(false), 200)}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                                placeholder="Search and select client..."
                            />
                            {showDropdownClient && filteredClients.length > 0 && (
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

                        {/* <button
                            onClick={() => navigate("/clients/new")}
                            className="border border-black px-3 py-2 rounded text-sm w-full sm:w-auto"
                        >
                            New Client
                        </button> */}
                    </div>



                    {/* DATES */}
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1">
                            <label className="block mb-1 font-semibold">Quotation Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={form.estimate_date}
                                onChange={e => setForm({ ...form, estimate_date: e.target.value })}
                                className="w-full border border-gray-200 px-3 py-2 rounded"
                            />
                        </div>

                        <div className="flex-1">
                            <label className="block mb-1 font-semibold">Expiry Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={form.expiry_date}
                                onChange={e => setForm({ ...form, expiry_date: e.target.value })}
                                className="w-full border border-gray-200 px-3 py-2 rounded"
                            />
                        </div>
                    </div>

                    {/* PROJECT */}
                    <div className="relative">
                        <label className="block mb-1 font-semibold">Project Title <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={searchTermProject}
                            onChange={handleSearchProjectChange}
                            onFocus={() => {
                                handleProjectFocus();
                                setShowDropdownProject(true);
                            }}
                            onBlur={() => setTimeout(() => setShowDropdownProject(false), 200)}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                            placeholder="Search and select project..."
                        />
                        {showDropdownProject && filteredProjects.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 max-h-40 overflow-y-auto">
                                {filteredProjects.map((project) => (
                                    <li
                                        key={project.id}
                                        onMouseDown={() => handleProjectSelect(project)}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        {project.project_title}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1">
                            <label className="block mb-1 font-semibold">Start Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={e => setForm({ ...form, start_date: e.target.value })}
                                className="w-full border border-gray-200 px-3 py-2 rounded"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block mb-1 font-semibold">Deadline <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={form.deadline}
                                onChange={e => setForm({ ...form, deadline: e.target.value })}
                                className="w-full border border-gray-200 px-3 py-2 rounded"
                            />
                        </div>
                    </div> */}

                    {/* ITEM LIST */}
                    <div className="mt-6 flex flex-col">
                        <h3 className="font-semibold mb-3">Item List</h3>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg flex-1">
                            <table className="w-full text-sm min-w-[800px]">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 text-center font-semibold">Detail Item</th>
                                        <th className="p-3 text-center w-28 font-semibold">Unit</th>
                                        <th className="p-3 text-center w-28 font-semibold">Qty</th>
                                        <th className="p-3 text-center w-36 font-semibold">Price</th>
                                        <th className="p-3 text-center w-36 font-semibold">Total</th>
                                        <th className="p-3 text-center w-12 font-semibold">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {quotationItems.map((item, index) => (
                                        <tr key={index}>
                                            {/* DETAIL ITEM */}
                                            <td className="p-3">
                                                <div className="relative mb-2">
                                                    <input
                                                        type="text"
                                                        value={searchTermItems[index] || ""}
                                                        onChange={(e) => handleSearchItemChange(index, e)}
                                                        onFocus={() => setShowDropdownItems(prev => {
                                                            const updated = [...prev];
                                                            updated[index] = true;
                                                            return updated;
                                                        })}
                                                        onBlur={() => setTimeout(() => setShowDropdownItems(prev => {
                                                            const updated = [...prev];
                                                            updated[index] = false;
                                                            return updated;
                                                        }), 200)}
                                                        className="w-full border border-gray-200 rounded p-2 text-sm"
                                                        placeholder="Search and select item..."
                                                    />
                                                    {showDropdownItems[index] && filteredItems(index).length > 0 && (
                                                        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 max-h-40 overflow-y-auto">
                                                            {filteredItems(index).map((item) => (
                                                                <li
                                                                    key={item.id}
                                                                    onMouseDown={() => handleItemSelect(index, item)}
                                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                                >
                                                                    {item.item_name}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                <input
                                                    className="w-full border border-gray-200 rounded p-2 text-sm mb-2"
                                                    placeholder="Item Name"
                                                    value={item.item_name}
                                                    onChange={(e) =>
                                                        updateItem(index, "item_name", e.target.value)
                                                    }
                                                />

                                                <input
                                                    className="w-full border border-gray-200 rounded p-2 text-sm"
                                                    placeholder="Description"
                                                    value={item.description}
                                                    onChange={(e) =>
                                                        updateItem(index, "description", e.target.value)
                                                    }
                                                />
                                            </td>

                                            {/* UNIT */}
                                            <td className="p-3">
                                                <input
                                                    className="w-full border border-gray-200 rounded p-2 text-sm"
                                                    placeholder="Unit"
                                                    value={item.unit}
                                                    onChange={(e) =>
                                                        updateItem(index, "unit", e.target.value)
                                                    }
                                                />
                                            </td>

                                            {/* QTY */}
                                            <td className="p-3 text-right">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full border border-gray-200 rounded p-2 text-right"
                                                    value={item.qty}
                                                    onChange={(e) =>
                                                        updateItem(index, "qty", e.target.value)
                                                    }
                                                />
                                            </td>

                                            {/* PRICE */}
                                            <td className="p-3 text-right">
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-200 rounded p-2 text-right"
                                                    value={"Rp " + item.price.toLocaleString()}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/Rp\s?/g, '').replace(/,/g, '');
                                                        updateItem(index, "price", parseFloat(value) || 0);
                                                    }}
                                                />
                                            </td>

                                            {/* TOTAL */}
                                            <td className="p-3 text-right">
                                                <span className="w-full p-2 text-right block">
                                                    Rp {(item.qty * item.price).toLocaleString()}
                                                </span>
                                            </td>

                                            {/* ACTION */}
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => removeLine(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={addLine}
                            className="mt-3 flex items-center gap-2 text-white bg-blue-600 px-3 py-2 rounded self-end"
                        >
                            <Plus size={16} /> Add New Line
                        </button>
                    </div>

                    {/* TERM LIST */}
                    <div className="mt-6 flex flex-col">
                        <h3 className="font-semibold mb-3">Payment Terms <span className="text-red-500">*</span></h3>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg flex-1">
                            <table className="w-full text-sm min-w-[600px]">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 text-center w-32 font-semibold">Term Number</th>
                                        <th className="p-3 text-center w-40 hidden sm:table-cell font-semibold">Term Percentage</th>
                                        <th className="p-3 text-center w-40 hidden sm:table-cell font-semibold">Nominal</th>
                                        <th className="p-3 text-center w-48 hidden sm:table-cell font-semibold">Term Estimate</th>
                                        <th className="p-3 text-center w-12 font-semibold">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {quotationTerms.map((term, index) => (
                                        <tr key={index} >
                                            {/* TERM NUMBER */}
                                            <td className="p-3 text-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full border border-gray-200 rounded p-2 text-center"
                                                    value={term.term_number}
                                                    onChange={(e) =>
                                                        updateTerm(index, "term_number", Number(e.target.value))
                                                    }
                                                />
                                            </td>

                                            {/* TERM PERCENTAGE */}
                                            <td className="p-3 text-right">
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-200 rounded p-2 text-right"
                                                    value={term.term_percentage + "%"}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/%/g, '');
                                                        updateTerm(index, "term_percentage", Number(value) || 0);
                                                    }}
                                                />
                                            </td>

                                            {/* NOMINAL */}
                                            <td className="p-3 text-right">
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-200 rounded p-2 text-right"
                                                    value={"Rp " + term.nominal.toLocaleString()}
                                                    disabled
                                                />
                                            </td>

                                            {/* TERM ESTIMATE */}
                                            <td className="p-3">
                                                <input
                                                    type="date"
                                                    className="w-full border border-gray-200 rounded p-2"
                                                    value={term.term_estimate}
                                                    onChange={(e) =>
                                                        updateTerm(index, "term_estimate", e.target.value)
                                                    }
                                                />
                                            </td>

                                            {/* ACTION */}
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => removeTerm(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={addTerm}
                            className="mt-3 flex items-center gap-2 text-white bg-blue-600 px-3 py-2 rounded self-end"
                        >
                            <Plus size={16} /> Add New Term
                        </button>
                    </div>

                    {/* TERM CONDITION */}
                    <div>
                        <label className="block mb-1 font-semibold">Term & Conditions</label>
                        <SlateEditor
                            value={form.term_condition}
                            onChange={(value) => setForm({ ...form, term_condition: value })}
                            placeholder="Enter term conditions..."
                        />
                    </div>

                    {/* SUMMARY */}
                    <div className="w-100 ml-auto border border-gray-200 rounded p-4 space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>Rp {subtotal.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span>Discount</span>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={form.discount}
                                    onChange={e => setForm({ ...form, discount: e.target.value })}
                                    className="w-20 border border-gray-200 rounded px-2"
                                />
                                <select
                                    value={form.discount_type}
                                    onChange={e => setForm({ ...form, discount_type: e.target.value })}
                                    className="border border-gray-200 rounded px-2"
                                >
                                    <option value="percent">%</option>
                                    <option value="nominal">Rp</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span>Tax</span>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={form.tax}
                                    onChange={e => setForm({ ...form, tax: e.target.value })}
                                    className="w-20 border border-gray-200 rounded px-2"
                                />
                                <select
                                    value={form.tax_type}
                                    onChange={e => setForm({ ...form, tax_type: e.target.value })}
                                    className="border border-gray-200 rounded px-2"
                                >
                                    <option value="percent">%</option>
                                    <option value="nominal">Rp</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>Rp {total.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* ACTION */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => submit("Draft")}
                            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                        >
                            Save as Draft
                        </button>
                        <button
                            onClick={() => submit("Sent")}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Update & Sent
                        </button>
                        <button
                            onClick={() => navigate("/quotations")}
                            className="border border-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {/* ALERT MODAL */}
            {showAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowAlert(false)}
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
                                    onClick={() => setShowAlert(false)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* UPDATED MODAL */}
            {showUpdatedModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={handleCloseUpdatedModal}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                                    <CheckCircle size={16} />
                                </div>
                                <h3 className="text-lg font-semibold">Success</h3>
                            </div>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-gray-700">Quotation successfully updated!</p>
                            <div className="flex justify-end mt-6">
                                <button
                                    autoFocus
                                    onClick={handleCloseUpdatedModal}
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

            {/* SENT MODAL */}
            {showSentModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={handleCloseSentModal}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                                    <CheckCircle size={16} />
                                </div>
                                <h3 className="text-lg font-semibold">Success</h3>
                            </div>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-gray-700">Quotation successfully sent!</p>
                            <div className="flex justify-end mt-6">
                                <button
                                    autoFocus
                                    onClick={handleCloseSentModal}
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

            {/* LESS THAN MODAL */}
            {showLessThanModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowLessThanModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <X size={16} />
                                </div>
                                <h3 className="text-lg font-semibold">Error</h3>
                            </div>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-gray-700">The term payment percentage must not be less than 100%</p>
                            <div className="flex justify-end mt-6">
                                <button
                                    autoFocus
                                    onClick={() => setShowLessThanModal(false)}
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

            {/* MORE THAN MODAL */}
            {showMoreThanModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowMoreThanModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <X size={16} />
                                </div>
                                <h3 className="text-lg font-semibold">Error</h3>
                            </div>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-gray-700">The percentage of payment terms must not be more than 100%</p>
                            <div className="flex justify-end mt-6">
                                <button
                                    autoFocus
                                    onClick={() => setShowMoreThanModal(false)}
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

            {/* NO PROJECT MODAL */}
            {showNoProjectModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowNoProjectModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 z-50 shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                    <CheckCircle size={16} />
                                </div>
                                <h3 className="text-lg font-semibold">Notice</h3>
                            </div>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-gray-700">The client doesn't have a project yet.</p>
                            <div className="flex justify-end mt-6 gap-3">
                                <button
                                    onClick={() => setShowNoProjectModal(false)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    autoFocus
                                    onClick={() => navigate("/projects/new")}
                                    tabIndex={0}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Add Project
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </QuotationLayout>
    );
};

export default EditQuotation;
