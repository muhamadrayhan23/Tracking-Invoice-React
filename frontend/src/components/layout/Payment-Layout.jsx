import Sidebar from "../sidebar/Sidebar";

const PaymentHistoryLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 bg-white">
                {children}
            </main>
        </div>
    );
}
export default PaymentHistoryLayout;