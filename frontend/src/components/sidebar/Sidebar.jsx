import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router";
import { logout } from "../../services/authService";
import {
    Home, Users, Database, Box, FolderOpen, Receipt,
    ReceiptText, History, LogOut, ChevronDown, ChevronUp, Menu, CreditCard
} from "lucide-react";

const Sidebar = () => {
    const [openMaster, setOpenMaster] = useState(() => JSON.parse(localStorage.getItem('openMaster')) || false);
    const [isCollapsed, setIsCollapsed] = useState(() => JSON.parse(localStorage.getItem('isCollapsed')) || false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showMasterPopup, setShowMasterPopup] = useState(false);

    const location = useLocation();
    const hideTimeoutRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('openMaster', JSON.stringify(openMaster));
    }, [openMaster]);

    useEffect(() => {
        localStorage.setItem('isCollapsed', JSON.stringify(isCollapsed));
        if (!isCollapsed) {
            setShowMasterPopup(false);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
        }
    }, [isCollapsed]);

    const handleLogout = async () => {
        try { await logout(); } catch (err) { console.error("Logout error:", err); }
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const [popupTop, setPopupTop] = useState(0);

    const itemClass = (isActive) =>
        `flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-4"} py-2.5 rounded-lg transition-all duration-200 text-sm ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
        }`;

    const subItemClass = (isActive) =>
        `flex items-center gap-3 px-4 py-2 rounded-md transition-all text-sm ${isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
        }`;

    return (
        <>
            <aside className={`${isCollapsed ? "w-20" : "w-64"} bg-gray-100 border-r border-gray-300 sticky top-0 h-screen transition-all duration-300 flex flex-col z-40`}>

                {/* HEADER */}
                <div className={`h-16 flex items-center ${isCollapsed ? "justify-center" : "justify-between px-4"} border-b border-gray-300`}>
                    {!isCollapsed && (
                        <div className="flex items-center overflow-hidden">
                            <img src="/image/logo-btek.png" alt="logo" className="w-7 h-7 shrink-0" />
                            <h1 className="text-sm font-bold italic ml-2 whitespace-nowrap">BTEK Invoiceflow</h1>
                        </div>
                    )}
                    <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <Menu size={20} />
                    </button>
                </div>

                {/* NAV MENU */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-visible">
                    <NavLink to="/dashboard" className={({ isActive }) => itemClass(isActive)}>
                        <Home size={18} />
                        {!isCollapsed && <span>Dashboard</span>}
                    </NavLink>

                    {/* MASTER DATA GROUP */}
                    <div
                        className="pt-2 relative"
                        onMouseEnter={(e) => {
                            if (isCollapsed) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPopupTop(rect.top);
                                if (hideTimeoutRef.current) {
                                    clearTimeout(hideTimeoutRef.current);
                                    hideTimeoutRef.current = null;
                                }
                                setShowMasterPopup(true);
                            }
                        }}
                        onMouseLeave={() => {
                            if (isCollapsed) {
                                hideTimeoutRef.current = setTimeout(() => {
                                    setShowMasterPopup(false);
                                }, 200);
                            }
                        }}
                    >
                        <button
                            onClick={() => !isCollapsed && setOpenMaster(!openMaster)}
                            className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between px-4"} py-2 text-[10px] font-bold uppercase text-gray-400 tracking-widest hover:text-gray-600 transition-colors`}
                        >
                            <div className="flex items-center gap-3">
                                <Database size={18} />
                                {!isCollapsed && <span>Master Data</span>}
                            </div>
                            {!isCollapsed && (openMaster ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </button>

                        {/* NORMAL SUBMENU (Expanded Sidebar) */}
                        {!isCollapsed && openMaster && (
                            <div className="mt-1 ml-4 border-l-2 border-gray-300 pl-2 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                <NavLink to="/clients" className={({ isActive }) => subItemClass(isActive)}>
                                    <Users size={16} /> <span>Client</span>
                                </NavLink>
                                <NavLink to="/items" className={({ isActive }) => subItemClass(isActive)}>
                                    <Box size={16} /> <span>Item</span>
                                </NavLink>
                                <NavLink to="/projects" className={({ isActive }) => subItemClass(isActive)}>
                                    <FolderOpen size={16} /> <span>Project</span>
                                </NavLink>
                            </div>
                        )}

                        {/* POPUP FLYOUT (Collapsed Sidebar) */}
                        {isCollapsed && showMasterPopup && (
                            <>
                                <div className="absolute left-full top-0 w-4 h-full" />
                                <div
                                    className=" ml-2 fixed left-20 top-auto bg-white border border-gray-300 rounded-xl w-48 py-2 z-[60] animate-in fade-in slide-in-from-left-2 duration-200"
                                    style={{ top: `${popupTop}px` }}

                                    onMouseEnter={() => {
                                        if (hideTimeoutRef.current) {
                                            clearTimeout(hideTimeoutRef.current);
                                            hideTimeoutRef.current = null;
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        hideTimeoutRef.current = setTimeout(() => {
                                            setShowMasterPopup(false);
                                        }, 200);
                                    }}
                                >
                                    <div className="px-4 py-2 mb-1 border-b border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master Data</p>
                                    </div>
                                    <div className="px-2 space-y-1">
                                        <NavLink
                                            to="/clients"
                                            className={({ isActive }) => subItemClass(isActive)}
                                            onClick={() => setShowMasterPopup(false)}
                                        >
                                            <Users size={16} /> <span>Client</span>
                                        </NavLink>
                                        <NavLink
                                            to="/items"
                                            className={({ isActive }) => subItemClass(isActive)}
                                            onClick={() => setShowMasterPopup(false)}
                                        >
                                            <Box size={16} /> <span>Item</span>
                                        </NavLink>
                                        <NavLink
                                            to="/projects"
                                            className={({ isActive }) => subItemClass(isActive)}
                                            onClick={() => setShowMasterPopup(false)}
                                        >
                                            <FolderOpen size={16} /> <span>Project</span>
                                        </NavLink>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* TRANSACTIONS */}
                    <div className="pt-2 space-y-2">
                        <NavLink to="/quotations" className={({ isActive }) => itemClass(isActive)}>
                            <ReceiptText size={18} />
                            {!isCollapsed && <span>Quotation</span>}
                        </NavLink>
                        <NavLink to="/invoices" className={({ isActive }) => itemClass(isActive)}>
                            <Receipt size={18} />
                            {!isCollapsed && <span>Invoice</span>}
                        </NavLink>
                        <NavLink title="Payment" to="/client-payment" className={({ isActive }) => itemClass(isActive)}>
                            <CreditCard size={18} />
                            {!isCollapsed && <span className="animate-in slide-in-from-left-2">Payment</span>}
                        </NavLink>
                        <NavLink to="/payment-history" className={({ isActive }) => itemClass(isActive)}>
                            <History size={18} />
                            {!isCollapsed && <span>History</span>}
                        </NavLink>
                    </div>

                    {/* LOGOUT */}
                    <div className="pt-4 border-t border-gray-300 mt-4">
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-4"} py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600`}
                        >
                            <LogOut size={18} />
                            {!isCollapsed && <span className="font-medium">Log Out</span>}
                        </button>
                    </div>
                </nav>

                {!isCollapsed && (
                    <div className="p-4 border-t border-gray-300 text-center">
                        <p className="text-[10px] text-gray-400 ">&copy; {new Date().getFullYear()} Bandung Teknologi Semesta</p>
                    </div>
                )}
            </aside>

            {/* LOGOUT POP UP*/}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 " onClick={() => setShowLogoutConfirm(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <LogOut size={32} className="text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Log Out</h3>
                        <p className="text-sm text-gray-500 mb-8">Are you sure you want to logout?</p>
                        <div className="flex gap-4">
                            <button onClick={handleLogout} className="flex-1 px-4 py-3 bg-red-600 text-white text-sm font-bold rounded-xl 
                            hover:bg-red-700">Yes, Logout</button>
                            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 text-sm font-bold rounded-xl
                             hover:bg-gray-50 transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;