import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import AdminRoute from "./components/common/AdminRoute";
import ClientRoute from "./components/common/ClientRoute";
import { Buffer } from 'buffer';

// Login
import Login from "./pages/auth/Login";

// Admin Route
import Dashboard from "./pages/dashboard/Dashboard";
import Client from "./pages/client/Client";
import AddClient from "./pages/client/addClient";
import EditClient from "./pages/client/editClient";
import TrashClient from "./pages/client/trashClient";
import Item from "./pages/item/Item";
import AddItem from "./pages/item/addItem";
import EditItem from "./pages/item/editItem";
import TrashItem from "./pages/item/trashItem";
import Projects from "./pages/project/Project";
import AddProject from "./pages/project/addProject";
import EditProject from "./pages/project/editProject";
import TrashProject from "./pages/project/trashProject";
import Quotation from "./pages/quotation/Quotation";
import AddQuotation from "./pages/quotation/addQuotation";
import EditQuotation from "./pages/quotation/editQuotation";
import QuotationDetail from "./pages/quotation/quotationDetail";
import Invoice from "./pages/invoice/Invoice";
import InvoiceDetail from "./pages/invoice/invoiceDetail";
import InvoiceEdit from "./pages/invoice/invoiceEdit";
import PaymentHistory from "./pages/payment/paymentHistory";
import ClientPayment from "./pages/payment/Payment";


// Client Route
import ClientDashboard from "./pages/client-side/dashboard/ClientDashboard";
import ClientQuotation from "./pages/client-side/quotation/ClientQuotation";
import ClientQuotationDetail from "./pages/client-side/quotation/ClientQuotationDetail";
import ClientInvoice from "./pages/client-side/invoice/ClientInvoice";
import ClientInvoiceDetail from "./pages/client-side/invoice/ClientInvoiceDetail";
import ClientPaymentHistory from "./pages/client-side/payment/paymentHistory";

function App() {
  window.Buffer = window.Buffer || Buffer;
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />

        {/* ADMIN */}
        <Route path="/dashboard" element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        } />

        <Route path="/clients" element={<AdminRoute><Client /></AdminRoute>} />
        <Route path="/clients/new" element={<AdminRoute><AddClient /></AdminRoute>} />
        <Route path="/clients/edit/:id" element={<AdminRoute><EditClient /></AdminRoute>} />
        <Route path="/clients/trash" element={<AdminRoute><TrashClient /></AdminRoute>} />

        <Route path="/items" element={<AdminRoute><Item /></AdminRoute>} />
        <Route path="/items/new" element={<AdminRoute><AddItem /></AdminRoute>} />
        <Route path="/items/edit/:id" element={<AdminRoute><EditItem /></AdminRoute>} />
        <Route path="/items/trash" element={<AdminRoute><TrashItem /></AdminRoute>} />

        <Route path="/projects" element={<AdminRoute><Projects /></AdminRoute>} />
        <Route path="/projects/new" element={<AdminRoute><AddProject /></AdminRoute>} />
        <Route path="/projects/edit/:id" element={<AdminRoute><EditProject /></AdminRoute>} />
        <Route path="/projects/trash" element={<AdminRoute><TrashProject /></AdminRoute>} />

        <Route path="/quotations" element={<AdminRoute><Quotation /></AdminRoute>} />
        <Route path="/quotations/new" element={<AdminRoute><AddQuotation /></AdminRoute>} />
        <Route path="/quotations/edit/:id" element={<AdminRoute><EditQuotation /></AdminRoute>} />
        <Route path="/quotations/:id" element={<AdminRoute><QuotationDetail /></AdminRoute>} />

        <Route path="/invoices" element={<AdminRoute><Invoice /></AdminRoute>} />
        <Route path="/invoices/edit/:id" element={<AdminRoute><InvoiceEdit /></AdminRoute>} />
        <Route path="/invoices/:id" element={<AdminRoute><InvoiceDetail /></AdminRoute>} />

        <Route path="/payment-history" element={<AdminRoute><PaymentHistory /></AdminRoute>} />
        <Route path="/client-payment" element={<AdminRoute><ClientPayment /></AdminRoute>} />

        {/* Client */}

        <Route path="/client-dashboard" element={
          <ClientRoute>
            <ClientDashboard />
          </ClientRoute>
        } />

        <Route path="/client-quotation" element={<ClientRoute><ClientQuotation /></ClientRoute>} />
        <Route path="/client-quotation/:id" element={<ClientRoute><ClientQuotationDetail /></ClientRoute>} />

        <Route path="/client-invoice" element={<ClientRoute><ClientInvoice /></ClientRoute>} />
        <Route path="/client-invoice/:id" element={<ClientRoute><ClientInvoiceDetail /></ClientRoute>} />

        <Route path="/client-payment-history" element={<ClientRoute><ClientPaymentHistory /></ClientRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
