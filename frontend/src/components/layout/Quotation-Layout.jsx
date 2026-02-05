import Sidebar from "../sidebar/Sidebar";

const QuotationLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 bg-white">
                {children}
            </main>
        </div>
    );
}
export default QuotationLayout;
