import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router";
import {
    Home,
    ReceiptText,
    CreditCard,
    LogOut,
    History,
    Receipt,
    Menu
} from "lucide-react";

const ClientSidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => JSON.parse(localStorage.getItem('isCollapsed')) || false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        localStorage.setItem('isCollapsed', JSON.stringify(isCollapsed));
    }, [isCollapsed]);

    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const itemClass = (isActive) =>
        `flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-4"} py-2.5 rounded-lg transition-all duration-200 text-sm ${isActive ? "bg-blue-600 text-white " : "text-gray-700 hover:bg-gray-200"
        }`;

    return (
        <>
            <aside className={`${isCollapsed ? "w-20" : "w-64"} bg-gray-100 border-r border-gray-300 sticky top-0 h-screen transition-all duration-300 flex flex-col z-40`}>

                {/* HEADER: LOGO & HAMBURGER */}
                <div className={`h-16 flex items-center ${isCollapsed ? "justify-center" : "justify-between px-4"} border-b border-gray-300`}>
                    {!isCollapsed && (
                        <div className="flex items-center overflow-hidden animate-in fade-in duration-300">
                            <img src="/image/logo-btek.png" alt="logo" className="w-7 h-7 shrink-0" />
                            <h1 className="text-sm font-bold italic ml-2 whitespace-nowrap tracking-tight text-gray-800">
                                BTEK Invoiceflow
                            </h1>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        <Menu size={20} />
                    </button>
                </div>

                {/* NAV MENU */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
                    <NavLink title="Dashboard" to="/client-dashboard" className={({ isActive }) => itemClass(isActive)}>
                        <Home size={18} />
                        {!isCollapsed && <span className="animate-in slide-in-from-left-2">Dashboard</span>}
                    </NavLink>

                    <NavLink title="Quotation" to="/client-quotation" className={({ isActive }) => itemClass(isActive)}>
                        <ReceiptText size={18} />
                        {!isCollapsed && <span className="animate-in slide-in-from-left-2">Quotation</span>}
                    </NavLink>

                    <NavLink title="Invoice" to="/client-invoice" className={({ isActive }) => itemClass(isActive)}>
                        <Receipt size={18} />
                        {!isCollapsed && <span className="animate-in slide-in-from-left-2">Invoice</span>}
                    </NavLink>

                    <NavLink title="Payment History" to="/client-payment-history" className={({ isActive }) => itemClass(isActive)}>
                        <History size={18} />
                        {!isCollapsed && <span className="animate-in slide-in-from-left-2 whitespace-nowrap">History</span>}
                    </NavLink>

                    {/* LOG OUT BUTTON */}
                    <div className="pt-4 mt-4 border-t border-gray-300">
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-4"} py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 `}
                        >
                            <LogOut size={18} />
                            {!isCollapsed && <span className="font-medium">Log Out</span>}
                        </button>
                    </div>
                </nav>

                {/* CENTERED POP-UP MODAL */}
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop Overlay */}
                        <div
                            className="absolute inset-0 bg-black/60 banimate-in fade-in duration-200"
                            onClick={() => setShowLogoutConfirm(false)}
                        ></div>

                        {/* Modal Card */}
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                <LogOut size={32} className="text-red-600" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">Logout</h3>
                            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                                Are you sure you want to Log Out?
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 "
                                >
                                    Yes, Logout
                                </button>
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Footer */}
                {!isCollapsed && (
                    <div className="p-4 text-center border-t border-gray-300">
                        <p className="text-[10px] text-gray-400  tracking-widest">&copy; {new Date().getFullYear()} Bandung Teknologi Semesta</p>
                    </div>
                )}
            </aside>
        </>
    );
};

export default ClientSidebar;