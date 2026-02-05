import ClientSidebar from "../sidebar/ClientSidebar";

const ClientPaymentLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen">
            <ClientSidebar />
            <main className="flex-1 bg-white">
                {children}
            </main>
        </div>
    );
};

export default ClientPaymentLayout;
