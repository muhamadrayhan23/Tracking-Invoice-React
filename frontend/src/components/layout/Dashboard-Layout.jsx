import Sidebar from "../sidebar/Sidebar";

const DashboardLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 bg-white">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
