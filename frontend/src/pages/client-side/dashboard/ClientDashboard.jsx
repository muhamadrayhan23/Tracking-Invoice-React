import { useEffect, useState } from "react";
import ClientDashboardLayout from "../../../components/client-layout/Dashboard-Layout";
import { getClientDashboardData } from "../../../services/clientDashboardService";
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart,
    Bar, AreaChart, Area
} from "recharts";



const ClientDashboard = () => {
    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState("client");
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        quotations: [],
        invoices: [],
        overdueInvoices: [],
        paymentStatus: [],
        quotationSummary: [],
        invoiceSummary: []
    });


    useEffect(() => {
        const initClientDashboard = async () => {
            const user = JSON.parse(localStorage.getItem("user"));


            if (!user || !user.id) {
                window.location.href = "/login";
                return;
            }

            // Proteksi CLIENT
            if (user.role !== "client") {
                window.location.href = "/unauthorized";
                return;
            }

            try {
                setUserName(user.username);
                setUserRole(user.role);

                // Fetch data from backend
                const data = await getClientDashboardData();
                setDashboardData(data);

            } catch (err) {
                console.error("Client dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        initClientDashboard();
    }, []);


    const getWelcomeMessage = () => {
        return `Hello ${userName}! Check your Quotation and Invoice highlights here.`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };


    // Prepare data for charts
    const getQuotationStatusColor = (status) => {
        if (status === 'Sent') return 'blue';
        if (status === 'Approved') return 'green';
        if (status === 'Rejected') return 'red'; // default
    };

    const getInvoiceStatusColor = (status) => {
        if (status === 'Issued') return 'yellow';
        if (status === 'Partially Paid') return 'blue';
        if (status === 'Paid') return 'green';
        if (status === 'Overdue') return 'red';
        return 'gray';
    };

    const getHexColor = (color) => {
        if (color === 'blue') return '#3B82F6';
        if (color === 'green') return '#22C55E';
        if (color === 'red') return '#EF4444';
        if (color === 'grey') return '#6B7280';
        if (color === 'yellow') return '#EAB308';
    };

    const allQuotationStatuses = ['Sent', 'Revised', 'Approved', 'Rejected', 'Expired'];
    const quotationData = allQuotationStatuses.map(status => {
        const found = dashboardData.quotationSummary ? dashboardData.quotationSummary.find(item => item.status === status) : null;
        return {
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: found ? found.count : 0,
            color: getQuotationStatusColor(status)
        };
    });

    const allInvoiceStatuses = ['Issued', 'Partially Paid', 'Paid', 'Overdue'];
    const invoiceData = allInvoiceStatuses.map(status => {
        const found = dashboardData.invoiceSummary ? dashboardData.invoiceSummary.find(item => item.status === status) : null;
        return {
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: found ? found.count : 0,
            color: getInvoiceStatusColor(status)
        };
    });

    return (
        <ClientDashboardLayout>
            <div className="p-2.5 space-y-2.5">
                {/* TITLE */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg border border-gray-200">
                    <h1 className="text-3xl font-bold mb-2">Client Dashboard</h1>
                    <p className="text-lg">{getWelcomeMessage()}</p>
                </div>

                {/* RECENT INVOICES */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">Recent Invoices</h2>
                    {dashboardData.invoices && dashboardData.invoices.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left text-xs font-mediu uppercase tracking-wider">Invoice Number</th>
                                        <th className="px-4 py-2 text-left text-xs font-mediu uppercase tracking-wider">Total</th>
                                        <th className="px-4 py-2 text-left text-xs font-mediu uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-mediu uppercase tracking-wider">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {dashboardData.invoices.slice(0, 5).map(inv => (
                                        <tr key={inv.id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{inv.invoice_number}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Rp {Number(inv.total).toLocaleString("id-ID")}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${inv.status === 'Paid' ? 'bg-green-50 text-green-500' :
                                                    inv.status === 'Partially Paid' ? 'bg-blue-50 text-blue-500' :
                                                        inv.status === 'Issued' ? 'bg-yellow-50 text-yellow-500' :
                                                            inv.status === 'Overdue' ? 'bg-red-50 text-red-500' :
                                                                'bg-gray-50 text-gray-500'
                                                    }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                {inv.due_date ? formatDate(inv.due_date) : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">No invoices found</p>
                    )}
                </div>

                {/* CHARTS */}
                <div className="flex flex-col lg:flex-row gap-2.5">
                    {/* Invoice Status Area Chart */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 flex-1">
                        <h2 className="text-xl font-semibold mb-4">Invoice Status Summary</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={invoiceData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quotation Status Area Chart */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 flex-1">
                        <h2 className="text-xl font-semibold mb-4">Quotation Status Summary</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={quotationData}>
                                <defs>
                                    <linearGradient id="quotationGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="url(#quotationGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* BOTTOM SECTIONS */}
                <div className="flex flex-col lg:flex-row gap-2.5">
                    {/* QUOTATIONS TABLE */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 flex-1">
                        <h2 className="text-xl font-semibold mb-4">Quotations Sent to You</h2>
                        {dashboardData.quotations && dashboardData.quotations.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-2 py-2 text-left text-xs font-medium  uppercase tracking-wider">Project Title</th>
                                            <th className="px-2 py-2 text-left text-xs font-medium  uppercase tracking-wider">Estimate Date</th>
                                            <th className="px-2 py-2 text-left text-xs font-medium  uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dashboardData.quotations.slice(0, 10).map(q => (
                                            <tr key={q.id}>
                                                <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{q.project_title || 'N/A'}</td>
                                                <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                                                    {q.estimate_date ? formatDate(q.estimate_date) : 'N/A'}
                                                </td>
                                                <td className="px-2 py-2 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${q.status === 'Approved' ? 'bg-green-100 text-green-500' :
                                                        q.status === 'Sent' ? 'bg-blue-100 text-blue-500' :
                                                            q.status === 'Revised' ? 'bg-yellow-100 text-yellow-500' :
                                                                q.status === 'Rejected' ? 'bg-red-100 text-red-500' :
                                                                    'bg-red-100 text-red-800'
                                                        }`}>
                                                        {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500">No quotations found</p>
                        )}
                    </div>

                    {/* PAYMENT TERMS HIGHLIGHT */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 flex-1">
                        <h2 className="text-xl font-semibold mb-4">Payment Terms Highlight</h2>
                        {dashboardData.paymentStatus && dashboardData.paymentStatus.length > 0 ? (
                            <ul className="space-y-2">
                                {dashboardData.paymentStatus.slice(0, 3).map((term, index) => (
                                    <li
                                        key={term.id}
                                        className={`flex justify-between items-center p-3 rounded border transition-all ${index === 0
                                            ? 'bg-gray-50 border-gray-200 '
                                            : 'bg-gray-50 border-transparent'
                                            }`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-800">
                                                    {term.invoice_number} - Term {term.term_number}
                                                </span>

                                            </div>
                                            <div className="text-[11px] text-gray-500 italic">
                                                Paid on: {new Date(term.payment_date).toLocaleDateString('id-ID')}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className={`font-bold ${index === 0 ? 'text-blue-500' : 'text-gray-900'}`}>
                                                Rp {Number(term.nominal).toLocaleString("id-ID")}
                                            </div>
                                            <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block ${term.payment_status === 'paid'
                                                ? 'bg-green-100 text-green-500'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {term.payment_status}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-sm italic">No payment terms found</p>
                        )}
                    </div>
                </div>
            </div>
        </ClientDashboardLayout>
    );
};

export default ClientDashboard;
