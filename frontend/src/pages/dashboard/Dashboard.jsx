import DashboardLayout from "../../components/layout/Dashboard-Layout";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { useEffect, useState } from "react";
import { getDashboardData } from "../../services/dashboardService";


const Dashboard = () => {
    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState("");
    const [dashboardData, setDashboardData] = useState({
        quotationSummary: [],
        invoiceSummary: [],
        recentInvoices: [],
        overdueNotifications: [],
        quotationNotifications: []
    });
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const initDashboard = async () => {
            try {

                const user = JSON.parse(localStorage.getItem("user"));

                if (!user) {
                    window.location.replace("/login");
                    return;
                }

                if (user.role !== "admin") {
                    window.location.replace("/unauthorized");
                    return;
                }


                setUserName(user.username);
                setUserRole(user.role);


                await fetchDashboardData();
            } catch (error) {
                console.error("Dashboard init error:", error);
                window.location.replace("/login");
            } finally {
                setLoading(false);
            }
        };

        initDashboard();
    }, []);


    /* =========================
       FETCH DASHBOARD DATA
    ========================= */
    const fetchDashboardData = async () => {
        try {
            const data = await getDashboardData();
            console.log("Data API From", data.invoiceSummary);
            setDashboardData(data);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            // Set empty data on error
            setDashboardData({
                quotationSummary: [],
                invoiceSummary: [],
                recentInvoices: [],
                overdueNotifications: [],
                quotationNotifications: []
            });
        }
    };


    /* =========================
       WELCOME MESSAGE
    ========================= */
    const getWelcomeMessage = () => {
        return `Hello ${userName}! Check the Qoutation and Invoice summary below.`;
    };

    // Prepare data for charts
    const getQuotationStatusColor = (status) => {
        if (status === 'Draft') return 'gray';
        if (status === 'Sent') return 'blue';
        if (status === 'Approved') return 'green';
        if (status === 'Rejected') return 'red';
        if (status === 'Expired') return 'red';
    };

    const getInvoiceStatusColor = (status) => {
        if (status === 'Draft') return 'grey';
        if (status === 'Issued') return 'yellow';
        if (status === 'Partially Paid') return 'blue';
        if (status === 'Paid') return 'green';
        if (status === 'Overdue') return 'red';
    };

    const getHexColor = (color) => {
        if (color === 'gray') return '#9CA3AF';
        if (color === 'blue') return '#3B82F6';
        if (color === 'green') return '#22C55E';
        if (color === 'red') return '#EF4444';
        if (color === 'grey') return '#6B7280';
        if (color === 'yellow') return '#EAB308';
    };

    const allQuotationStatuses = ['Draft', 'Sent', 'Revised', 'Approved', 'Rejected', 'Expired'];
    const quotationData = allQuotationStatuses.map(status => {
        const found = dashboardData.quotationSummary.find(item => item.status === status);
        return {
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: found ? found.count : 0,
            color: getQuotationStatusColor(status)
        };
    });



    const allInvoiceStatuses = ['Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue'];
    const invoiceData = allInvoiceStatuses.map(status => {
        const found = dashboardData.invoiceSummary.find(item => item.status.toLowerCase() === status.toLocaleLowerCase()
        );
        return {
            name: status,
            value: found ? Number(found.count) : 0,
            color: getInvoiceStatusColor(status)
        };
    });

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
        <DashboardLayout>
            <div className="m-3 flex flex-col gap-2.5">

                {/* TITLE */}
                <div className="rounded-xl p-5" style={{
                    background: `linear-gradient(135deg, #0004FF 0%, #3B82F6 100%)`
                }}>
                    <h1 className="text-2xl text-white font-bold">Dashboard</h1>
                    <p className="text-white">
                        {getWelcomeMessage()}
                    </p>
                </div>

                {/* RECENT INVOICES TABLE */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">Recent Invoices</h2>
                    {dashboardData.recentInvoices && dashboardData.recentInvoices.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Invoice Number</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Client</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Total</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {dashboardData.recentInvoices.slice(0, 5).map((inv, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{inv.invoice_number}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{inv.company_name}</td>
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
                                                {inv.due_date ? new Date(inv.due_date).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit'
                                                }) : 'N/A'}
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
                <div className="flex flex-wrap gap-2.5">

                    {/* BAR CHART */}
                    <div className="flex-1 min-w-[300px] bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="font-semibold mb-4">
                            Quotation Summary
                        </h3>

                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={quotationData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* PIE CHART INVOICE */}
                    <div className="flex-1 min-w-[300px] bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="font-semibold mb-4">
                            Invoice Summary
                        </h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={invoiceData}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={90}
                                    label
                                >
                                    {invoiceData.map((inv, i) => (
                                        <Cell key={i} fill={getHexColor(inv.color)} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Keterangan Status Invoice */}
                        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3">
                            {invoiceData.map((inv, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span
                                        className="inline-block rounded"
                                        style={{
                                            width: 12,
                                            height: 12,
                                            background: getHexColor(inv.color),
                                            borderRadius: 3
                                        }}
                                    />
                                    <span className="text-sm">
                                        {inv.name} <span>({inv.value})</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* BOTTOM SECTION */}
                <div className="flex flex-wrap gap-2.5">

                    {/* OVERDUE */}
                    <div className="flex-1 min-w-[300px] bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="font-semibold mb-4">
                            Invoice Overdue
                        </h3>

                        <ul className="space-y-3 text-sm">
                            {dashboardData.overdueNotifications?.length > 0 ? dashboardData.overdueNotifications.map((inv, i) => (
                                <li key={i} className="flex justify-between">
                                    <span>{inv.invoice_number} • {inv.company_name} • {inv.status}</span>
                                    <span className="text-red-500 font-regular">
                                        Rp {Number(inv.total).toLocaleString("id-ID")} ({inv.days_overdue} days overdue)
                                    </span>
                                </li>
                            )) : (
                                <li className="text-gray-500">No overdue invoices</li>
                            )}
                        </ul>
                    </div>

                    {/* QUOTATION NOTIFICATIONS */}
                    <div className="flex-1 min-w-[300px] bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="font-semibold mb-4">
                            Quotation Notifications
                        </h3>

                        <ul className="space-y-3 text-sm">
                            {dashboardData.quotationNotifications?.length > 0 ? (
                                dashboardData.quotationNotifications.map((notif, i) => (
                                    <li key={i} className="flex justify-between">
                                        <span>
                                            {notif.ref} - {new Date(notif.date).toLocaleDateString()}
                                        </span>
                                        <span
                                            className={
                                                notif.status === "Approved" ? "text-green-500" :
                                                    notif.status === "Sent" ? "text-blue-500" :
                                                        notif.status === "Revised" ? "text-yellow-500" :
                                                            notif.status === "Rejected" ? "text-red-500" :
                                                                notif.status === "Expired" ? "text-red-600"
                                                                    : "text-gray-500"
                                            }
                                        >
                                            {notif.status}
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-500">No recent quotation notifications</li>
                            )}
                        </ul>

                    </div>
                </div>
            </div>
        </DashboardLayout >
    );
};

export default Dashboard;
